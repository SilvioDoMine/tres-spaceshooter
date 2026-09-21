import { Group, CylinderGeometry, TorusGeometry, IcosahedronGeometry } from 'three'
import { builder } from './spaceModels'

// Geometry is baked per finish. Each landmark costs five draws, not one per detail.
export function buildTidalBeacon() {
 const b=builder(['#497c70','#102e32','#9dbeb0','#bf9b55','#5ceab4'])
 // Open horseshoe: structural piers carry segmented decks around an empty center.
 for(let i=0;i<17;i++){
  const a=(-145+i*18)*Math.PI/180,x=Math.sin(a)*8,z=Math.cos(a)*8
  b.box(2.3,.62,1.9,0,[x,0,z],[0,a,0])
  b.box(1.8,.13,1.45,2,[x,.4,z],[0,a,0])
  b.box(1.5,.025,.13,4,[x,.49,z],[0,a,0])
  const at=(u:number,v:number,h:number)=>[x+Math.cos(a)*u+Math.sin(a)*v,h,z-Math.sin(a)*u+Math.cos(a)*v]
  for(const side of [-1,1]){
   b.box(2.15,.14,.09,3,at(0,side*.85,.65),[0,a,0])
   b.box(1.2,.4,.27,1,at(0,side*.62,.62),[0,a,0])
   for(let k=0;k<4;k++)b.box(.15,.12,.035,4,at(-.4+k*.26,side*.78,.66),[0,a,0])
  }
  for(const u of [-.7,.7])b.box(.06,.06,1.25,1,at(u,0,.5),[0,a,0])
  b.box(.2,1.5,.2,3,[x,-.9,z])
  if(i%4===0){
   b.add(new CylinderGeometry(.55,.9,3.3,8),1,[x,1.7,z])
   b.add(new CylinderGeometry(.88,.88,.22,8),3,[x,3.35,z])
   b.add(new CylinderGeometry(.45,.6,.7,8),4,[x,3.7,z])
   b.add(new CylinderGeometry(.08,.4,1.2,8),2,[x,4.6,z])
  }
 }
 for(const r of [7.3,8.7]) b.add(new TorusGeometry(r,.11,5,64,Math.PI*1.6),1,[0,-.35,0],[Math.PI/2,0,-.3])
 return b.finish('Farol das marés')
}

export function buildListeningArray(){
 const b=builder(['#365e57','#132b32','#a8c7b8','#b8a365','#77fbd0'])
 b.box(1.2,.9,10,1,[0,0,0])
 for(let i=0;i<5;i++){
  const z=i*2.1-4.2
  b.box(7,.18,.23,2,[0,.2,z])
  for(const side of [-1,1]){
   b.plate([[side*.9,z-.7],[side*3.6,z-.55],[side*4.5,z+.25],[side*1.2,z+.7]],.1,0,[0,.3,0])
   for(let k=0;k<5;k++)b.box(.07,.05,1,3,[side*(1.3+k*.52),.47,z],[0,side*.17,0])
   b.box(.14,.09,1.1,4,[side*3.4,.52,z])
  }
 }
 b.add(new CylinderGeometry(.65,1.1,1.2,10),0,[0,.85,0])
 b.add(new TorusGeometry(1.35,.08,5,32),2,[0,1.6,0],[Math.PI/2,.28,0])
 return b.finish('Observatório de correntes')
}

