<script setup lang="ts">
import { Group, Mesh, SphereGeometry, RingGeometry, ShaderMaterial, DoubleSide, AdditiveBlending } from 'three'
const root=new Group();root.rotation.set(1.05,.15,-.35)
const vertex=`varying vec2 v; varying vec3 n; void main(){v=uv;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
const surface=new ShaderMaterial({uniforms:{time:{value:0}},vertexShader:vertex,fragmentShader:`varying vec2 v;varying vec3 n;uniform float time;void main(){float b=sin(v.y*45.+sin(v.x*18.+time*.08)*1.8);float fine=sin(v.y*150.+sin(v.x*40.)*2.);vec3 c=mix(vec3(.22,.31,.43),vec3(.76,.61,.42),.5+b*.22+fine*.07);float l=.17+.83*max(0.,dot(normalize(n),normalize(vec3(-.6,.6,1.))));gl_FragColor=vec4(c*l,1.);}`})
const sphere=new SphereGeometry(10,64,48);root.add(new Mesh(sphere,surface))
const ringGeo=new RingGeometry(12,19,160,12);ringGeo.rotateX(-Math.PI/2)
const rings=new ShaderMaterial({side:DoubleSide,transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 p;uniform float time;void main(){float r=length(p.xz);float grain=.5+.5*sin(r*35.);float gap=smoothstep(.15,.35,abs(r-15.7));float edge=smoothstep(12.,12.4,r)*smoothstep(19.,18.4,r);float flicker=.95+.05*sin(atan(p.z,p.x)*30.+time*.3);vec3 c=mix(vec3(.16,.37,.46),vec3(.75,.64,.47),grain*.6);gl_FragColor=vec4(c,edge*gap*(.22+grain*.18)*flicker);}`})
root.add(new Mesh(ringGeo,rings))
const atmosphere=new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,vertexShader:`varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,fragmentShader:`varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(n,v)),3.);gl_FragColor=vec4(.2,.65,1.,f*.35);}`})
const glow=new Mesh(sphere,atmosphere);glow.scale.setScalar(1.025);root.add(glow)
useGameLoop().onBeforeRender(({delta})=>{surface.uniforms.time.value+=Math.min(delta,.1);rings.uniforms.time.value+=Math.min(delta,.1)})
onUnmounted(()=>{sphere.dispose();ringGeo.dispose();surface.dispose();rings.dispose();atmosphere.dispose()})
</script>
<template><primitive :object="root" /></template>

