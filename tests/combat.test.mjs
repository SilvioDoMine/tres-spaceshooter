import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as patterns from '../app/utils/combatPatterns.js';
import * as fleet from '../app/utils/enemyFleet.js';
import { playableRoomCount } from '../app/utils/progression.js';
const {shotFormation,advanceShot,segmentHit,attackProfile,attackDirections,homingDirection}=patterns;

/** Persegue `target` em passos de `step` e devolve o caminho e a menor distância alcançada. */
function chase(target,{radius=2.6,step=.05,distance=11,from={x:0,z:0},heading={x:1,z:0}}={}){
 const p={position:{...from},direction:{...heading}};
 let closest=Infinity;
 for(let traveled=0;traveled<distance;traveled+=step){
  p.direction=homingDirection(p.direction,p.position,target,step,radius);
  advanceShot(p,step);
  closest=Math.min(closest,Math.hypot(p.position.x-target.x,p.position.z-target.z));
 }
 return {end:{...p.position},closest};
}

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
test('homing turns toward the target and never beyond its minimum radius',()=>{
 // Alvo à esquerda: gira o máximo permitido por essa distância (step/radius radianos)
 const turned=homingDirection({x:1,z:0},{x:0,z:0},{x:0,z:5},.26,2.6);
 assert.ok(Math.abs(Math.atan2(turned.z,turned.x)-.1)<1e-9);
 // Alvo quase de frente: gira só o necessário, sem passar do alvo
 const small=homingDirection({x:1,z:0},{x:0,z:0},{x:10,z:.2},1,2.6);
 assert.ok(Math.abs(Math.atan2(small.z,small.x)-Math.atan2(.2,10))<1e-9);
 // Sem a carta (raio 0) e com o alvo em cima do projétil a direção não muda
 assert.deepEqual(homingDirection({x:1,z:0},{x:0,z:0},{x:0,z:5},.26,0),{x:1,z:0});
 assert.deepEqual(homingDirection({x:1,z:0},{x:0,z:0},{x:0,z:0},.26,2.6),{x:1,z:0});
});

test('the shot speed sets how fast the curve is drawn, not how tight it is',()=>{
 // Alvo distante e de lado: o giro fica no limite o tempo todo. O arco total é distância/raio,
 // ou seja, a curvatura é 1/raio em qualquer velocidade — o tiro rápido só chega lá antes.
 const sweep=(step,distance)=>{
  const p={position:{x:0,z:0},direction:{x:1,z:0}};
  let turned=0;
  for(let traveled=0;traveled<distance-1e-9;traveled+=step){
   const before=Math.atan2(p.direction.z,p.direction.x);
   p.direction=homingDirection(p.direction,p.position,{x:0,z:-1000},step,2.6);
   turned+=before-Math.atan2(p.direction.z,p.direction.x);
   advanceShot(p,step);
  }
  return turned;
 };
 for(const step of [.02,.05,.1,.2])assert.ok(Math.abs(sweep(step,3)-3/2.6)<1e-9,`passo ${step}`);
});

test('homing still misses a target parked inside its turning circle',()=>{
 // Alvo a 1 de distância, perpendicular: cabe dentro do círculo de giro (raio 2.6) e escapa
 assert.ok(chase({x:0,z:1}).closest>.6);
 // O mesmo alvo à frente é alcançado sem dificuldade
 assert.ok(chase({x:8,z:2}).closest<.3);
 // Quanto menor o raio, mais fechada a curva e menos alvos escapam
 assert.ok(chase({x:1.2,z:2},{radius:2.6}).closest>chase({x:1.2,z:2},{radius:1.7}).closest);
});

test('swept hit detects a target crossed between frames',()=>{
 assert.notEqual(segmentHit({x:-5,z:0},{x:5,z:0},{x:0,z:0},.3),null);
 assert.equal(segmentHit({x:-5,z:0},{x:5,z:0},{x:0,z:1},.3),null);
});

test('enemy ammunition varies without increasing salvo damage or density',()=>{
 assert.equal(attackProfile('asteroid',2).projectile,'enemyOrb');
 assert.equal(attackProfile('ufo',2).projectile,'enemyPlasma');
 for(const room of [2,10,20]){
  const plasma=attackProfile('ufofast',room,1),missile=attackProfile('ufofast',room,2);
  assert.equal(missile.projectile,'enemyMissile');
  for(const field of ['count','speed','interval','charge','range'])assert.equal(missile[field],plasma[field]);
 }
});
test('all progression tiers keep attacks bounded and leave ring gaps',()=>{
 for(let room=2;room<=20;room++)for(const type of ['miniasteroid','asteroid','ufo','ufofast','boss','asteroidBoss']){
  const p=attackProfile(type,room,0,type==='boss'?{health:7800,maxHealth:7800}:{});
  assert.ok(p.speed<=6.9 && p.interval>=1.45 && p.count<=10);
  const directions=attackDirections(p,{x:1,z:0},0);
  assert.equal(directions.length,p.count);
  directions.forEach(d=>assert.ok(Math.abs(Math.hypot(d.x,d.z)-1)<1e-9));
 }
 assert.equal(attackProfile('asteroid',2).count,5);
});

