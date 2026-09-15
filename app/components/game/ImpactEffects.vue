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
const positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count),alpha=new Float32Array(count),kinds=new Float32Array(count),seeds=new Float32Array(count)
geometry.setAttribute('position',new BufferAttribute(positions,3));geometry.setAttribute('tint',new BufferAttribute(colors,3));geometry.setAttribute('radius',new BufferAttribute(sizes,1));geometry.setAttribute('opacity',new BufferAttribute(alpha,1));geometry.setAttribute('kind',new BufferAttribute(kinds,1));geometry.setAttribute('seed',new BufferAttribute(seeds,1))
const material=new ShaderMaterial({transparent:true,depthWrite:false,uniforms:{screen:{value:640}},vertexShader:`attribute vec3 tint;attribute float radius;attribute float opacity;attribute float kind;attribute float seed;uniform float screen;varying vec3 c;varying float a;varying float k;varying float sd;void main(){c=tint;a=opacity;k=kind;sd=seed;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;float cap=k>=4.?1000.:180.;gl_PointSize=clamp(radius*screen/max(1.,-p.z),1.,cap);}`,fragmentShader:`varying vec3 c;varying float a;varying float k;varying float sd;
float hash(vec2 p){return fract(sin(dot(p,vec2(27.16,57.31)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 float h0=hash(i),h1=hash(i+vec2(1,0)),h2=hash(i+vec2(0,1)),h3=hash(i+vec2(1,1));
 return mix(mix(h0,h1,f.x),mix(h2,h3,f.x),f.y);}
float fbm(vec2 p){float v=0.,amp=.55;for(int i=0;i<3;i++){v+=amp*noise(p);p*=2.03;amp*=.5;}return v;}
void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;float mask=exp(-r*r*5.)*smoothstep(1.,.65,r);vec3 col=c;
if(k>=4.){
 // Bomba, um pulso só: fbm no espaço do sprite dá as línguas de fogo e as nuvens de fumaça,
 // e a semente (sd) sorteia um desenho diferente a cada explosão. prog vai de 0 a 1 na vida do sopro.
 float prog=k-4.;
 vec2 q=p*2.;float rr=length(q);vec2 dir=rr>.001?q/rr:vec2(0.);
 vec2 so=vec2(sd*53.7,sd*29.3);
 float n=fbm(q*4.2+so-dir*prog*.9);                      // silhueta do fogo, abrindo para fora
 float ns=fbm(q*2.6+so.yx+vec2(11.3,4.7)-dir*prog*.55);  // nuvens de fumaça, mais largas e lentas
 float fine=fbm(q*9.+so.yx);                             // grão quente dentro do fogo
 float rad=rr/(.3+.44*n),srad=rr/(.34+.5*ns);
 float fire=smoothstep(1.,.72,rad)*pow(1.-prog,1.1);     // o fogo apaga primeiro
 float smoke=smoothstep(1.,.64,srad)*clamp(.3+1.25*prog,0.,1.)*pow(1.-prog,.55);
 float heat=clamp((1.18-rad*1.3)*(1.-prog*.75)+(n-.5)*.45+(fine-.5)*.2,0.,1.);
 vec3 hot=mix(vec3(.28,.02,0.),vec3(1.,.12,.02),smoothstep(0.,.2,heat));
 hot=mix(hot,vec3(1.,.4,.03),smoothstep(.18,.46,heat));
 hot=mix(hot,vec3(1.,.78,.2),smoothstep(.44,.72,heat));
 hot=mix(hot,vec3(1.,.97,.85),smoothstep(.78,.99,heat));
 col=mix(hot,vec3(.12,.105,.1)*(.65+.7*ns),clamp(smoke*(1.-heat*1.5),0.,1.));
 mask=clamp(max(fire,smoke),0.,1.);
}else if(k>2.5){mask=smoothstep(.48,.3,abs(p.x))*smoothstep(.24,.15,abs(p.y));col*=.6+gl_PointCoord.y*.5;}else if(k>1.5){mask=exp(-pow((r-.7)*20.,2.));}else if(k>.5){float noise=.75+.25*sin(p.x*21.+sin(p.y*17.)*2.);mask*=noise;col*=.75+.25*r;}else{col=mix(c,vec3(1.),exp(-r*r*24.));}gl_FragColor=vec4(col,mask*a);}`})
const root=new Points(geometry,material);root.frustumCulled=false;root.renderOrder=3
const cometGeometry=new IcosahedronGeometry(.22,1)
const cometMaterial=new MeshBasicMaterial({color:'#a2cbd3'})
const comet=new Mesh(cometGeometry,cometMaterial);comet.visible=false;root.add(comet)
const particles=Array.from({length:count},()=>({age:99,life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,kind:0}))
const activeParticles=new Set<number>(),colorCache=new Map<string,Color>()
let cursor=0,staticAttributesDirty=true
function particle(x:number,y:number,z:number,color:string,kind:number,size:number,life:number,speed:number,angle=Math.random()*Math.PI*2){
 const i=cursor++%count,p=particles[i];Object.assign(p,{age:0,life,x,y,z,vx:Math.cos(angle)*speed,vy:kind===1?.25:kind>=4?0:Math.random()*.8,vz:Math.sin(angle)*speed,size,kind})
 const c=colorCache.get(color) || new Color(color);colorCache.set(color,c)
 colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;kinds[i]=kind;seeds[i]=Math.random()
 activeParticles.add(i);staticAttributesDirty=true
}
const unsubscribe=subscribeImpacts(e=>{
 if(e.kind==='shot'){
  particle(e.x,1,e.z,e.enemy?'#ff904c':'#75eaff',0,3.2,.12,0)
  for(let i=0;i<3;i++)particle(e.x,.7,e.z,e.enemy?'#a8694d':'#6a9db3',1,.6,.3,.6)
  return
 }
 const fatal=e.fatal,player=e.kind==='player'
 const color=player?'#ff805a':fatal?'#ffb04e':'#68dcff'
 // Casco grande, explosão grande. `hull` é o diâmetro real do modelo, medido pelo EnemyManager;
 // sem medição sobra o `size` do baseStats, que é só número de balanceamento. s = 1 é um caça comum.
 const hull=fatal?Math.min(14,Math.max(1,e.hull?e.hull*2:(e.size||1)*1.5)):1.5
 const s=hull/1.5,y=fatal?.6+hull*.36:.8
 if(!fatal){
  particle(e.x,y,e.z,color,0,5,.16,0)
  particle(e.x,.5,e.z,player?'#7cdfff':color,2,1,.35,0)
 }
 // Casco maior espalha os destroços mais longe, mas faísca e estilhaço não engordam com ele:
 // em tamanho de chefe viravam bolas brancas cobrindo a explosão.
 const reach=fatal?1+(s-1)*.3:1
 for(let i=0;i<(fatal?28:10);i++)particle(e.x,y*.85,e.z,i%3?'#ffba65':color,0,.3+Math.random()*.45,fatal?.65+Math.random()*.4:.18+Math.random()*.2,fatal?(3+Math.random()*5)*reach:2+Math.random()*3)
 if(fatal){
  // Estilhaço miúdo e fumaça nascendo fora do miolo: no centro eles tapavam a bola de fogo.
  for(let i=0;i<12;i++)particle(e.x,y*.6,e.z,i%2?'#76899e':'#bd8656',3,.28+Math.random()*.32,.9+Math.random()*.6,(1+Math.random()*3)*reach)
  for(let i=0;i<10;i++){const ang=Math.random()*Math.PI*2,d=(.6+Math.random()*.9)*(1+(s-1)*.5)
   particle(e.x+Math.cos(ang)*d,y*.7,e.z+Math.sin(ang)*d,i%3?'#465366':'#9c7050',1,(1.8+Math.random()*2.4)*(1+(s-1)*.22),1.2+Math.random()*.6,(.3+Math.random()*1.2)*reach)}
  // A bola de fogo entra por último para ficar na frente do estilhaço e da fumaça (o Points desenha na ordem do buffer).
  // Um pulso só: abre, esfria e vira fumaça, com desenho sorteado no shader.
  // O fogo ocupa ~70% do sprite e a curva começa na metade, então 2.9x o casco significa: no primeiro
  // quadro o fogo já tem o tamanho do casco e no fim tem o dobro dele. O teto de 15 existe porque sprite
  // de ponto trava em 1024px no hardware — passar disso pararia de crescer na tela.
  const blast=Math.min(15,2.9*hull*(.92+Math.random()*.18)),life=.5+Math.random()*.16+hull*.02
  particle(e.x,y,e.z,'#ff6a12',4,blast,life,0)
  // Casco que não cabe num sprite só (o teto acima): bolsões de fogo completam a silhueta. Nascem no
  // mesmo instante e com a mesma vida do sopro central, então continua um pulso.
  // Ficam perto e com tamanhos sorteados para fundirem numa massa só, em vez de virar uma flor de bolas.
  if(blast>7)for(let i=0;i<4;i++){const ang=(i+Math.random())/4*Math.PI*2,d=hull*(.16+Math.random()*.18)
   particle(e.x+Math.cos(ang)*d,y,e.z+Math.sin(ang)*d,'#ff7d20',4,blast*(.6+Math.random()*.22),life,0)}
 }else for(let i=0;i<3;i++)particle(e.x,.4,e.z,'#67798a',1,1,.5,.6)
})
const run=useCurrentRunStore(),view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}))
let ambientTime=0,cometAge=0,trailTime=0,smokeTime=0,nextPass=5+Math.random()*7,previousSector=-1
let pass:ReturnType<typeof createMeteorPass>|null=null
useGameLoop().onBeforeRender(({delta})=>{
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
 for(const i of activeParticles){
  const p=particles[i];p.age+=dt;if(p.age>=p.life){alpha[i]=0;continue}
  const t=p.age/p.life;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt
  const drag=Math.exp(-dt*(p.kind===1?1:2));p.vx*=drag;p.vz*=drag
  positions.set([p.x,p.y,p.z],i*3)
  if(p.kind>=4){
   // Sopro da bomba: um único crescimento que vai freando, sem repique.
   // O progresso viaja na parte fracionária de "kind"; o shader usa ele para o fogo virar fumaça
   // e já cuida do apagar, então aqui a opacidade fica cheia.
   // Começa na metade do diâmetro final: no primeiro quadro o fogo já cobre o casco que acabou
   // de sair de cena, então ninguém vê o modelo desaparecer.
   sizes[i]=p.size*(.5+.5*(1-Math.pow(1-t,2.2)))
   alpha[i]=1
   kinds[i]=4+Math.min(t,.995);staticAttributesDirty=true
  }else{
   sizes[i]=p.size*(p.kind===2?1+t*10:p.kind===1?1+t*1.8:1-t*.4)
   alpha[i]=p.kind===1?Math.sin(t*Math.PI)*.38:Math.pow(1-t,1.5)
  }
 }
 for(const i of activeParticles){if(particles[i].age>=particles[i].life)activeParticles.delete(i)}
 for(const name of ['position','radius','opacity'])geometry.getAttribute(name).needsUpdate=true
 if(staticAttributesDirty){for(const name of ['tint','kind','seed'])geometry.getAttribute(name).needsUpdate=true;staticAttributesDirty=false}
})
onUnmounted(()=>{unsubscribe();geometry.dispose();material.dispose();cometGeometry.dispose();cometMaterial.dispose()})
</script>
<template><primitive :object="root" /></template>

