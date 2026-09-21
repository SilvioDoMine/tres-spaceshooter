import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as fleet from '../app/utils/enemyFleet.js';
import * as patterns from '../app/utils/combatPatterns.js';
import { Vector3, Raycaster, DoubleSide } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TACTICAL_FLEET, ENEMY_FLEET, fleetSalvo, fleetSocketWorld, fleetRotorAngle } from '../app/utils/enemyFleet.js';
import { attackProfile } from '../app/utils/combatPatterns.js';
import { moveSpecialist } from '../app/utils/fleetTactics.js';
import { LEVELS } from '../app/games/levels/index.js';

test('every chapter fields four specialties; neighboring combat waves change their leading specialty', () => {
  for (const level of Object.values(LEVELS)) {
    const seen = new Set(); let previous;
    for (const stage of level.stages) {
      if (stage.type === 'boss') {
        assert.ok(stage.waves.every(w=>w.enemies.every(g=>!g.fleetRole)));
        previous = undefined; continue;
      }
      for (const wave of stage.waves) {
        const specialists=wave.enemies.filter(g=>g.fleetRole);
        for (const group of specialists) {
          seen.add(group.fleetRole);
          assert.equal(TACTICAL_FLEET[group.visualModel].chapter,level.chapter);
          assert.equal(TACTICAL_FLEET[group.visualModel].fleetRole,group.fleetRole);
        }
        const signature=wave.enemies.map(g=>`${g.enemyType}:${g.fleetRole ?? 'base'}:${g.count}`).join('|');
        if (specialists.length) assert.notEqual(signature,previous);
        previous=signature;
      }
    }
    assert.equal(seen.size,4,`chapter ${level.chapter}`);
  }
});

test('specialist movement approaches, retreats, strafes and stays finite at contact', () => {
  const player={x:0,z:0};
  for (const role of ['sniper','skirmisher','broadside','spiral']) {
    const e={fleetRole:role,position:{x:20,z:0},speed:2};
    moveSpecialist(e,player,.1);assert.ok(e.position.x<20);
    e.position={x:4,z:0};moveSpecialist(e,player,.1);assert.ok(e.position.x>4);
    e.position={x:0,z:0};moveSpecialist(e,player,.1);assert.ok(Number.isFinite(e.position.x));
  }
  const sniper={fleetRole:'sniper',speed:2,position:{x:12,z:0},attackClock:{charging:true}};
  moveSpecialist(sniper,player,1);assert.deepEqual(sniper.position,{x:12,z:0});
  const raider={fleetRole:'skirmisher',speed:2,position:{x:7,z:0},attackClock:{volley:3}};
  moveSpecialist(raider,player,.1);assert.ok(raider.position.x>7);
});

test('20 specialist GLBs and corrected chapter-one models have clear physical exits at all rotor angles', async () => {
  const entries={...TACTICAL_FLEET,boss:ENEMY_FLEET.boss,miniasteroid:ENEMY_FLEET.miniasteroid};
  for (const [key,entry] of Object.entries(entries)) {
    const bytes=readFileSync(new URL('../public'+entry.url,import.meta.url));
    const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    let triangles=0,meshes=0;
    scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.material.side=DoubleSide;}});
    assert.ok(meshes<=16,`${key}: ${meshes} draws`);assert.ok(triangles<7000,`${key}: ${triangles} triangles`);
    for (const yaw of [0,.71]) for (const rotor of [0,-.42,-1.3]) {
      scene.rotation.y=yaw;scene.scale.setScalar(1.3);scene.position.set(2,.1,-3);
      scene.traverse(o=>{if(['ring_rotor','radial_rotor','radial_emitter'].includes(o.name))o.rotation.y=rotor;});
      scene.updateMatrixWorld(true);
      for (const socket of entry.sockets.filter(s=>s.role.startsWith('muzzle'))) {
        let marker;scene.traverse(o=>{if(o.userData.role===socket.role)marker=o;});assert.ok(marker,`${key}/${socket.role}`);
        const point=marker.getWorldPosition(new Vector3()),direction=new Vector3(0,0,-1).transformDirection(marker.matrixWorld);
        const expected=fleetSocketWorld({position:{x:2,y:.1,z:-3},size:1.3},socket,yaw,rotor);
        assert.ok(point.distanceTo(new Vector3(expected.origin.x,expected.origin.y,expected.origin.z))<2e-5);
        assert.ok(direction.distanceTo(new Vector3(expected.direction.x,0,expected.direction.z))<2e-5);
        const ray=new Raycaster(point.clone().addScaledVector(direction,.03),direction,0,.28);
        assert.equal(ray.intersectObject(scene,true).length,0,`${key}/${socket.role}: obstructed at rotor ${rotor}`);
      }
    }
  }
});

test('specialist volleys match their physical guns and preserve readable windups', () => {
  for(const [model,entry] of Object.entries(TACTICAL_FLEET)) for(let volley=0;volley<6;volley++) {
    const enemy={type:'ufo',visualModel:model,fleetRole:entry.fleetRole,size:1,position:{x:0,y:0,z:0},fleetYaw:0};
    const profile=attackProfile('ufo',12,volley,enemy);
    const shots=fleetSalvo(enemy,profile,volley,{x:0,z:-10});
    assert.equal(shots.length,profile.count,model);
    assert.equal(new Set(shots.map(s=>s.role)).size,shots.length);
    assert.ok(profile.charge>=.25 && profile.interval>=.6);
    if(entry.fleetRole==='sniper') assert.equal(profile.telegraph,true);
    if(entry.fleetRole==='spiral'&&volley) assert.notEqual(fleetRotorAngle(enemy,profile,volley),0);
  }
});

test('real attack loop fires each specialist through its model and suppresses frozen/dead enemies', () => {
  const source=readFileSync(new URL('../app/composables/useEnemyAttacks.js',import.meta.url),'utf8').replace(/^import .*$/gm,'').replaceAll('export ','');
  for(const role of ['sniper','skirmisher','broadside','spiral']) {
    const emitted=[];
    const enemy={id:role,type:'ufo',fleetRole:role,visualModel:`c3_${role}`,state:'active',size:1,position:{x:0,y:0,z:0},attackClock:{remaining:0,volley:0,charging:false}};
    const context=vm.createContext({...fleet,...patterns,Math,ENEMY_ELEMENT_PAYLOADS:{},playableRoomCount:()=>5,
      useCurrentRunStore:()=>({currentStage:{combatTier:5},levelConfig:{chapter:3},getPlayerPosition:()=>({x:0,z:-10})}),
      useProjectileStore:()=>({projectiles:[],spawnProjectile(...args){emitted.push(args);}}),
      useState:()=>({value:{x:0,z:0,width:40,height:40}})});
    vm.runInContext(source+'\nglobalThis.attacks=useEnemyAttacks();',context);
    for(let i=0;i<50;i++)context.attacks.update([enemy],.05);
    assert.ok(emitted.length>=attackProfile('ufo',5,0,enemy).count,role);
    for(const args of emitted){assert.ok(args.at(-1).muzzleRole);assert.ok(Number.isFinite(args[1].x));}
    const before=emitted.length;
    enemy.elementState={freeze:true};for(let i=0;i<100;i++)context.attacks.update([enemy],.05);
    assert.equal(emitted.length,before);
    enemy.elementState={};enemy.state='dying';for(let i=0;i<100;i++)context.attacks.update([enemy],.05);
    assert.equal(emitted.length,before);
  }
});
