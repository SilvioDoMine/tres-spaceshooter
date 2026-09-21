import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3, Raycaster, DoubleSide } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FAMILY_ROLES, enemyFamilyModel, enemyFamilyUrl } from '../app/utils/enemyFamilies.js';
import { ENEMY_FLEET, fleetSocketWorld } from '../app/utils/enemyFleet.js';
import { LEVELS } from '../app/games/levels/index.js';

test('chapter fleets dominate ordinary encounters without replacing combat roles or bosses', () => {
  assert.equal(enemyFamilyModel('ufo',1),undefined);
  assert.equal(enemyFamilyModel('chapter5Boss',5),undefined);
  assert.equal(enemyFamilyUrl('ufo','c4_kamikaze'),undefined);
  for (const chapter of [2,3,4,5]) {
    let count=0, own=0;
    for (const stage of LEVELS[chapter].stages) for (const wave of stage.waves ?? []) for (const group of wave.enemies ?? []) {
      const type=group.enemyType;
      if (!FAMILY_ROLES.includes(type)) continue;
      count+=group.count; if (enemyFamilyModel(type,chapter)) own+=group.count;
    }
    assert.ok(count>0,`chapter ${chapter} contains ordinary encounters`);
    assert.equal(own,count);
  }
});

test('44 Blender variants load, stay batched, and preserve animated muzzle transforms', async () => {
  for (const chapter of [2,3,4,5]) for (const type of FAMILY_ROLES) {
    const model=enemyFamilyModel(type,chapter);
    const bytes=readFileSync(new URL('../public'+enemyFamilyUrl(type,model),import.meta.url));
    const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    let meshes=0,triangles=0;
    scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count ?? o.geometry.attributes.position.count)/3;o.material.side=DoubleSide;}});
    assert.ok(meshes<=16,`${model}: ${meshes} draws`);
    assert.ok(triangles<7000,`${model}: ${triangles} triangles`);
    for (const yaw of [0,.83]) for (const rotor of [0,-.64]) {
      const enemy={size:1.7,position:{x:3,y:.2,z:-4}};
      scene.position.set(3,.2,-4);scene.rotation.y=yaw;scene.scale.setScalar(enemy.size);
      scene.traverse(o=>{if(['ring_rotor','radial_rotor','radial_emitter'].includes(o.name))o.rotation.y=rotor;});
      scene.updateMatrixWorld(true);
      for (const socket of ENEMY_FLEET[type].sockets.filter(s=>s.role.startsWith('muzzle'))) {
        let marker;scene.traverse(o=>{if(o.userData.role===socket.role)marker=o;});
        assert.ok(marker,`${model}/${socket.role}`);
        const point=marker.getWorldPosition(new Vector3());
        const direction=new Vector3(0,0,-1).transformDirection(marker.matrixWorld);
        const expected=fleetSocketWorld(enemy,socket,yaw,rotor);
        for (const axis of ['x','y','z'])assert.ok(Math.abs(point[axis]-expected.origin[axis])<2e-5,`${model} muzzle ${axis}`);
        for (const axis of ['x','z'])assert.ok(Math.abs(direction[axis]-expected.direction[axis])<2e-5,`${model} direction ${axis}`);
        const ray=new Raycaster(point.clone().addScaledVector(direction,.025*enemy.size),direction,0,.22*enemy.size);
        assert.equal(ray.intersectObject(scene,true).length,0,`${model}/${socket.role}: hull blocks muzzle at rotor ${rotor}`);
      }
    }
  }
});


test('chapter model cache versions match the shipped GLBs, including summoned drones', async () => {
  const {createHash}=await import('node:crypto');
  const {FLEET_MODEL_REVISIONS}=await import('../app/data/fleetModelRevisions.js');
  for(const chapter of [2,3,4,5]) for(const type of FAMILY_ROLES){
    const model=enemyFamilyModel(type,chapter);
    const bytes=readFileSync(new URL('../public'+enemyFamilyUrl(type,model),import.meta.url));
    assert.equal(FLEET_MODEL_REVISIONS[model],createHash('sha256').update(bytes).digest('hex').slice(0,12),model);
  }
});

test('restored flower boss keeps unobstructed radial and beam exits while both batteries rotate', async()=>{
  const type='chapter5Boss';
  const bytes=readFileSync(new URL('../public'+ENEMY_FLEET[type].url,import.meta.url));
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  scene.traverse(o=>{if(o.isMesh)o.material.side=DoubleSide;});
  for(const angle of [0,.17,.43,.79,1.13]){
    scene.traverse(o=>{if(['radial_rotor','beam_rotor'].includes(o.name))o.rotation.y=angle;});
    scene.updateMatrixWorld(true);
    for(const s of ENEMY_FLEET[type].sockets.filter(s=>s.role.startsWith('muzzle'))){
      let marker;scene.traverse(o=>{if(o.userData.role===s.role)marker=o;});
      const origin=marker.getWorldPosition(new Vector3());
      const dir=new Vector3(0,0,-1).transformDirection(marker.matrixWorld);
      assert.equal(new Raycaster(origin.addScaledVector(dir,.025),dir,0,.6).intersectObject(scene,true).length,0,`${s.role} / ${angle}`);
    }
  }
});
