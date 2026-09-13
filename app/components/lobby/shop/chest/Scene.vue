<script setup lang="ts">
import { useLoop } from '@tresjs/core';
import { Group } from 'three';
import { CHESTS, type ChestType } from '~/data/shop';
import { buildChestModel } from '~/utils/chestModel';
import { chestFrame, chestTimeline, type ChestFrame } from '~/utils/chestTimeline';
import { buildChestVfx, OPENING_CAMERA, openingCameraPosition } from '~/utils/chestVfx';

// Cena da abertura (dentro do TresCanvas): baú cai, treme, abre com clarão e raios, e o item sobe.
// playId reinicia a animação; skipId pula para o fim do item atual.
const props = withDefaults(
  defineProps<{ type: ChestType; haloColor: string; high: boolean; playId: number; skipId?: number; speed?: number }>(),
  { skipId: 0, speed: 1 },
);
const emit = defineEmits<{ frame: [frame: ChestFrame]; opened: []; done: [] }>();

// A proporção é lida ao montar; quem usa a cena remonta o canvas quando ela muda muito
const cameraPosition = openingCameraPosition(window.innerWidth / Math.max(1, window.innerHeight));

const theme = CHESTS[props.type].theme;
const model = buildChestModel(theme);
const vfx = buildChestVfx({ mouthY: model.mouthY, glow: theme.glow, halo: props.haloColor });

const root = new Group();
root.add(model.root, vfx.group);

let t = 0;
let clock = 0;
let opened = false;
let finished = false;

function restart() {
  t = 0;
  opened = false;
  finished = false;
}

watch(() => props.playId, restart);
watch(
  () => props.skipId,
  () => {
    t = Math.max(t, chestTimeline(props.high).end);
  },
);
watch(
  () => props.haloColor,
  color => vfx.setColors(theme.glow, color),
);

const light = ref<{ intensity: number } | null>(null);

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  const dt = Math.min(delta, 0.05) * props.speed;
  t += dt;
  clock += dt;
  const frame = chestFrame(t, props.high);

  // Depois de pronto, o baú "respira"
  const breathe = frame.done ? Math.sin(clock * 2.2) * 0.015 : 0;
  model.body.position.y = frame.y;
  model.body.scale.set(1 + (1 - frame.squash) * 0.5 + breathe, frame.squash - breathe, 1 + (1 - frame.squash) * 0.5 + breathe);
  model.root.rotation.z = frame.tilt;
  model.setLid(frame.lid);
  model.setGlow(frame.gem, 0.45 + frame.rays * 0.35);
  vfx.update(frame, clock, dt);
  if (light.value) light.value.intensity = frame.lid * 1.5 + frame.flash * 6;

  emit('frame', frame);
  if (!opened && frame.flash > 0) {
    opened = true;
    emit('opened');
  }
  if (!finished && frame.done) {
    finished = true;
    emit('done');
  }
});

onBeforeUnmount(() => {
  model.dispose();
  vfx.dispose();
});
</script>

<template>
  <TresPerspectiveCamera :position="cameraPosition" :look-at="[...OPENING_CAMERA.target]" :fov="OPENING_CAMERA.fov" />
  <TresAmbientLight :intensity="1.25" />
  <TresDirectionalLight :position="[3, 6, 5]" :intensity="2.8" />
  <TresDirectionalLight :position="[-4, 3, -3]" :intensity="1.4" :color="theme.glow" />
  <TresPointLight ref="light" :position="[0, model.mouthY + 0.6, 0.9]" :intensity="0" :distance="6" :color="theme.glow" />
  <primitive :object="root" />
</template>
