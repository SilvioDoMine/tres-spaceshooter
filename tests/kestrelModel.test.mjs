import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Box3 } from 'three';
import { hullLoft, hullPlate, buildKestrelHull } from '../app/utils/kestrelModel.js';

function inspectClosedMesh(geometry) {
  const positions=geometry.attributes.position;
  const edges=new Map();let volume=0;
  for(let i=0;i<positions.count;i+=3){
    const points=[0,1,2].map(j=>new Vector3().fromBufferAttribute(positions,i+j));
    volume+=points[0].dot(points[1].clone().cross(points[2]))/6;
    for(let j=0;j<3;j++){
      const keys=[points[j],points[(j+1)%3]].map(v=>v.toArray().map(n=>n.toFixed(6)).join(',')).sort();
      const key=keys.join('|');edges.set(key,(edges.get(key)||0)+1);
    }
  }
  assert.ok(volume>0,'faces must point outward');
  assert.ok([...edges.values()].every(count=>count===2),'every edge must join exactly two faces');
  geometry.dispose();
}

test('tapered hull sections form a closed outward-facing volume',()=>{
  inspectClosedMesh(hullLoft([[-.9,.04,-.08,-.02],[-.4,.14,-.06,.09],[.2,.17,-.05,.11]]));
});
test('thin beveled panels remain closed with a large requested bevel',()=>{
  inspectClosedMesh(hullPlate([[-1,-1],[1,-1],[1,1],[-1,1]],0,.004,.02));
});
test('Kestrel hull remains finite and within its existing gameplay footprint',()=>{
  const hull=buildKestrelHull();
  const size=new Box3().setFromObject(hull.root).getSize(new Vector3());
  assert.ok(size.x<1.7&&size.z<1.6&&size.y<.5);
  for(const mesh of hull.root.children){
    assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
    assert.ok([...mesh.geometry.attributes.normal.array].every(Number.isFinite));
  }
  hull.dispose();assert.equal(hull.root.children.length,0);
});
