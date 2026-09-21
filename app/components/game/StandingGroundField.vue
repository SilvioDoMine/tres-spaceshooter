<script setup lang="ts">
import { AdditiveBlending, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { usePlayerStats } from '~/stores/playerStats';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useSkillStore } from '~/stores/SkillStore';

// Posição Firme: enquanto a nave está parada, o chão embaixo dela acende como uma plataforma de
// ancoragem. Doze placas travam em volta, uma de cada vez, e são o medidor da carga: placa acesa é
// cadência já conquistada. As espirais puxam energia para o núcleo cada vez mais rápido e, no fim,
// o núcleo pulsa junto com a rajada.
// Fica tudo deitado no chão, num plano só: nada de anel, domo ou casca parada em volta do casco —
// isso leria como campo de força (ver docs/SHIP_DESIGN_GUIDE.md).
// As fissuras vermelhas que abrem para fora são o aviso honesto da desvantagem: quanto mais larga a
// rachadura, mais caro sai cada tiro inimigo.
const PLATES = 12; // placas do medidor circular
const SIZE = 6; // lado do plano em unidades de mundo (raio útil de 3)
const RISE = .14; // segundos para o campo acender
const DROP = .18; // segundos para apagar quando a nave anda

const run = useCurrentRunStore();
const stats = usePlayerStats();
const skills = useSkillStore();

const geometry = new PlaneGeometry(1, 1);
geometry.rotateX(-Math.PI / 2);

const material = new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  side: 2,
  uniforms: { time: { value: 0 }, charge: { value: 0 }, fade: { value: 0 }, size: { value: SIZE } },
  vertexShader: `varying vec2 local; varying vec2 edge; uniform float size;
    void main(){edge=position.xz;local=position.xz*size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform float time; uniform float charge; uniform float fade;
    varying vec2 local; varying vec2 edge;
    const float PLATES=${PLATES.toFixed(1)};
    const float RADIUS=1.15; // onde ficam as placas de ancoragem
    void main(){
      // O quadrado desaparece antes da borda: o plano nunca mostra o próprio recorte
      float border=1.-smoothstep(.34,.5,max(abs(edge.x),abs(edge.y)));
      float d=length(local);
      float a=atan(local.y,local.x);
      float c=clamp(charge,0.,1.);

      // Medidor: as placas travam uma a uma no sentido do relógio; a que está travando agora vibra
      float slot=a*.15915494+.5;
      float index=floor(slot*PLATES);
      // Folga larga entre as placas: com a carga cheia o medidor continua lendo como doze peças
      // travadas no chão, nunca como uma casca contínua em volta do casco
      float gap=smoothstep(.14,.34,abs(fract(slot*PLATES)-.5));
      float band=exp(-pow((d-RADIUS)/.14,2.))*gap;
      float locked=step(index+1.,c*PLATES);
      float locking=step(abs(index-floor(c*PLATES)),.5)*(.35+.4*sin(time*26.));
      float plate=band*(locked+locking);

      // Espirais puxando energia para o núcleo: giram junto com a cadência conquistada
      float arm=sin(a*3.+d*3.4-time*(1.2+7.5*c));
      float spiral=smoothstep(.85,1.,arm)*smoothstep(1.45,.3,d)*smoothstep(.18,.5,d)*(.22+.78*c);

      // Núcleo sob o casco: com a carga cheia ele pisca praticamente na cadência do tiro
      float beat=.5+.5*sin(time*(6.+42.*c*c));
      float core=exp(-d*d*2.2)*(.16+.5*c)*(.6+.4*beat);

      // Fissuras: riscos finos abrindo para fora, mais vivos conforme a exposição a projéteis cresce.
      // Expoente alto = linha estreita: fica leitura de rachadura, não de mancha de dano no casco.
      float veins=pow(abs(sin(a*2.5+1.3)),90.)+pow(abs(sin(a*1.5-2.1)),140.)*.8;
      float crack=veins*smoothstep(.95,1.45,d)*smoothstep(2.8,1.35,d)*c*(.55+.45*sin(d*9.-time*2.));

      vec3 amber=vec3(1.,.62,.18), white=vec3(1.), danger=vec3(1.,.14,.17);
      vec3 col=amber*(plate*.95+spiral*.7)+mix(amber,white,.75)*core*1.1+danger*crack*.85;
      col*=border*fade;
      if(max(max(col.r,col.g),col.b)<.004)discard;
      gl_FragColor=vec4(col,1.);}`,
});

const field = new Mesh(geometry, material);
field.scale.setScalar(SIZE);
field.renderOrder = 2;
field.frustumCulled = false;
field.visible = false;

let clock = 0, fade = 0;

useGameLoop().onBeforeRender(({ delta }) => {
  // A carta é épica e rara: sem ela o quadro sai daqui antes de tocar em uniform ou matriz
  const charged = skills.hasSkill('standing_ground') && stats.standingTime > 0;
  if (!charged && fade <= 0) {
    if (field.visible) field.visible = false;
    return;
  }

  const dt = run.isPlaying ? Math.min(delta, .1) : 0;
  const target = charged && run.isPlaying ? 1 : 0;
  fade += (target - fade) * Math.min(1, dt / (target > fade ? RISE : DROP));
  if (fade < .004) { fade = 0; field.visible = false; return; }

  clock += dt;
  const player = run.getPlayerPosition();
  field.position.set(player.x, .06, player.z);
  material.uniforms.time!.value = clock;
  material.uniforms.charge!.value = stats.standingGroundProgress;
  material.uniforms.fade!.value = fade;
  field.visible = true;
});

onUnmounted(() => { geometry.dispose(); material.dispose(); });
</script>

<template>
  <primitive :object="field" />
</template>
