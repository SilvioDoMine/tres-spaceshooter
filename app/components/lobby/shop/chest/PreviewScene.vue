<script setup lang="ts">
import { useLoop } from '@tresjs/core';
import { CHESTS, type ChestType } from '~/data/shop';
import { buildChestModel } from '~/utils/chestModel';

// Baú do card da loja: flutua devagar, balança e a gema pulsa; com `glow` (grátis/chaves) brilha mais.
const props = defineProps<{ type: ChestType; glow?: boolean }>();

const model = buildChestModel(CHESTS[props.type].theme);
model.root.rotation.x = 0.08;

const { onBeforeRender } = useLoop();
let elapsed = Math.random() * 10;
onBeforeRender(({ delta }) => {
  elapsed += delta;
  model.body.position.y = Math.sin(elapsed * 1.8) * 0.05;
  model.root.rotation.y = Math.sin(elapsed * 0.7) * 0.28;
  const pulse = 0.5 + 0.5 * Math.sin(elapsed * (props.glow ? 5 : 2.5));
  model.setGlow(props.glow ? 0.5 + pulse * 0.5 : pulse * 0.35, props.glow ? 0.55 + pulse * 0.45 : 0.45);
  // Tampa "respira" quando tem baú para abrir
  model.setLid(props.glow ? Math.max(0, Math.sin(elapsed * 3)) * 0.05 : 0);
});

onBeforeUnmount(() => model.dispose());
</script>

<template>
  <TresPerspectiveCamera :position="[0, 1.55, 4.4]" :look-at="[0, 0.55, 0]" :fov="36" />
  <TresAmbientLight :intensity="1.3" />
  <TresDirectionalLight :position="[2.5, 5, 4]" :intensity="2.6" />
  <TresDirectionalLight :position="[-3, 2, -2]" :intensity="1.2" color="#9fd4ff" />
  <primitive :object="model.root" />
</template>
