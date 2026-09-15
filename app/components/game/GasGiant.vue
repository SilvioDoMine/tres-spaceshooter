<script setup lang="ts">
import { Group, Mesh, SphereGeometry, RingGeometry, IcosahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D, Color, ShaderMaterial, DoubleSide, AdditiveBlending, Vector3 } from 'three'

// Gigante gasoso: faixas de jato zonal, turbulência por domain warping e
// tempestades ovais que giram sobre si mesmas. Nada é textura — tudo evolui no
// shader, então as bandas realmente deslizam umas sobre as outras.
// Eixo quase deitado, de propósito: a câmera do jogo olha de cima, e com o eixo
// em pé só o polo aparece — as bandas viram anéis concêntricos e o globo lê
// como um disco chapado. Deitado, as faixas atravessam o disco como em Júpiter.
const root = new Group(); root.rotation.set(1.35, .2, -.12)
const sun = new Vector3(-.62, .5, .6).normalize()

// Ruído 3D amostrado pela direção: sem UV, logo sem costura nos polos.
const noise3 = `
float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
  mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=n(p)*a;p*=2.11;a*=.5;}return s;}
vec3 rotY(vec3 p,float a){float s=sin(a),c=cos(a);return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);}`

// A mancha nasce ancorada na face que a câmera enxerga — solta numa longitude
// qualquer, ela passaria a maior parte do tempo escondida atrás do planeta.
const toCamera = new Vector3(32, 116, 16).normalize().applyQuaternion(root.quaternion.clone().invert())
const spotBase = new Vector3(toCamera.x, 0, toCamera.z).normalize().multiplyScalar(.954).setY(-.3)

const globe = new SphereGeometry(12, 160, 96)
const surface = new ShaderMaterial({
  uniforms: { time: { value: 0 }, sun: { value: sun }, spotBase: { value: spotBase } },
  vertexShader: `varying vec3 q;varying vec3 wn;void main(){q=normalize(position);wn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec3 q;varying vec3 wn;uniform float time;uniform vec3 sun;uniform vec3 spotBase;${noise3}
  void main(){
   vec3 d=normalize(q);
   float lat=d.y;
   // Jatos alternados: cada faixa corre com velocidade própria e é o
   // cisalhamento entre elas que enrola os redemoinhos nas fronteiras.
   // Fase que dá a volta em TAU. Todo movimento daqui para baixo é múltiplo
   // INTEIRO dela, então ao fim de um ciclo cada faixa girou um número exato de
   // voltas e o desenho volta a ser o mesmo. Com velocidade contínua a
   // defasagem entre faixas vizinhas cresceria para sempre e o padrão se
   // desmanchava depois de alguns minutos de jogo — baixar a velocidade só adia.
   float phase=mod(time*0.02,6.28318530718);
   float jetIdx=floor(sin(lat*9.)*3.);
   vec3 f=rotY(d,phase*jetIdx);
   // Balanço oscilatório: suaviza o degrau entre faixas sem acumular nada.
   f=rotY(f,sin(phase)*.05*sin(lat*17.));
   // Domain warping: amostrar o ruído em coordenadas já distorcidas por outro
   // ruído é o que produz o fluxo entrelaçado em vez de listras lisas.
   vec2 w=vec2(fbm(f*2.4+vec3(sin(phase)*.3,0.,cos(phase)*.3)),fbm(f*2.4+vec3(4.7,2.1,sin(phase)*.25)));
   vec3 g2=f*3.9+vec3(w.x,w.y,w.x)*1.5;
   float turb=fbm(g2);
   float fine=fbm(g2*3.1+vec3(w.y*2.,0.,0.));
   // Perturbação contida de propósito: a faixa precisa ficar onde nasceu. Com
   // amplitude grande o desenho inteiro migra e o planeta perde a identidade a
   // cada volta — o movimento tem que estar na textura, não na posição da faixa.
   float band=lat*10.5+(turb-.5)*.75+(w.x-.5)*.55;
   // Festões: a turbulência de borda só morde onde duas faixas se encontram,
   // que é onde Júpiter embola o contorno em vez de fazer listra reta.
   float seam=1.-abs(sin(band));
   band+=(fbm(g2*3.4+vec3(0.,sin(phase*2.)*.4,0.))-.5)*.85*seam;
   float belt=sin(band),zone=sin(band*2.7+.8);
   vec3 deep=vec3(.27,.15,.09),beltC=vec3(.69,.42,.22),zoneC=vec3(.93,.86,.71),crown=vec3(1.,.99,.95);
   vec3 c=mix(deep,beltC,smoothstep(-.45,.35,belt));
   c=mix(c,zoneC,smoothstep(-.05,.6,zone)*.85);
   c=mix(c,crown,smoothstep(.6,.88,turb)*.75);
   c=mix(c,deep,smoothstep(.42,.14,turb)*.7);
   c*=.82+.36*fine;
   // Grande mancha: uma volta por ciclo, espiral girando três — inteiros, então
   // ela também fecha exatamente onde começou.
   vec3 spot=rotY(spotBase,phase);
   vec3 tang=normalize(cross(vec3(0.,1.,0.),spot));
   float sx=dot(d-spot,tang),sy=(d.y-spot.y)*2.3;
   float sr=length(vec2(sx,sy));
   float ang=atan(sy,sx)+(.3-sr)*7.+phase*3.;
   float swirl=fbm(vec3(cos(ang)*sr*7.,sin(ang)*sr*7.,sin(phase*2.)*.3)+spot*3.);
   vec3 storm=mix(vec3(.75,.3,.12),vec3(.96,.64,.33),swirl);
   c=mix(c,storm,smoothstep(.3,.05,sr)*.94);
   c=mix(c,crown,smoothstep(.37,.3,sr)*smoothstep(.25,.31,sr)*.65);
   // Tempestades menores, cada uma derivando na sua própria faixa.
   for(int i=0;i<3;i++){float fi=float(i);
    vec3 o=rotY(normalize(vec3(sin(fi*2.7)*1.3,-.6+fi*.56,cos(fi*1.9))),phase*(1.+fi));
    vec3 ot=normalize(cross(vec3(0.,1.,0.),o));
    float orr=length(vec2(dot(d-o,ot),(d.y-o.y)*2.6));
    c=mix(c,mix(crown,vec3(.86,.6,.38),fract(fi*.53)),smoothstep(.11,.02,orr)*.8);}
   float lambert=dot(normalize(wn),sun);
   float lit=smoothstep(-.22,.45,lambert);
   c=mix(c*vec3(.11,.13,.22)*.62,c,lit);
   c+=vec3(.5,.3,.14)*exp(-pow((lambert-.02)*6.,2.))*.22;
   gl_FragColor=vec4(c,1.);}`,
})
const spin = new Group(); spin.add(new Mesh(globe, surface)); root.add(spin)

