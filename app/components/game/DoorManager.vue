<script setup lang="ts">
import { Group, Mesh, PlaneGeometry, ShaderMaterial, DoubleSide, AdditiveBlending, Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three'
const currentRun=useCurrentRunStore()
const root=new Group()
const field=new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{time:{value:0}},
vertexShader:`varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`
varying vec2 v;uniform float time;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return s;}
void main(){
 float r=length(v),a=atan(v.y,v.x),t=time*.23;
 vec2 flow=vec2(cos(a-t),sin(a-t));
 float n=fbm(flow*4.+vec2(r*8.,-time*.35));
 float warp=r+(n-.5)*.19;
 float smoke=exp(-pow((warp-.62)*6.5,2.))*(.3+1.4*n);
 float wisps=fbm(flow*7.+vec2(r*12.+time*.2,time*.12));
 smoke*=smoothstep(.24,.72,wisps+.2);
 float filaments=pow(.5+.5*sin(warp*110.+a*5.-time*2.+n*9.),12.);
 float inner=exp(-pow((warp-.46)*22.,2.));
 float outer=exp(-pow((r-.66)*3.4,2.))*.14;
 float alpha=(smoke*.85+filaments*smoke*.18+inner*.24+outer)*smoothstep(1.,.82,r)*smoothstep(.22,.4,r);
 vec3 color=mix(vec3(.08,.3,1.),vec3(.64,.16,1.),smoothstep(.35,.65,n));
 color=mix(color,vec3(.36,.85,1.),filaments*.35);
 gl_FragColor=vec4(color,alpha);
}`})
const plane=new PlaneGeometry(5.8,5.8)
const cloud=new Mesh(plane,field);cloud.rotation.x=-Math.PI/2;root.add(cloud)
const dots=new BufferGeometry(),positions=[]
for(let i=0;i<180;i++){const a=i*2.399,r=1.35+Math.sin(i*17.13)*.4;positions.push(Math.cos(a)*r,.05,Math.sin(a)*r)}
dots.setAttribute('position',new Float32BufferAttribute(positions,3))
const dustMaterial=new PointsMaterial({color:'#9acfff',size:.025,transparent:true,opacity:.75,depthWrite:false,blending:AdditiveBlending})
const dust=new Points(dots,dustMaterial);root.add(dust)
useLoop().onBeforeRender(({delta})=>{
 const dt=Math.min(delta,.1);field.uniforms.time.value+=dt;dust.rotation.y-=dt*.22
 const door=currentRun.doorPosition;root.visible=!!(currentRun.isDoorActive&&door)
 if(!door)return
 root.position.set(door.x,0,door.z)
 const p=currentRun.getPlayerPosition()
 if(currentRun.isPlaying&&currentRun.isDoorActive&&Math.hypot(p.x-door.x,p.z-door.z)<1.35)currentRun.nextStage()
})
onUnmounted(()=>{plane.dispose();field.dispose();dots.dispose();dustMaterial.dispose()})
</script>
<template><primitive :object="root" /></template>

