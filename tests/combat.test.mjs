import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as patterns from '../app/utils/combatPatterns.js';
const {shotFormation,advanceShot,segmentHit,attackProfile,attackDirections,combatTier}=patterns;

test('two parallel muzzles and five-shot arrow preserve symmetry',()=>{
 const pair=shotFormation(2);
 assert.equal(pair[0].forward,pair[1].forward);
 assert.equal(pair[0].side,-pair[1].side);
 const arrow=shotFormation(5);
 assert.equal(arrow[2].side,0);
 assert.ok(arrow[2].forward>arrow[1].forward && arrow[1].forward>arrow[0].forward);
 for(let n=1;n<=5;n++)assert.equal(new Set(shotFormation(n).map(p=>p.side)).size,n);
});
test('rear shot leaves forward, turns 180 degrees, then travels straight',()=>{
 for(const side of [-1,1]){
  const p={position:{x:0,z:0},direction:{x:0,z:-1},
   rearTurn:{origin:{x:0,z:0},forward:{x:0,z:-1},side,radius:.65,traveled:0}};
  advanceShot(p,.1);assert.ok(p.position.z<0);
  advanceShot(p,(Math.PI+3)*.65-.1);
  assert.ok(Math.abs(p.direction.x)<1e-8 && Math.abs(p.direction.z-1)<1e-8);
  assert.ok(Math.abs(p.position.x)<1e-8, 'returns to the original firing lane');
  const x=p.position.x, z=p.position.z;advanceShot(p,3);
  assert.ok(Math.abs(p.position.x-x)<1e-8 && Math.abs(p.position.z-z-3)<1e-8);
 }
});
test('swept hit detects a target crossed between frames',()=>{
 assert.notEqual(segmentHit({x:-5,z:0},{x:5,z:0},{x:0,z:0},.3),null);
 assert.equal(segmentHit({x:-5,z:0},{x:5,z:0},{x:0,z:1},.3),null);
});

test('enemy ammunition varies without increasing salvo damage or density',()=>{
 assert.equal(attackProfile('asteroid',0).projectile,'enemyOrb');
 assert.equal(attackProfile('ufo',0).projectile,'enemyPlasma');
 for(const tier of [0,.5,1]){
  const plasma=attackProfile('ufofast',tier,1),missile=attackProfile('ufofast',tier,2);
  assert.equal(missile.projectile,'enemyMissile');
  for(const field of ['count','speed','damage','cooldown','charge','range'])assert.equal(missile[field],plasma[field]);
 }
});
test('all progression tiers keep attacks bounded and leave ring gaps',()=>{
 for(let stage=0;stage<100;stage++)for(const type of ['miniasteroid','asteroid','ufo','ufofast','boss','asteroidBoss']){
  const p=attackProfile(type,combatTier(stage));
  assert.ok(p.speed<7 && p.damage<=36 && p.cooldown>=1.8 && p.count<=10);
  const directions=attackDirections(p,{x:1,z:0},0);
  assert.equal(directions.length,p.count);
  directions.forEach(d=>assert.ok(Math.abs(Math.hypot(d.x,d.z)-1)<1e-9));
 }
 assert.equal(attackProfile('asteroid',0).count,5);
});

function storeHarness(){
 const enemies=[{id:'a',state:'active',position:{x:0,z:0},size:1},
 {id:'b',state:'active',position:{x:3,z:0},size:1}];
 const damage=[],hits=[];
 const player={x:100,z:100};
 const context=vm.createContext({...patterns,Math,console,
  defineStore:(_id,setup)=>setup, shallowRef:value=>({value}),emitImpact:()=>{},useAudio:()=>({playSound:()=>{}}),
  PlayerBaseStats:{projectiles:{shotSpeed:19,damage:50,size:.2,range:11}},
  baseStats:{},SkillsList:{ricochet_shot:{levels:{1:{value:.6}}}},
  useEnemyManager:()=>({activeEnemies:{value:enemies},takeDamage:(id,n)=>hits.push({id,n})}),
  useCurrentRunStore:()=>({getPlayerPosition:()=>player,takeDamage:n=>damage.push(n)}),
  usePlayerStats:()=>({getProjectileSpeedMultiplier:1,getRangeMultiplier:1,getDamageMultiplier:1}),
  useSkillStore:()=>({getSkillLevel:()=>1}),
 });
 const source=readFileSync(new URL('../app/stores/projectileStore.js',import.meta.url),'utf8')
  .replace(/^import .*$/gm,'').replaceAll('export ','').replace(/^if\(import.meta.hot\).*$/gm,'');
 vm.runInContext(source+'\nglobalThis.store=useProjectileStore();',context);
 return {store:context.store,enemies,damage,hits,player};
}
test('ricochet continues once, keeps trail and never hits previous target again',()=>{
 const {store,hits}=storeHarness();
 store.spawnProjectile('player',{x:-1,z:0},{x:1,z:0},'p','player',1,1,50);
 store.update(.1);
 assert.equal(hits.length,1);
 const shot=store.projectiles.value[0];
 assert.equal(shot.ricochet,true);assert.ok(shot.trail.length);
 store.update(.2);
 assert.deepEqual(hits.map(h=>h.id),['a','b']);
 assert.equal(hits[1].n,30);
 assert.equal(store.projectiles.value.length,0);
});
test('a removed shot cannot hit two overlapping enemies; volley grants damage grace',()=>{
 const {store,enemies,hits,damage,player}=storeHarness();
 enemies[1].position.x=0;
 store.spawnProjectile('player',{x:-1,z:0},{x:1,z:0},'p','player');
 store.update(.1);assert.equal(hits.length,1);
 player.x=0;player.z=0;
 for(let i=0;i<5;i++)store.spawnProjectile('enemyOrb',{x:-.8,z:0},{x:1,z:0},'e','enemy');
 store.update(.2);
 assert.equal(damage.length,1);assert.equal(store.projectiles.value.length,0);
});
test('enemy shots wait for telegraph, honor visibility and global projectile budget',()=>{
 const bullets=[],run={currentStageIndex:1,getPlayerPosition:()=>({x:0,z:0})};
 const context=vm.createContext({...patterns,Math,
  useCurrentRunStore:()=>run,useProjectileStore:()=>({projectiles:bullets,spawnProjectile:(...args)=>bullets.push({ownerType:'enemy',args})}),
  useState:()=>({value:{x:0,z:0,width:30,height:23}})
 });
 const source=readFileSync(new URL('../app/composables/useEnemyAttacks.js',import.meta.url),'utf8').replace(/^import .*$/gm,'').replaceAll('export ','');
 vm.runInContext(source+'\nglobalThis.attacks=useEnemyAttacks();',context);
 const e={id:'e',type:'asteroid',state:'active',position:{x:6,z:0},attackClock:{remaining:0,volley:0,charging:false}};
 context.attacks.update([e],.01);assert.equal(bullets.length,0);
 context.attacks.update([e],.3);assert.equal(bullets.length,0);assert.ok(e.attackCharge>0);
 context.attacks.update([e],.5);assert.equal(bullets.length,5);
 e.position.x=50;
 for(let i=0;i<100;i++)context.attacks.update([e],.1);
 assert.equal(bullets.length,5);
 e.position.x=6;
 while(bullets.length<90)bullets.push({ownerType:'enemy'});
 for(let i=0;i<100;i++)context.attacks.update([e],.1);
 assert.equal(bullets.length,90);
});
