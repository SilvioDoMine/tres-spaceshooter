import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as patterns from '../app/utils/combatPatterns.js';
import { playableRoomCount } from '../app/utils/progression.js';
const {shotFormation,advanceShot,segmentHit,attackProfile,attackDirections}=patterns;

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
 assert.equal(attackProfile('asteroid',2).projectile,'enemyOrb');
 assert.equal(attackProfile('ufo',2).projectile,'enemyPlasma');
 for(const room of [2,10,20]){
  const plasma=attackProfile('ufofast',room,1),missile=attackProfile('ufofast',room,2);
  assert.equal(missile.projectile,'enemyMissile');
  for(const field of ['count','speed','damage','interval','charge','range'])assert.equal(missile[field],plasma[field]);
 }
});
test('all progression tiers keep attacks bounded and leave ring gaps',()=>{
 for(let room=2;room<=20;room++)for(const type of ['miniasteroid','asteroid','ufo','ufofast','boss','asteroidBoss']){
  const p=attackProfile(type,room,0,type==='boss'?{health:7800,maxHealth:7800}:{});
  assert.ok(p.speed<=6.9 && p.damage<=32 && p.interval>=1.45 && p.count<=10);
  const directions=attackDirections(p,{x:1,z:0},0);
  assert.equal(directions.length,p.count);
  directions.forEach(d=>assert.ok(Math.abs(Math.hypot(d.x,d.z)-1)<1e-9));
 }
 assert.equal(attackProfile('asteroid',2).count,5);
});

function storeHarness(){
 const enemies=[{id:'a',state:'active',position:{x:0,z:0},size:1},
 {id:'b',state:'active',position:{x:3,z:0},size:1}];
 const damage=[],hits=[];
 const player={x:100,z:100};
 const context=vm.createContext({...patterns,Math,console,
  defineStore:(_id,setup)=>setup, shallowRef:value=>({value}),emitImpact:()=>{},useAudio:()=>({playSound:()=>{}}),
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
 return {store:context.store,enemies,damage,hits,player};
}
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
 const context=vm.createContext({...patterns,playableRoomCount,Math,
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
  for(const multi of [0,1,2,3,4])for(const rear of [0,1,2])for(const diagonal of [0,1,2]){
    const mounts=patterns.weaponMounts(multi,rear,diagonal);
    assert.equal(mounts.filter(m=>m.role==='front').length,1+multi);
    const rearMounts=mounts.filter(m=>m.role==='rear');
    assert.equal(rearMounts.length,rear?rear+multi:0);
    assert.equal(rearMounts.filter(m=>!m.bonus).length,rear);
    assert.equal(mounts.filter(m=>m.role==='diagonal').length,diagonal?2*(1+multi):0);
    for(const side of diagonal?[-1,1]:[]){
      const group=mounts.filter(m=>m.role==='diagonal'&&Math.sign(m.dx)===side);
      assert.equal(group.length,1+multi);
      assert.ok(Math.abs(group.reduce((n,m)=>n+m.x,0)/group.length-side*.70)<1e-10);
      assert.ok(Math.abs(group.reduce((n,m)=>n+m.z,0)/group.length-.12)<1e-10);
      assert.ok(group.every(m=>m.dx===group[0].dx&&m.dz===group[0].dz));
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