export function buildPetalSanctuary(){
 const b=builder(['#b7a39a','#302631','#dabf88','#9b6979','#ffbece'])
 b.add(new CylinderGeometry(1.4,2.1,1.7,12),1,[0,0,0])
 b.add(new IcosahedronGeometry(1.1,1),4,[0,1.4,0])
 for(const r of [2.1,5.9]) b.add(new TorusGeometry(r,.12,6,64),2,[0,.1,0],[Math.PI/2,0,0])
 for(let i=0;i<7;i++){
  const a=i*Math.PI*2/7,c=Math.cos(a),s=Math.sin(a)
  const pts=[[-.35,1.7],[-1.15,3.8],[-.75,5.8],[0,7.1],[.75,5.8],[1.15,3.8],[.35,1.7]]
  const turn=(p:number[])=>[p[0]*c-p[1]*s,p[0]*s+p[1]*c]
  b.plate(pts.map(turn),.4,0,[0,0,0],.07)
  b.plate(pts.map(p=>turn([p[0]*.55,1.8+(p[1]-1.8)*.85])),.06,3,[0,.47,0],.03)
  const x=-s*4.7,z=c*4.7
  b.add(new CylinderGeometry(.11,.4,3.6,5),2,[x,2,z])
  b.add(new IcosahedronGeometry(.3,0),4,[x,3.95,z])
  b.box(.1,.06,2.4,4,[-s*3.5,.6,c*3.5],[0,-a,0])
  for(const side of [-1,1])for(let k=0;k<4;k++){
   const r=2.8+k*.65,u=side*(.4+Math.sin(k*.75)*.3)
   b.add(new CylinderGeometry(.08,.15,.8+k*.13,5),2,[u*c-r*s,.85,u*s+r*c])
   b.add(new IcosahedronGeometry(.1,0),4,[u*c-r*s,1.3+k*.065,u*s+r*c])
  }
 }
 return b.finish('Santuário das sete pétalas')
}
export function buildTransitTerminal(){
 const b=builder(['#c5b6a0','#34283a','#d8b778','#80556e','#ffc4d8'])
 // One readable orbital terminal: central concourse, two docking piers and gate.
 b.plate([[-3,-4],[3,-4],[3.8,-2],[3.8,2],[2.7,3],[-2.7,3],[-3.8,2],[-3.8,-2]],.65,1,[0,-.5,0],.12)
 b.plate([[-2.7,-3.7],[2.7,-3.7],[3.4,-1.7],[3.4,1.7],[2.4,2.6],[-2.4,2.6],[-3.4,1.7],[-3.4,-1.7]],.15,0,[0,.2,0],.08)
 for(const side of [-1,1]){
  b.box(1.4,.6,7.4,0,[side*2.65,.25,5.8])
  b.box(.32,.14,6.7,3,[side*2.65,.65,5.8])
  for(let k=0;k<7;k++)b.box(.58,.06,.14,4,[side*2.65,.75,2.9+k*.9])
  b.box(1.3,2.5,2.4,1,[side*2.7,1.5,-1.8])
  b.box(1.5,.25,2.6,2,[side*2.7,2.85,-1.8])
  for(let k=0;k<4;k++)b.box(.12,.5,.055,4,[side*2.7-.45+k*.3,2,-.57])
  b.box(.25,3.4,.35,2,[side*2.2,1.9,-3])
 }
 b.box(4.6,.35,.4,2,[0,3.5,-3])
 b.box(2.7,.6,1.5,3,[0,.9,-1.7])
 for(let k=0;k<5;k++)b.box(.38,.08,.7,2,[-1+k*.5,.46,.3])
 const root=b.finish('Terminal orbital do eclipse')
 const gate=builder(['#c5b6a0','#34283a','#d8b778','#80556e','#ffc4d8'])
 gate.add(new TorusGeometry(1.65,.13,6,48),2,[0,0,0])
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4
  gate.box(.28,.6,.15,4,[Math.cos(a)*1.65,Math.sin(a)*1.65,0],[0,0,a-Math.PI/2])
 }
 const rotor=gate.finish('terminal-gate-rotor');rotor.position.set(0,2.0,-3);root.add(rotor)
 const shuttle=builder(['#c5b6a0','#34283a','#d8b778','#80556e','#ffc4d8'])
 shuttle.plate([[0,-.8],[.4,-.15],[.4,.6],[-.4,.6],[-.4,-.15]],.22,0)
 shuttle.box(.35,.12,.45,1,[0,.3,-.1]);shuttle.box(.45,.08,.12,4,[0,.15,.65])
 const pod=shuttle.finish('terminal-shuttle');pod.position.set(0,.8,5);root.add(pod)
 return root
}