// Neblina de alta altitude: só nos polos e no limbo, para o globo não terminar
// num corte seco contra o espaço.
const atmosphere = new ShaderMaterial({
  transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { sun: { value: sun } },
  vertexShader: `varying vec3 vn;varying vec3 vv;varying vec3 wn;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vn=normalize(normalMatrix*normal);vv=normalize(-p.xyz);wn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*p;}`,
  fragmentShader: `varying vec3 vn;varying vec3 vv;varying vec3 wn;uniform vec3 sun;
  void main(){float f=pow(1.-abs(dot(vn,vv)),3.4);
   float lit=smoothstep(-.3,.5,dot(normalize(wn),sun));
   vec3 c=mix(vec3(.2,.3,.5),vec3(.98,.86,.66),lit*.8);
   gl_FragColor=vec4(c,f*(.16+.5*lit));}`,
})
const glow = new Mesh(globe, atmosphere); glow.scale.setScalar(1.03); root.add(glow)

// ── Anel ─────────────────────────────────────────────────────────────────
// Rocha de verdade em órbita, com um véu de poeira fina por baixo só para dar
// coesão de disco entre os blocos.
const ringGeo = new RingGeometry(15.5, 25, 320, 24); ringGeo.rotateX(-Math.PI / 2)
// Anel no plano equatorial: como o eixo está deitado, ele fica quase de pé no
// mundo e a câmera o vê em elipse, não como disco cobrindo o planeta.
const ringTilt = new Group(); ringTilt.rotation.set(0, 0, .1); root.add(ringTilt)
const rings = new ShaderMaterial({
  side: DoubleSide, transparent: true, depthWrite: false,
  uniforms: { shadow: { value: new Vector3(-sun.x, 0, -sun.z).normalize() } },
  vertexShader: `varying vec3 p;varying vec3 vp;void main(){p=position;vec4 m=modelViewMatrix*vec4(position,1.);vp=m.xyz;gl_Position=projectionMatrix*m;}`,
  fragmentShader: `varying vec3 p;varying vec3 vp;uniform vec3 shadow;
  float h(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
  float n2(vec2 v){vec2 i=floor(v),f=fract(v);f=f*f*(3.-2.*f);
   return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){
   float r=length(p.xz);
   // Véu parado de propósito: girar por aqui exigiria um relógio que cresce sem
   // parar, e o movimento do anel já vem das pedras orbitando por cima.
   float a=atan(p.z,p.x);
   // Ringlets: três frequências somadas dão a leitura de milhares de faixas.
   float fine=(.5+.5*sin(r*34.))*.45+(.5+.5*sin(r*91.+1.7))*.35+(.5+.5*sin(r*223.+.4))*.2;
   float macro=.32+.68*(.5+.5*sin(r*2.6+sin(r*1.1)*2.4));
   float density=macro*(.4+.6*fine);
   // Divisões limpas, como a de Cassini.
   density*=smoothstep(.05,.3,abs(r-17.9));
   density*=smoothstep(.04,.24,abs(r-20.8));
   density*=smoothstep(.03,.16,abs(r-22.6));
   // Grumos que viajam junto com o anel.
   density*=.74+.26*n2(vec2(a*6.5,r*2.2));
   density*=.85+.15*n2(vec2(a*23.,r*7.));
   float edge=smoothstep(15.5,16.9,r)*smoothstep(25.,23.2,r);
   // Sombra do planeta cortando o anel.
   float along=dot(p.xz,shadow.xz);
   float perp=length(p.xz-shadow.xz*along);
   float shade=along>0.?smoothstep(12.4,9.2,perp):1.;
   // Partículas geladas de frente, poeira avermelhada nas bordas.
   vec3 ice=vec3(.86,.82,.74),dust=vec3(.56,.38,.26);
   vec3 c=mix(dust,ice,fine*.85);
   c=mix(c,dust,smoothstep(.55,1.,abs(r-20.)/5.)*.5);
   c*=.3+.7*shade;
   // Visto quase de perfil o anel concentra brilho: reforça a leitura de disco.
   float graze=pow(1.-abs(normalize(vp).y),1.5);
   gl_FragColor=vec4(c*(.85+.5*graze),edge*density*(.18+.2*graze));}`,
})
ringTilt.add(new Mesh(ringGeo, rings))

