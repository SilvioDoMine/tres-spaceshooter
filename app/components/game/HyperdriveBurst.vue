<script setup lang="ts">
import { AdditiveBlending, Color, Mesh, PlaneGeometry, ShaderMaterial, Group } from 'three';

// Hiper velocidade da sala limpa, como quebrar a barreira do som:
// cone de vapor que a nave atravessa + flash + linhas de velocidade (presos à nave)
// e estrondo duplo de anéis de choque que fica para trás no ponto de ativação.
const run = useCurrentRunStore();
const thrusterColor = useThrusterColor();
const punch = useState('hyperdrive-punch', () => 0);
const root = new Group();
const color = new Color('#27c7ff');

const CONE_LIFE = .9, CONE_SIZE = 9, SHOCK_LIFE = 1.15, SHOCK_SIZE = 16, PUNCH_TIME = .35;

const noiseGlsl = `float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}`;
// Plano no chão com coordenadas locais da nave: s = lateral, f = para frente (bico em -z)
const planeVertex = `varying vec2 local; varying vec2 edge; uniform float size;
  void main(){edge=position.xz;local=vec2(position.x,-position.z)*size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const geometry = new PlaneGeometry(1, 1); geometry.rotateX(-Math.PI / 2);

const coneMaterial = new ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, side: 2,
  uniforms: { color: { value: color }, time: { value: 0 }, size: { value: CONE_SIZE } },
  vertexShader: planeVertex,
  fragmentShader: `uniform vec3 color; uniform float time; varying vec2 local; varying vec2 edge;
    ${noiseGlsl}
    void main(){
      float t=clamp(time/${CONE_LIFE.toFixed(2)},0.,1.), s=local.x, f=local.y;
      float border=(1.-smoothstep(.36,.5,abs(edge.x)))*(1.-smoothstep(.36,.5,abs(edge.y)));
      // Frente parabólica do cone: nasce à frente do bico, a nave passa por ela e ela se abre para trás
      float ease=1.-pow(1.-t,2.2);
      float apex=mix(1.5,-2.8,ease), curve=mix(1.25,.45,ease), width=.2+.38*t;
      float d=(apex-curve*s*s)-f;
      float vapor=noise(local*2.2+vec2(0.,time*3.))*.55+noise(local*5.3-vec2(time*2.,0.))*.45;
      float shell=exp(-pow(d/width,2.));
      float fill=smoothstep(-.05,.12,d)*exp(-d*1.15)*.75;
      float lip=exp(-pow(d/(width*.3),2.))*.35;
      float coneFade=smoothstep(0.,.07,t)*(1.-smoothstep(.35,1.,t))*exp(-s*s*.32);
      float cone=(shell*.8+fill)*(.3+.95*vapor*vapor)*coneFade;
      // Clarão no centro da nave logo na ativação
      float flash=exp(-dot(local,local)*1.1)*exp(-time*13.);
      // Linhas de velocidade atrás da nave, correndo para trás
      float lane=s*3.4, id=floor(lane), cx=abs(fract(lane)-.5);
      float phase=fract(f*.32+time*4.8+hash(vec2(id,7.))*9.);
      float segment=smoothstep(0.,.12,phase)*(1.-smoothstep(.22,.55,phase));
      float region=smoothstep(-.4,-1.,f)*smoothstep(-4.3,-2.2,f)*(1.-smoothstep(1.,1.9,abs(s)));
      float streaks=(1.-smoothstep(.03,.1,cx))*segment*step(.45,hash(vec2(id,3.)))*region
        *smoothstep(0.,.08,t)*(1.-smoothstep(.25,.85,t));
      vec3 white=vec3(1.), tint=mix(color,white,.78);
      vec3 col=tint*cone*.9+white*lip*coneFade*.7+white*flash*1.6+mix(color,white,.55)*streaks*.8;
      // Aditivo: a própria cor já carrega a intensidade
      col*=border;
      if(max(max(col.r,col.g),col.b)<.003)discard;
      gl_FragColor=vec4(col,1.);}` });
const cone = new Mesh(geometry, coneMaterial); cone.scale.setScalar(CONE_SIZE); cone.renderOrder = 10; cone.visible = false; root.add(cone);

const shockMaterial = new ShaderMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, side: 2,
  uniforms: { color: { value: color }, time: { value: 0 }, size: { value: SHOCK_SIZE } },
  vertexShader: planeVertex,
  fragmentShader: `uniform vec3 color; uniform float time; varying vec2 local; varying vec2 edge;
    // Borda da frente nítida, rastro de dentro suave
    float ring(float dist,float radius,float thick){float x=dist-radius;
      return x>0.?exp(-x*x/(thick*thick*.12)):exp(x/(thick*1.1))*.55;}
    float wave(float dist,float delay,float reach){
      float t=clamp((time-delay)/${SHOCK_LIFE.toFixed(2)},0.,1.);
      if(time<delay)return 0.;
      float radius=.5+reach*(1.-pow(1.-t,3.)), thick=.08+.22*t;
      return ring(dist,radius,thick)*pow(1.-t,1.6);}
    void main(){
      float border=1.-smoothstep(.4,.5,max(abs(edge.x),abs(edge.y)));
      // Cone de Mach: a onda alonga para trás da direção em que a nave ia
      vec2 q=vec2(local.x,local.y*(local.y>0.?1.25:.82));
      float dist=length(q);
      // Franja cromática sutil só na borda, o corpo da onda fica neutro na cor do propulsor
      float r=wave(dist-.025,0.,6.2)+wave(dist-.025,.13,4.6)*.55;
      float g=wave(dist,0.,6.2)+wave(dist,.13,4.6)*.55;
      float b=wave(dist+.025,0.,6.2)+wave(dist+.025,.13,4.6)*.55;
      vec3 fringe=mix(vec3(g),vec3(r,g,b),.35), tint=mix(color,vec3(1.),.6);
      vec3 col=fringe*tint*1.15*border;
      if(max(max(col.r,col.g),col.b)<.003)discard;
      gl_FragColor=vec4(col,1.);}` });
const shock = new Mesh(geometry, shockMaterial); shock.scale.setScalar(SHOCK_SIZE); shock.visible = false; root.add(shock);

let burstAge = 99, wasActive = false;

useGameLoop().onBeforeRender(({ delta }) => {
  if (!run.isPlaying) return;
  const active = run.isHyperdrive;
  const player = run.getPlayerPosition(), yaw = run.getPlayerRotation().y;
  if (active && !wasActive) {
    burstAge = 0;
    // O estrondo fica onde a nave rompeu a barreira
    shock.position.set(player.x, .12, player.z); shock.rotation.y = yaw;
  }
  wasActive = active;
  burstAge += Math.min(delta, .1);
  color.set(thrusterColor());

  cone.visible = burstAge < CONE_LIFE;
  if (cone.visible) {
    cone.position.set(player.x, .65, player.z); cone.rotation.y = yaw;
    coneMaterial.uniforms.time.value = burstAge;
  }
  shock.visible = burstAge < SHOCK_LIFE + .13;
  shockMaterial.uniforms.time.value = burstAge;
  punch.value = Math.max(0, 1 - burstAge / PUNCH_TIME);
});

onUnmounted(() => { punch.value = 0; geometry.dispose(); coneMaterial.dispose(); shockMaterial.dispose(); });
</script>

<template><primitive :object="root" /></template>
