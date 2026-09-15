<script setup lang="ts">
import { Group, Mesh, IcosahedronGeometry, SphereGeometry, ShaderMaterial, AdditiveBlending, Vector3 } from 'three'
import { rockGeometry } from '~/utils/sceneryRock'

const props = withDefaults(defineProps<{ radius?: number; seed?: number; tilt?: number }>(), { radius: 13, seed: 4, tilt: 1.3 })

// Gigante gelado facetado. O relevo desloca cada VÉRTICE (não cada face): como
// vértices coincidentes recebem o mesmo valor, a casca continua fechada e as
// facetas aparecem sem abrir fendas entre os triângulos.
const root = new Group(); root.rotation.set(props.tilt, .3, -.1)
const spin = new Group(); root.add(spin)
const sun = new Vector3(.75, .3, .45).normalize()

const globe = new IcosahedronGeometry(props.radius, 3)
{
  const p = globe.getAttribute('position'), s = props.seed
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / props.radius, y = p.getY(i) / props.radius, z = p.getZ(i) / props.radius
    // Ondas longas, mais largas que a própria face. Frequência alta demais para
    // o tamanho do polígono amassa a casca: cada face pega um trecho diferente
    // da onda e o globo ganha aparência de papel amassado.
    const swell = 1
      + .024 * Math.sin(x * 1.6 + s) * Math.sin(y * 1.3 + s * 1.3)
      + .013 * Math.sin(z * 1.8 + s * .8)
    p.setXYZ(i, p.getX(i) * swell, p.getY(i) * swell, p.getZ(i) * swell)
  }
}
const faceted = globe.toNonIndexed(); globe.dispose()
faceted.computeVertexNormals()

const surface = new ShaderMaterial({
  uniforms: { time: { value: 0 }, sun: { value: sun } },
  vertexShader: `varying vec3 q;varying vec3 wn;varying vec3 fn;
  void main(){q=normalize(position);fn=normal;wn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec3 q;varying vec3 wn;varying vec3 fn;uniform float time;uniform vec3 sun;
  float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
   return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
  // Seis oitavas: com poucas, a grade cúbica do ruído aparece como vinco na
  // superfície da esfera — é a origem do aspecto de papel amassado.
  float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=n(p)*a;p*=2.13;a*=.5;}return s;}
  void main(){
   float phase=mod(time*.02,6.28318530718);
   float lat=q.y;
   // Faixas largas e calmas: gigante gelado não tem a turbulência do joviano.
   float drift=fbm(q*2.2+vec3(sin(phase)*.25,0.,cos(phase)*.25));
   float band=sin(lat*7.+ (drift-.5)*1.1);
   float veil=fbm(q*3.2+vec3(0.,sin(phase*2.)*.2,0.));
   vec3 abyss=vec3(.05,.15,.22),teal=vec3(.11,.39,.45),ice=vec3(.42,.72,.74),pale=vec3(.79,.89,.88);
   vec3 c=mix(abyss,teal,smoothstep(-.6,.4,band));
   c=mix(c,ice,smoothstep(.1,.85,band)*.8);
   // Transição larga: borda estreita sobre ruído celular vira dobra marcada.
   c=mix(c,pale,smoothstep(.48,.98,veil)*.45);
   c*=.94+.12*fbm(q*18.);
   // Realce por faceta bem contido: ele multiplica a irregularidade das
   // normais, e no volume anterior transformava o relevo em vinco de papel.
   float facet=dot(normalize(fn),normalize(vec3(.4,.8,.3)));
   c*=.96+.055*facet;
   float lit=smoothstep(-.25,.5,dot(normalize(wn),sun));
   c=mix(c*vec3(.16,.24,.38)*.5,c,lit);
   c+=vec3(.35,.7,.8)*exp(-pow((dot(normalize(wn),sun)-.04)*6.,2.))*.18;
   gl_FragColor=vec4(c,1.);}`,
})
spin.add(new Mesh(faceted, surface))