// Pedra fechada: o deslocamento depende só da posição do vértice, então
// vértices coincidentes concordam e a malha não abre fendas ao ser deformada.
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 37.7) * 43758.5453; return x - Math.floor(x) }
function rockGeometry(seed: number) {
  const g = new IcosahedronGeometry(1, 1)
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const n = 1 + .32 * Math.sin(x * 2.7 + seed) * Math.sin(y * 3.1 + seed * 1.7) * Math.sin(z * 2.3 + seed * .6)
      + .15 * Math.sin(x * 6.1 + y * 5.3 + z * 4.7 + seed * 2.1)
    p.setXYZ(i, x * n, y * n, z * n)
  }
  const flat = g.toNonIndexed(); g.dispose(); flat.computeVertexNormals(); return flat
}
const rockGeos = [rockGeometry(3), rockGeometry(11), rockGeometry(23)]
const rockMat = new MeshStandardMaterial({ color: '#ffffff', roughness: .94, metalness: .05, flatShading: true })
const shoals: InstancedMesh[] = []
const orbits: { band: Group; speed: number }[] = []
const dummy = new Object3D(), tint = new Color()
// Faixas separadas pelas divisões, cada uma com sua própria órbita: é a
// rotação diferencial que faz o anel parecer matéria solta e não um disco só.
const shells = [[15.9, 17.6, 380], [18.2, 20.5, 520], [21.1, 22.3, 260], [22.9, 24.5, 360]]
shells.forEach((shell, si) => {
  const [from, to, count] = shell as [number, number, number]
  const band = new Group(); ringTilt.add(band)
  const mesh = new InstancedMesh(rockGeos[si % rockGeos.length]!, rockMat, count)
  for (let i = 0; i < count; i++) {
    const s = si * 400 + i
    const a = rnd(s) * Math.PI * 2, r = from + rnd(s + 1) * (to - from)
    // Disco fino: espalhar em altura transforma o anel numa nuvem de pedras.
    dummy.position.set(Math.cos(a) * r, (rnd(s + 2) - .5) * .22, Math.sin(a) * r)
    dummy.rotation.set(rnd(s + 3) * 6, rnd(s + 4) * 6, rnd(s + 5) * 6)
    const size = .035 + Math.pow(rnd(s + 6), 3) * .38
    dummy.scale.set(size, size * (.55 + rnd(s + 7) * .5), size * (.75 + rnd(s + 8) * .6))
    dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix)
    tint.setHSL(.07 + rnd(s + 9) * .04, .16 + rnd(s + 10) * .2, .17 + rnd(s + 11) * .3)
    mesh.setColorAt(i, tint)
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.computeBoundingSphere()
  band.add(mesh); shoals.push(mesh)
  orbits.push({ band, speed: Math.pow(15.9 / ((from + to) / 2), 1.5) * .05 })
})

// Período em que a superfície fecha o ciclo (a fase do shader corre a 0.02).
// Reiniciar o relógio aqui é invisível — todo movimento é múltiplo inteiro
// dessa fase — e mantém o uniform pequeno: um float32 acumulando horas perde
// precisão e a animação começa a andar aos saltos.
const CYCLE = Math.PI * 2 / .02
const TAU = Math.PI * 2
useLoop().onBeforeRender(({ delta }) => {
  const d = Math.min(delta, .1)
  surface.uniforms.time!.value = (surface.uniforms.time!.value + d) % CYCLE
  spin.rotation.y = (spin.rotation.y + d * .026) % TAU
  orbits.forEach((orbit) => { orbit.band.rotation.y = (orbit.band.rotation.y + d * orbit.speed) % TAU })
})
onUnmounted(() => {
  globe.dispose(); ringGeo.dispose(); surface.dispose(); atmosphere.dispose(); rings.dispose()
  shoals.forEach(m => m.dispose()); rockGeos.forEach(g => g.dispose()); rockMat.dispose()
})
</script>
<template><primitive :object="root" /></template>