function storeHarness(){
 const enemies=[{id:'a',state:'active',position:{x:0,z:0},size:1},
 {id:'b',state:'active',position:{x:3,z:0},size:1}];
 const damage=[],hits=[],flashes=[],sounds=[];
 const player={x:100,z:100};
 const context=vm.createContext({...patterns,...fleet,Math,console,
  defineStore:(_id,setup)=>setup, shallowRef:value=>({value}),emitImpact:()=>{},useAudio:()=>({playSound:name=>sounds.push(name),playCombatSound:name=>sounds.push(name)}),
  emitMuzzleFlash:id=>flashes.push(id),
  PlayerBaseStats:{projectiles:{shotSpeed:19,damage:50,size:.2,range:11}},
  baseStats:{},SkillsList:{ricochet_shot:{levels:{1:{value:.5}}}},
  useEnemyManager:()=>({activeEnemies:{value:enemies},takeDamage:(id,n)=>hits.push({id,n})}),
  useCurrentRunStore:()=>({getPlayerPosition:()=>player,getPlayerRotation:()=>({y:0}),takeDamage:n=>damage.push(n)}),
  usePlayerStats:()=>({getProjectileSpeedMultiplier:1,getRangeMultiplier:1,getDamageMultiplier:1}),
  useSkillStore:()=>({getSkillLevel:()=>1}),
 });
 const source=readFileSync(new URL('../app/stores/projectileStore.js',import.meta.url),'utf8')
  .replace(/^import .*$/gm,'').replaceAll('export ','').replace(/^if\(import.meta.hot\).*$/gm,'');
 vm.runInContext(source+'\nglobalThis.store=useProjectileStore();',context);
 return {store:context.store,enemies,damage,hits,player,flashes,sounds};
}
test('multishot repeat waits its interval, then flashes its muzzle and sounds once',()=>{
 const {store,hits,flashes,sounds}=storeHarness();
 store.spawnProjectile('player',{x:-1,y:0,z:0},{x:1,z:0},'p','player',1,0,50,[],
  {silent:true,spawnDelay:patterns.MULTISHOT_INTERVAL,muzzleId:'front:0:0',releaseSound:true});
 store.spawnProjectile('player',{x:-1,y:0,z:.1},{x:1,z:0},'p','player',1,0,50,[],
  {silent:true,spawnDelay:patterns.MULTISHOT_INTERVAL,muzzleId:'rear:3.14:0',releaseSound:false});
 store.update(patterns.MULTISHOT_INTERVAL/2);store.checkCollisions();
 assert.equal(hits.length,0);assert.equal(flashes.length,0);assert.equal(sounds.length,0);
 store.update(patterns.MULTISHOT_INTERVAL);
 assert.deepEqual(flashes,['front:0:0','rear:3.14:0']);assert.equal(sounds.length,1);
 store.update(.1);assert.ok(hits.length>0);
 store.update(.1);assert.equal(flashes.length,2);assert.equal(sounds.length,1);
});
test('ricochet continues once, keeps trail and never hits previous target again',()=>{
 const {store,hits}=storeHarness();
 store.spawnProjectile('player',{x:-1,z:0},{x:1,z:0},'p','player',1,1,50);
 store.update(.1);
 assert.equal(hits.length,1);
 const shot=store.projectiles.value[0];
 assert.equal(shot.ricochet,true);assert.ok(shot.trail.length);assert.ok(shot.distanceTraveled>0);
 store.update(.2);
 assert.deepEqual(hits.map(h=>h.id),['a','b']);
 assert.equal(hits[1].n,25);
 assert.equal(store.projectiles.value.length,0);
});
test('homing shots curve onto an off-axis enemy that a straight shot would miss',()=>{
 const shoot=options=>{
  const harness=storeHarness();
  harness.enemies.length=0;
  harness.enemies.push({id:'a',state:'active',position:{x:6,z:4},size:1});
  harness.store.spawnProjectile('player',{x:0,z:0},{x:1,z:0},'p','player',1,0,50,[],options);
  // 12 passos de .05 a 19/s = 11.4 percorridos: passa do alcance 11 da arma
  for(let i=0;i<12;i++)harness.store.update(.05);
  return harness;
 };
 assert.equal(shoot({}).hits.length,0,'tiro reto passa longe');
 const chased=shoot({homing:2.6});
 assert.deepEqual(chased.hits.map(h=>h.id),['a']);
 // O alcance não muda: o tiro morre no mesmo orçamento de distância
 assert.equal(shoot({homing:2.6}).store.projectiles.value.length,0);
 const missed=storeHarness();
 missed.enemies.length=0;
 missed.enemies.push({id:'a',state:'active',position:{x:0,z:1},size:.2});
 missed.store.spawnProjectile('player',{x:0,z:0},{x:1,z:0},'p','player',1,0,50,[],{homing:2.6});
 for(let i=0;i<12;i++)missed.store.update(.05);
 assert.equal(missed.hits.length,0,'alvo dentro do círculo de giro escapa');
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
 const context=vm.createContext({...patterns,...fleet,playableRoomCount,Math,
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

// Physical muzzle geometry and projectile transforms must agree at every heading.
test('physical hardpoints match front, diagonal and straight rear fire',()=>{
  for(const front of [0,1,2])for(const rear of [0,1,2])for(const diagonal of [0,1,2]){
    const mounts=patterns.weaponMounts(front,rear,diagonal);
    assert.equal(mounts.filter(m=>m.role==='front').length,1+front);
    assert.equal(mounts.filter(m=>m.role==='rear').length,rear);
    const side=mounts.filter(m=>m.role==='diagonal');
    assert.equal(side.length,diagonal===0?0:diagonal===1?2:4);
    // Laterais nunca ficam lado a lado: cada canhão tem um ângulo próprio
    assert.equal(new Set(side.map(m=>`${m.dx.toFixed(6)},${m.dz.toFixed(6)}`)).size,side.length);
    for(const m of side){
      const degrees=Math.round(Math.abs(Math.atan2(m.dx,-m.dz))*180/Math.PI);
      assert.ok(degrees===45||(diagonal>=2&&degrees===90));
      assert.ok(Math.abs(Math.abs(m.x - m.dx * .28 * .43) - .70) < 1e-10);
    }
    for(const m of mounts)for(const yaw of [0,.7,Math.PI,-1.2]){
      const p={x:12,y:0,z:-8};const result=patterns.worldHardpoint(p,yaw,m);
      assert.ok(Math.abs(Math.hypot(result.direction.x,result.direction.z)-1)<1e-10);
      assert.ok(Math.abs(Math.hypot(result.origin.x-p.x,result.origin.z-p.z)-Math.hypot(m.x,m.z))<1e-10);
      if(m.role==='rear'){
        const forward={x:-Math.sin(yaw),z:-Math.cos(yaw)};
        assert.ok(result.direction.x*forward.x+result.direction.z*forward.z<-.999);
        assert.ok((result.origin.x-p.x)*forward.x+(result.origin.z-p.z)*forward.z<0);
        const shot={position:{...result.origin},direction:result.direction};
        patterns.advanceShot(shot,3);
        assert.ok(Math.abs(Math.hypot(shot.position.x-result.origin.x,shot.position.z-result.origin.z)-3)<1e-10);
      }
    }
  }
});

test('plasma beam follows its muzzle, stops at first enemy and preserves total burst damage across frame rates',()=>{
 for(const dt of [.01,.033,.2]){
  const {store,enemies,hits,player}=storeHarness();player.x=0;player.y=0;player.z=0;
  enemies[0].position={x:0,z:-4};enemies[1].position={x:0,z:-6};
  const mount=patterns.weaponMounts()[0];const {origin,direction}=patterns.worldHardpoint(player,0,mount);
  const beam=store.spawnProjectile('player',origin,direction,'p','player',1,0,100,[],{beam:true,beamMount:mount,beamAge:0,beamTick:0,beamDuration:.65});
  store.update(dt);assert.ok(beam.beamLength<4);
  store.checkCollisions();
  for(let t=dt;t<.9;t+=dt)store.update(dt);
  assert.equal(hits.reduce((n,h)=>n+h.n,0),100);
  assert.ok(hits.every(h=>h.id==='a'));assert.equal(store.projectiles.value.length,0);
 }
});

test('quantum echo waits before moving or hitting, then activates once',()=>{
 const {store,hits}=storeHarness();
 store.spawnProjectile('player',{x:-1,y:0,z:0},{x:1,z:0},'p','player',1,0,50,[],{echo:true,spawnDelay:.10});
 store.update(.05);store.checkCollisions();assert.equal(hits.length,0);
 store.update(.06);assert.equal(hits.length,0);
 store.update(.1);assert.equal(hits.length,1);
});
