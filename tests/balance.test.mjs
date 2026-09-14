import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { LEVEL_1 } from '../app/games/levels/LevelOneConfig.js';
import {
  ASTEROID_BOSS_STAGES, CHAPTER_BOSSES, COLLISION_IFRAME, ENEMY_THREAT, PROJECTILE_IFRAME,
  enemyContactDamage, enemyShotDamage,
  asteroidBossEffectiveHealth, attackProfile, createIFrameGate, finalBossPhase,
  hpMultiplier, normalAsteroidFragmentStats, roomProgress,
  scaledEnemyExperience, scaledEnemyHealth, shotFormation,
} from '../app/utils/combatPatterns.js';

globalThis.defineStore = () => () => ({});
const { SkillsList } = await import('../app/stores/SkillStore.js');
const skillSource = readFileSync(new URL('../app/stores/SkillStore.js', import.meta.url), 'utf8');
const runSource = readFileSync(new URL('../app/stores/currentRunStore.ts', import.meta.url), 'utf8');

test('player upgrade tables use final non-cumulative values', () => {
  assert.deepEqual(Object.values(SkillsList.health_percentage.levels).map(x => 250 * x.value), [300,350,425,525,650]);
  assert.deepEqual(Object.values(SkillsList.damage_percentage.levels).map(x => 50 * x.value), [60,70,80,95,112.5]);
  assert.deepEqual(Object.values(SkillsList.health_regeneration.levels).map(x => x.value), [.004,.008,.012,.016,.02]);
  assert.match(skillSource, /setRegenRate\(regenAmount \* 100\)/);
  assert.doesNotMatch(skillSource, /addRegenRate\(regenAmount/);
});

test('shot upgrades match formation, damage, piercing, rear fire and range', () => {
  assert.equal(SkillsList.multishot.levels[2].value, .4);
  assert.deepEqual(shotFormation(3).map(x => x.side), [-.7,0,.7]);
  assert.equal(112.5 * (1 + 2 * SkillsList.multishot.levels[2].value), 202.5);
  assert.deepEqual(Object.values(SkillsList.piercing_shot.levels).map(x => x.value), [2,3,5,8]);
  assert.deepEqual(Object.values(SkillsList.back_shot.levels).map(x => x.value), [.65,.65]);
  assert.deepEqual(Object.values(SkillsList.range_extension.levels).map(x => Number((11*x.value).toFixed(6))), [13.5,16,19,22,25]);
  assert.ok(Math.abs(202.5/.85-238.23529411764707)<1e-12);
});

test('speed values persist when a stage is loaded and do not affect cooldown', () => {
  assert.deepEqual(Object.values(SkillsList.general_speed.levels).map(x => x.value), [1.06,1.12,1.18,1.24,1.30]);
  assert.deepEqual(Object.values(SkillsList.general_speed.levels).map(x => x.projectileValue), [1.08,1.16,1.24,1.32,1.40]);
  assert.match(runSource, /function loadStage[\s\S]*?currentMoveSpeed\.value = playerStats\.moveSpeed/);
  assert.equal(7*1.3,9.1); assert.equal(19*1.4,26.599999999999998);
  assert.match(runSource, /shotCooldown: \.85/);
});

test('room health and XP multipliers are clamped and exact', () => {
  assert.equal(hpMultiplier(2),1); assert.equal(hpMultiplier(20),1.36); assert.equal(hpMultiplier(99),1.36);
  assert.equal(roomProgress(2),0); assert.equal(roomProgress(20),1);
  assert.equal(scaledEnemyHealth(500,16),640);
  assert.equal(scaledEnemyExperience(90,19),212);
});

test('normal asteroid always creates two reduced-XP fragments', () => {
  const fragment=normalAsteroidFragmentStats(2);
  assert.deepEqual(fragment,{count:2,health:63,baseXP:5});
  assert.equal(500+fragment.count*fragment.health,626);
});

test('asteroid boss has seven bodies, 5000 effective HP and 1200 XP', () => {
  assert.deepEqual(ASTEROID_BOSS_STAGES.map(x => x.count),[1,2,4]);
  assert.equal(ASTEROID_BOSS_STAGES.reduce((n,x)=>n+x.count,0),7);
  assert.equal(asteroidBossEffectiveHealth(),5000);
  assert.equal(ASTEROID_BOSS_STAGES.reduce((n,x)=>n+x.count*x.xp,0),1200);
});

test('enemy attack progression and special asteroid generations are exact', () => {
  const expected={
    miniasteroid:[[3.6,3.4],[2.7,4.8]],
    ufo:[[3.05,3.6],[2.2,5.2]],
    ufofast:[[2.85,4],[2.05,5.6]],
    miniboss:[[2.55,4.6],[1.85,6.2]],
  };
  for(const [type,ends] of Object.entries(expected)) {
    for(const [room,index] of [[2,0],[20,1]]) {
      const p=attackProfile(type,room,0);
      assert.ok(Math.abs(p.interval-ends[index][0])<1e-12);
      assert.ok(Math.abs(p.speed-ends[index][1])<1e-12);
    }
  }
  const main=attackProfile('asteroidBoss',10,0,{asteroidGeneration:0});
  assert.ok(Math.abs(main.interval-2.238888888888889)<1e-12);
  const gen1=attackProfile('asteroidBoss',10,0,{asteroidGeneration:1});
  const gen2=attackProfile('asteroidBoss',10,0,{asteroidGeneration:2});
  assert.deepEqual([gen1.count,gen1.interval,gen1.speed],[5,2.7,4.71]);
  assert.deepEqual([gen2.count,gen2.interval,gen2.speed],[1,3.2,4.31]);
});

test('enemy threat: shots kill in a few hits, collisions nearly one-shot and bosses hit like collisions', () => {
  const hitsToKill=(health,damage)=>Math.ceil(health/damage);
  // Capítulo 1: pelado (250) morre em no máximo 2 tiros; no fim, com ~1000 de vida, em até 3
  for(const type of ['miniasteroid','asteroid','ufo','ufofast','torusEnemy','compositeEnemy'])
    assert.ok(hitsToKill(250,enemyShotDamage(type,2,1))<=2,type);
  assert.ok(hitsToKill(1000,enemyShotDamage('ufo',20,1))<=3);
  // Capítulo 2: 1250–2000 de vida morre em 3 a 5 tiros em qualquer sala
  for(let room=2;room<=20;room++)for(const health of [1250,2000]) {
    const n=hitsToKill(health,enemyShotDamage('ufofast',room,2));
    assert.ok(n>=3&&n<=5,`room ${room}, ${health} HP: ${n} hits`);
  }
  // Colisão comum: 800 no início; só quem tem muito equipamento sobrevive
  assert.equal(enemyContactDamage('miniasteroid',2,1),800);
  assert.ok(enemyContactDamage('kamikaze',20,1)<1000,'a fully geared end-of-chapter ship survives one');
  // Boss (e fragmentos do boss asteroide): tiro = contato
  for(const type of ['asteroidBoss','miniboss','boss']) {
    assert.equal(enemyShotDamage(type,19,1),1500); assert.equal(enemyContactDamage(type,19,1),1500);
  }
  assert.equal(enemyShotDamage('asteroidBoss',10,1,{asteroidGeneration:2}),1500);
  for(const chapter of [2,3])for(const type of CHAPTER_BOSSES) {
    assert.equal(enemyShotDamage(type,10,chapter),ENEMY_THREAT[chapter].boss);
    assert.equal(enemyContactDamage(type,10,chapter),ENEMY_THREAT[chapter].boss);
  }
  // Caças da Colmeia batem como boss; os da mini-colmeia como inimigo comum
  assert.equal(enemyContactDamage('hiveDrone',10,2,{bossThreat:true}),ENEMY_THREAT[2].boss);
  assert.equal(enemyContactDamage('hiveDrone',12,2,{bossThreat:false}),enemyContactDamage('ufo',12,2));
  for(const chapter of [1,2]) {
    const now=ENEMY_THREAT[chapter],next=ENEMY_THREAT[chapter+1];
    assert.ok(next.shot[0]>=now.shot[1]&&next.collision[0]>=now.collision[1]&&next.boss>now.boss);
    assert.ok(now.boss>now.collision[1],'bosses always hit harder than a collision');
  }
});

test('projectile and collision i-frames have independent durations', () => {
  assert.equal(PROJECTILE_IFRAME,.5); assert.equal(COLLISION_IFRAME,1.5);
  const projectile=createIFrameGate(PROJECTILE_IFRAME), collision=createIFrameGate(COLLISION_IFRAME);
  assert.equal(projectile.consume(),true); assert.equal(projectile.consume(),false);
  projectile.update(.49); assert.equal(projectile.consume(),false); projectile.update(.01); assert.equal(projectile.consume(),true);
  assert.equal(collision.consume(),true); collision.update(1.49); assert.equal(collision.consume(),false);
  collision.update(.01); assert.equal(collision.consume(),true);
});

const expectedRooms={
  1:[[['miniasteroid',2]]],2:[[['miniasteroid',3]]],3:[[['miniasteroid',3],['ufo',1]]],
  4:[[['miniasteroid',3],['ufo',1]],[['miniasteroid',2]]],
  5:[[['miniasteroid',2],['ufo',1]],[['miniasteroid',1],['ufofast',1]]],6:[[['miniasteroid',3],['ufofast',2]]],
  7:[[['miniasteroid',2],['ufo',1],['ufofast',1]],[['miniasteroid',2],['ufo',1]]],
  8:[[['miniasteroid',3],['ufofast',1]],[['miniasteroid',2],['ufofast',2]]],
  9:[[['miniasteroid',3],['ufofast',2],['ufo',1]],[['miniasteroid',3],['ufofast',2]]],
  10:[[['asteroidBoss',1]]],11:[[['miniasteroid',2],['asteroid',1]],[['miniasteroid',2],['asteroid',1]]],
  12:[[['miniasteroid',2],['asteroid',1],['ufofast',1]],[['miniasteroid',2],['asteroid',1],['ufofast',1],['torusEnemy',1]]],
  13:[[['miniasteroid',2],['asteroid',1],['ufofast',1],['torusEnemy',1]],[['miniasteroid',1],['asteroid',2],['ufofast',1],['torusEnemy',1],['compositeEnemy',1]]],
  14:[[['miniasteroid',1],['asteroid',1],['ufofast',1],['torusEnemy',1],['compositeEnemy',1]],[['miniasteroid',1],['asteroid',2],['ufofast',1],['torusEnemy',1],['compositeEnemy',1]]],
  15:[[['miniasteroid',1],['asteroid',1],['ufofast',1],['torusEnemy',1],['compositeEnemy',1],['kamikaze',1]],[['miniasteroid',1],['asteroid',2],['ufofast',1],['torusEnemy',1],['compositeEnemy',1]]],
  16:[[['asteroid',2],['ufofast',1],['kamikaze',1],['torusEnemy',1],['compositeEnemy',1],['miniasteroid',1]],[['asteroid',1],['ufofast',1],['kamikaze',1],['torusEnemy',1],['compositeEnemy',1],['miniasteroid',2]]],
  17:[[['miniasteroid',2],['asteroid',2],['ufofast',1],['kamikaze',2],['compositeEnemy',1]],[['miniasteroid',2],['asteroid',2],['ufofast',1],['kamikaze',2],['compositeEnemy',1]]],
  18:[[['torusEnemy',2],['compositeEnemy',2],['ufofast',1],['asteroid',2]],[['torusEnemy',2],['compositeEnemy',2],['ufofast',1],['asteroid',2]]],
  19:[[['ufofast',1],['kamikaze',1],['torusEnemy',1],['asteroid',1],['compositeEnemy',1]],[['ufofast',1],['kamikaze',1],['torusEnemy',1],['asteroid',1],['compositeEnemy',1]],[['asteroid',1],['compositeEnemy',1],['miniboss',1]]],
  20:[[['boss',1]]],
};
test('chapter room compositions match the encounter specification',()=>{
  const playableStages=LEVEL_1.stages.filter(stage=>stage.type!=='intro');
  assert.equal(playableStages.length,20);
  for(const [room,waves] of Object.entries(expectedRooms)) {
    const actual=playableStages[Number(room)-1].waves.map(w=>w.enemies.map(g=>[g.enemyType,g.count]));
    assert.deepEqual(actual,waves,`room ${room}`);
  }
  assert.ok(playableStages.every(stage=>stage.type!=='upgrade'));
});

test('replacement rooms sit between their neighboring combat encounters',()=>{
  const health={miniasteroid:90,ufo:130,ufofast:180,asteroid:500,torusEnemy:180,compositeEnemy:220,kamikaze:120};
  const playable=LEVEL_1.stages.filter(stage=>stage.type!=='intro');
  const encounterHealth=room=>playable[room-1].waves.flatMap(w=>w.enemies)
    .reduce((sum,group)=>sum+group.count*scaledEnemyHealth(health[group.enemyType]||0,room),0);
  assert.ok(encounterHealth(4)<encounterHealth(5) && encounterHealth(5)<encounterHealth(6));
  assert.ok(encounterHealth(14)<encounterHealth(15) && encounterHealth(15)<encounterHealth(16));
});

test('pre-final XP remains inside the intended level-up band',()=>{
  const xpBase={miniasteroid:20,ufo:40,ufofast:55,asteroid:90,torusEnemy:70,compositeEnemy:80,kamikaze:60,miniboss:300};
  let total=0;
  const playableStages=LEVEL_1.stages.filter(stage=>stage.type!=='intro');
  for(let room=1;room<20;room++) {
    if(room===10){total+=1200;continue;}
    for(const w of playableStages[room-1].waves||[])for(const g of w.enemies) {
      total+=g.count*scaledEnemyExperience(xpBase[g.enemyType]||0,room);
      if(g.enemyType==='asteroid')total+=g.count*2*scaledEnemyExperience(5,room);
    }
  }
  assert.equal(total,18450); assert.ok(total<21564);
  let remainder=total,levelUps=0;
  while(remainder>=Math.floor(100*(levelUps+1)**1.5)){remainder-=Math.floor(100*(levelUps+1)**1.5);levelUps++;}
  assert.equal(levelUps,11);
});

test('final boss has 7800 HP and changes phase at 70 and 40 percent',()=>{
  assert.equal(finalBossPhase({health:5461,maxHealth:7800}),1);
  assert.equal(finalBossPhase({health:5460,maxHealth:7800}),2);
  assert.equal(finalBossPhase({health:3121,maxHealth:7800}),2);
  assert.equal(finalBossPhase({health:3120,maxHealth:7800}),3);
  assert.deepEqual([1,.7,.4].map(r=>{const p=attackProfile('boss',20,0,{health:7800*r,maxHealth:7800});return [p.phase,p.interval,p.movementSpeed,p.speed]}),[
    [1,1.85,1.1,6.2],[2,1.65,1.25,6.6],[3,1.45,1.4,6.9],
  ]);
});