// Atmosfera: na referência ela é um fio brilhante no limbo, bem mais forte que
// a do capítulo 2 — é o que separa o planeta do fundo escuro.
const shellGeo = new SphereGeometry(props.radius * 1.045, 64, 42)
const atmosphere = new ShaderMaterial({
  transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { sun: { value: sun } },
  vertexShader: `varying vec3 vn;varying vec3 vv;varying vec3 wn;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vn=normalize(normalMatrix*normal);vv=normalize(-p.xyz);wn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*p;}`,
  fragmentShader: `varying vec3 vn;varying vec3 vv;varying vec3 wn;uniform vec3 sun;
  void main(){float r=1.-abs(dot(vn,vv));
   float halo=pow(r,2.6)*.5+pow(r,9.)*1.3;
   float lit=smoothstep(-.4,.45,dot(normalize(wn),sun));
   vec3 c=mix(vec3(.16,.38,.62),vec3(.62,.93,1.),lit);
   gl_FragColor=vec4(c,halo*(.22+.72*lit));}`,
})
root.add(new Mesh(shellGeo, atmosphere))

// Luas: irregulares e crateradas. Esfera lisa e cinza a essa distância vira
// uma bolinha morta no fundo — o relevo é o que dá leitura de corpo rochoso.
const moonGeo = rockGeometry(props.seed * 3 + 1, 2)
const moonMat = new ShaderMaterial({
  uniforms: { sun: { value: sun } },
  vertexShader: `varying vec3 wn;varying vec3 q;void main(){wn=normalize(mat3(modelMatrix)*normal);q=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec3 wn;varying vec3 q;uniform vec3 sun;
  float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
   return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
  void main(){
   vec3 rust=vec3(.29,.24,.23),bone=vec3(.62,.63,.6);
   vec3 c=mix(rust,bone,n(q*3.4)*.75+n(q*8.)*.25);
   // Crateras: bacia escura com muralha clara na borda.
   for(int i=0;i<5;i++){float f=float(i);
    vec3 centre=normalize(vec3(sin(f*2.399),cos(f*1.77),sin(f*4.1+.5)));
    float dist=length(q-centre)/(.16+.16*fract(sin(f*7.3)*431.));
    c*=1.-.4*smoothstep(1.,.3,dist);
    c+=vec3(.1)*exp(-pow(dist-1.,2.)*30.);}
   c*=.82+.3*n(q*22.);
   float lit=smoothstep(-.32,.55,dot(normalize(wn),sun));
   c=mix(c*vec3(.14,.17,.26)*.6,c,lit);
   gl_FragColor=vec4(c,1.);}`,
})
const moons = [
  { orbit: new Group(), body: new Mesh(moonGeo, moonMat), dist: props.radius * 1.9, size: .9, speed: .05, tilt: .5, tumble: .06 },
  { orbit: new Group(), body: new Mesh(moonGeo, moonMat), dist: props.radius * 2.6, size: .55, speed: .032, tilt: -.85, tumble: -.09 },
]
moons.forEach((moon) => {
  moon.orbit.rotation.set(moon.tilt, 0, .2)
  moon.body.position.set(moon.dist, 0, 0)
  moon.body.scale.set(moon.size, moon.size * .88, moon.size * 1.06)
  moon.orbit.add(moon.body); root.add(moon.orbit)
})

const TAU = Math.PI * 2
const CYCLE = TAU / .02
useLoop().onBeforeRender(({ delta }) => {
  const d = Math.min(delta, .1)
  surface.uniforms.time!.value = (surface.uniforms.time!.value + d) % CYCLE
  spin.rotation.y = (spin.rotation.y + d * .02) % TAU
  moons.forEach((moon) => {
    moon.orbit.rotation.y = (moon.orbit.rotation.y + d * moon.speed) % TAU
    moon.body.rotation.y = (moon.body.rotation.y + d * moon.tumble) % TAU
    moon.body.rotation.x = (moon.body.rotation.x + d * moon.tumble * .45) % TAU
  })
})
onUnmounted(() => { faceted.dispose(); shellGeo.dispose(); moonGeo.dispose(); surface.dispose(); atmosphere.dispose(); moonMat.dispose() })
</script>
<template><primitive :object="root" /></template>
