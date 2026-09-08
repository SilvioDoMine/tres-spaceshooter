<script setup lang="ts">
import { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, Vector3 } from 'three'
const root=new Group()
const armor=new MeshStandardMaterial({color:'#455c79',metalness:.55,roughness:.65})
const inner=new MeshStandardMaterial({color:'#172538',metalness:.65,roughness:.65})
const copper=new MeshStandardMaterial({color:'#b76c3d',metalness:.6,roughness:.4})
const glow=new MeshStandardMaterial({color:'#ff9542',emissive:'#ff471b',emissiveIntensity:1.3})
const geos:any[]=[]
function box(x:number,y:number,z:number,w:number,h:number,d:number,mat=armor){const g=new BoxGeometry(w,h,d);geos.push(g);const m=new Mesh(g,mat);m.position.set(x,y,z);root.add(m);return m}
function beam(a:number[],b:number[],r=.05,mat=inner){const av=new Vector3(a[0],a[1],a[2]),bv=new Vector3(b[0],b[1],b[2]);const mid=av.clone().add(bv).multiplyScalar(.5);const m=box(mid.x,mid.y,mid.z,r,r,av.distanceTo(bv),mat);m.quaternion.setFromUnitVectors(new Vector3(0,0,1),bv.sub(av).normalize());return m}
box(0,0,-1.7,1.8,.5,3.8);const nose=box(0,.08,-3.7,1.4,.48,1.1);nose.rotation.y=.16
box(.5,-.25,2.4,1.7,.55,2.4).rotation.y=-.22
for(let i=0;i<7;i++){const z=-3.2+i*.48;box(-.88,.35,z,.12,.48,.09,inner);box(.88,.35,z,.12,.48,.09,inner);box(0,.6,z,1.9,.06,.1,copper)}
for(let i=0;i<9;i++)beam([-.8+i*.19,0,.15],[Math.sin(i)*.18+i*.12-.4,Math.cos(i)*.2,.8+(i%3)*.22],.045,i%2?copper:inner)
for(const side of [-1,1]){
 const wing=box(side*1.7,-.12,-1,1.7,.16,2);wing.rotation.y=side*.3
 for(let j=0;j<4;j++)box(side*1.7,.01,-1.7+j*.4,1.5,.045,.06,inner)
 if(side===1)box(2.5,-.6,.8,.65,.12,1.3).rotation.set(.5,1,.3)
 const g=new CylinderGeometry(.36,.45,1.4,10);geos.push(g);const engine=new Mesh(g,inner);engine.rotation.x=Math.PI/2;engine.position.set(side*.65+.5,-.25,3.5);root.add(engine)
 box(side*.5+.5,.08,2.8,.18,.03,.45,copper)
}
for(let i=0;i<5;i++)box(-.42+i*.2,.36,-2.9,.11,.04,.2,glow)
box(0,.56,-2.5,.9,.28,.6,inner)
for(let i=0;i<8;i++){const m=box(1.7+Math.sin(i*4)*1.3,-.4+Math.cos(i)*.7,.4+i*.4,.25+(i%3)*.15,.07,.5,armor);m.rotation.set(i*.4,i*.8,i*.3)}
onUnmounted(()=>{geos.forEach(g=>g.dispose());[armor,inner,copper,glow].forEach(m=>m.dispose())})
</script>
<template><primitive :object="root" /></template>
