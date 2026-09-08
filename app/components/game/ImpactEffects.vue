<script setup lang="ts">
import { BufferGeometry, BufferAttribute, Points, ShaderMaterial, Color, Mesh, IcosahedronGeometry, MeshBasicMaterial } from 'three'
import { subscribeImpacts } from '~/utils/combatEffects'
import { createMeteorPass } from '~/utils/meteorPass'
import { DILATION_CONFIG, sceneryDilation } from '~/utils/spatialDilation'
const dilation=useSpatialDilation().state
const reducedMotion=useState('spatial-reduced-motion',()=>false)
let spatialParticleTime=0
// Fixed particle pool: effects reuse GPU buffers even during sustained fire.
const count=640,geometry=new BufferGeometry()
const positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count),alpha=new Float32Array(count),kinds=new Float32Array(count)
geometry.setAttribute('position',new BufferAttribute(positions,3));geometry.setAttribute('tint',new BufferAttribute(colors,3));geometry.setAttribute('radius',new BufferAttribute(sizes,1));geometry.setAttribute('opacity',new BufferAttribute(alpha,1));geometry.setAttribute('kind',new BufferAttribute(kinds,1))
const material=new ShaderMaterial({transparent:true,depthWrite:false,uniforms:{screen:{value:640}},vertexShader:`attribute vec3 tint;attribute float radius;attribute float opacity;attribute float kind;uniform float screen;varying vec3 c;varying float a;varying float k;void main(){c=tint;a=opacity;k=kind;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(radius*screen/max(1.,-p.z),1.,180.);}`,fragmentShader:`varying vec3 c;varying float a;varying float k;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;float mask=exp(-r*r*5.)*smoothstep(1.,.65,r);vec3 col=c;if(k>2.5){mask=smoothstep(.48,.3,abs(p.x))*smoothstep(.24,.15,abs(p.y));col*=.6+gl_PointCoord.y*.5;}else if(k>1.5){mask=exp(-pow((r-.7)*20.,2.));}else if(k>.5){float noise=.75+.25*sin(p.x*21.+sin(p.y*17.)*2.);mask*=noise;col*=.75+.25*r;}else{col=mix(c,vec3(1.),exp(-r*r*24.));}gl_FragColor=vec4(col,mask*a);}`})
const root=new Points(geometry,material);root.frustumCulled=false;root.renderOrder=3
const cometGeometry=new IcosahedronGeometry(.22,1)
const cometMaterial=new MeshBasicMaterial({color:'#a2cbd3'})
const comet=new Mesh(cometGeometry,cometMaterial);comet.visible=false;root.add(comet)
const particles=Array.from({length:count},()=>({age:99,life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,kind:0}))
let cursor=0
function particle(x:number,y:number,z:number,color:string,kind:number,size:number,life:number,speed:number,angle=Math.random()*Math.PI*2){
 const i=cursor++%count,p=particles[i];Object.assign(p,{age:0,life,x,y,z,vx:Math.cos(angle)*speed,vy:kind===1?.25:Math.random()*.8,vz:Math.sin(angle)*speed,size,kind})
 const c=new Color(color);colors.set([c.r,c.g,c.b],i*3);kinds[i]=kind
}
const unsubscribe=subscribeImpacts(e=>{
 if(e.kind==='shot'){
  particle(e.x,1,e.z,e.enemy?'#ff904c':'#75eaff',0,3.2,.12,0)
  for(let i=0;i<3;i++)particle(e.x,.7,e.z,e.enemy?'#a8694d':'#6a9db3',1,.6,.3,.6)
  return
 }
 const fatal=e.fatal,player=e.kind==='player'
 const color=player?'#ff805a':fatal?'#ffb04e':'#68dcff'
 particle(e.x,.8,e.z,color,0,fatal?12:5,fatal?.25:.16,0)
 particle(e.x,.5,e.z,player?'#7cdfff':color,2,fatal?2:1,fatal?.7:.35,0)
 for(let i=0;i<(fatal?28:10);i++)particle(e.x,.7,e.z,i%3?'#ffba65':color,0,.35+Math.random()*.5,fatal?.65+Math.random()*.4:.18+Math.random()*.2,fatal?3+Math.random()*5:2+Math.random()*3)
 if(fatal){
  for(let i=0;i<12;i++)particle(e.x,.4,e.z,i%2?'#76899e':'#bd8656',3,.5+Math.random()*.5,.9+Math.random()*.6,1+Math.random()*3)
  for(let i=0;i<15;i++)particle(e.x+(Math.random()-.5)*.8,.5,e.z+(Math.random()-.5)*.8,i%3?'#465366':'#9c7050',1,2+Math.random()*3,1.2+Math.random()*.6,.3+Math.random()*1.2)
 }else for(let i=0;i<3;i++)particle(e.x,.4,e.z,'#67798a',1,1,.5,.6)
})
const run=useCurrentRunStore(),view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}))
let ambientTime=0,cometAge=0,trailTime=0,smokeTime=0,nextPass=5+Math.random()*7,previousSector=-1
let pass:ReturnType<typeof createMeteorPass>|null=null
useLoop().onBeforeRender(({delta})=>{
 if(run.currentStage && !run.isPlaying && run.currentHealth>0)return
 const dt=Math.min(delta,.05)
 material.uniforms.screen.value=window.innerHeight*Math.min(window.devicePixelRatio,1.5)*2
 if(run.isPlaying){
  const expansion=dilation.value.visual*DILATION_CONFIG.particleIntensity*(reducedMotion.value?.25:1)
  spatialParticleTime+=dt*expansion
  if(spatialParticleTime>.055){
    spatialParticleTime=0
    const p=run.getPlayerPosition(),m=run.getMoveVector(),side=(Math.random()-.5)*6
    const x=p.x+m.x*3-m.z*side,z=p.z+m.z*3+m.x*side
    particle(x,-1,z,dilation.value.shake>.1?'#d9b7ff':'#8fbfdf',0,.22,.65,4+expansion*5,Math.atan2(-m.z,-m.x))
  }
  ambientTime+=dt;smokeTime+=dt
  if(!pass && ambientTime>nextPass){
    pass=createMeteorPass(view.value,previousSector);previousSector=pass.sector
    cometAge=0;trailTime=0;cometMaterial.color.set(pass.body)
    comet.scale.set(pass.scale*pass.stretch,pass.scale,pass.scale)
    comet.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6)
  }
  comet.visible=!!pass
  if(pass){
    const distortion=sceneryDilation(pass.x,pass.z,dilation.value)
    const flow=1-distortion*DILATION_CONFIG.cometResistance
    cometAge+=dt;pass.x+=dt*pass.vx*flow;pass.z+=dt*pass.vz*flow
    const stretch=1+(reducedMotion.value?0:distortion*DILATION_CONFIG.sceneryStretch)
    comet.scale.set(pass.scale*pass.stretch*stretch,pass.scale/Math.sqrt(stretch),pass.scale/Math.sqrt(stretch))
    comet.position.set(pass.x,-38,pass.z);comet.rotation.x+=dt*pass.spinX;comet.rotation.z+=dt*pass.spinZ
    trailTime+=dt
    if(trailTime>.025){trailTime=0;particle(pass.x,-38,pass.z,pass.glow,0,1.4*pass.scale,.15,0);particle(pass.x,-38,pass.z,pass.smoke,1,1.5*pass.scale,pass.tailLife,0)}
    const depth=1+38/52
    const outside=Math.abs(pass.x-view.value.x)>view.value.width*.5*depth+5 || Math.abs(pass.z-view.value.z)>view.value.height*.5*depth+5
    // If the player follows it, let it travel until it actually leaves the screen.
    if(cometAge>pass.minLife && outside){nextPass=pass.interval;ambientTime=0;pass=null;comet.visible=false}
  }
  if(run.currentHealth>0 && run.currentHealth<run.maxHealth*.3 && smokeTime>.12){smokeTime=0;const p=run.getPlayerPosition();particle(p.x,.4,p.z,'#62707c',1,1,.75,.2)}
 }
 for(let i=0;i<count;i++){
  const p=particles[i];p.age+=dt;if(p.age>=p.life){alpha[i]=0;continue}
  const t=p.age/p.life;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt
  const drag=Math.exp(-dt*(p.kind===1?1:2));p.vx*=drag;p.vz*=drag
  positions.set([p.x,p.y,p.z],i*3);sizes[i]=p.size*(p.kind===2?1+t*10:p.kind===1?1+t*1.8:1-t*.4)
  alpha[i]=p.kind===1?Math.sin(t*Math.PI)*.38:Math.pow(1-t,1.5)
 }
 for(const name of ['position','tint','radius','opacity','kind'])geometry.getAttribute(name).needsUpdate=true
})
onUnmounted(()=>{unsubscribe();geometry.dispose();material.dispose();cometGeometry.dispose();cometMaterial.dispose()})
</script>
<template><primitive :object="root" /></template>

