<script setup lang="ts">
import { Group, Mesh, SphereGeometry, PlaneGeometry, ShaderMaterial, Color, AdditiveBlending } from 'three'
import { buildTidalBeacon, buildListeningArray, buildPetalSanctuary, buildTransitTerminal } from '~/utils/frontierModels'

import { disposeModel } from '~/utils/spaceModels'
const props=defineProps<{chapter:number}>()

const root=new Group()
const run=useCurrentRunStore()
let elapsed=0
const isGarden=props.chapter===5
const put=(o:Group|Mesh,p:number[],r=[0,0,0],scale=1)=>{o.position.set(p[0],p[1],p[2]);o.rotation.set(r[0],r[1],r[2]);o.scale.setScalar(scale);root.add(o);return o}
// Landmarks always remain well below y=0, even at their tallest point.
const landmark=put(isGarden?buildPetalSanctuary():buildTidalBeacon(),isGarden?[29,-19,-11]:[29,-19,2],isGarden?[.1,.4,.12]:[.13,-.5,-.12],1.7)
const secondary=put(isGarden?buildTransitTerminal():buildListeningArray(),[-25,-20,18],[.12,.55,-.14],1.55)
const planetMaterial=new ShaderMaterial({
 uniforms:{light:{value:new Color(isGarden?'#dca381':'#8fddd0')},dark:{value:new Color(isGarden?'#17121f':'#073f42')},garden:{value:isGarden?1:0}},
 vertexShader:`varying vec3 n;varying vec3 p;void main(){n=normalize(normalMatrix*normal);p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 n;varying vec3 p;uniform vec3 light;uniform vec3 dark;uniform float garden;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){vec3 nn=normalize(n);float cloud=noise(p*.7)*.65+noise(p*1.8)*.25+noise(p*4.)*.1;float day=smoothstep(-.28,.7,dot(nn,normalize(vec3(-.8,.45,.5))));float rim=pow(1.-max(0.,nn.z),3.);vec3 sea=mix(dark,light,smoothstep(.49,.73,cloud)*.65);vec3 col=sea*(.18+day*.85);col+=light*rim*.36;col=mix(col,dark*.65+light*(pow(rim,2.)*.7+day*.035),garden);gl_FragColor=vec4(col,1.);}`
})
const planet=put(new Mesh(new SphereGeometry(isGarden?10:11,64,40),planetMaterial),[-31,-33,-18],[.2,.4,0],1.45)
const mist=new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,
 uniforms:{time:{value:0},tint:{value:new Color(isGarden?'#a84f70':'#1caa79')},accent:{value:new Color(isGarden?'#e5b67e':'#7bdec2')}},
 vertexShader:`varying vec2 uvv;void main(){uvv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 uvv;uniform float time;uniform vec3 tint;uniform vec3 accent;void main(){vec2 p=uvv*2.-1.;float bend=p.y+p.x*.38+sin(p.x*3.+time*.012)*.16;float ribbons=exp(-abs(bend)*9.)*.26+exp(-abs(bend-.24-sin(p.x*5.)*.07)*24.)*.12;float filaments=.65+.35*sin(p.x*9.+sin(p.y*13.));float edge=1.-smoothstep(.5,1.,length(p));gl_FragColor=vec4(mix(tint,accent,p.x*.5+.5),ribbons*filaments*edge);}`})
put(new Mesh(new PlaneGeometry(230,200),mist),[0,-85,0],[-Math.PI/2,0,isGarden?-.45:.3])
// Fixed world positions, like chapters 2 and 3: camera travel reveals the scenery.
const glowMaterials=new Set<any>()
root.traverse(o=>{if(o instanceof Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if('emissiveIntensity' in m && m.emissiveIntensity>1)glowMaterials.add(m)}})
const gate=secondary.getObjectByName('terminal-gate-rotor')
const shuttle=secondary.getObjectByName('terminal-shuttle')
// Real wall time: the victory speed boost must never accelerate scenery.
useLoop().onBeforeRender(({delta})=>{
 if(run.gameState==='paused')return
 const dt=Math.min(delta,.05)
 elapsed+=dt
 mist.uniforms.time.value=elapsed
 planet.rotation.y=.4+elapsed*.006
 landmark.rotation.y=(isGarden?.4:-.5)+elapsed*(isGarden?.018:.006)
 if(!isGarden)secondary.rotation.y=.55+Math.sin(elapsed*.12)*.12
 if(gate)gate.rotation.z=elapsed*.18
 if(shuttle){shuttle.position.z=4.8+Math.sin(elapsed*.25)*2;shuttle.position.y=.85+Math.sin(elapsed*.7)*.12}
 for(const m of glowMaterials)m.emissiveIntensity=1.25+Math.sin(elapsed*.8)*.18
})
onUnmounted(()=>disposeModel(root))
</script>
<template><primitive :object="root" /></template>
