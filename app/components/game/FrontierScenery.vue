<script setup>
const props = defineProps({ chapter: Number });
const root = shallowRef();
const run = useCurrentRunStore();
useGameLoop().onBeforeRender(() => {
  const p = run.getPlayerPosition();
  if (root.value) root.value.position.set(p.x * .7, -9, p.z * .7);
});
</script>
<template>
  <TresGroup ref="root">
    <TresGroup v-for="i in 8" :key="i" :position="[(i % 2 ? -1 : 1) * (14 + i % 3 * 5), 0, (i - 4) * 11]" :rotation="[0, i * .7, 0]">
      <TresMesh :rotation="[Math.PI / 2, 0, 0]">
        <TresTorusGeometry :args="[chapter === 5 ? 4 : 2.5, .12, 5, chapter === 5 ? 6 : 12]" />
        <TresMeshStandardMaterial :color="chapter === 5 ? '#53376f' : '#244858'" :metalness=".8" :roughness=".6" />
      </TresMesh>
      <TresMesh :position="[0, 0, 3]">
        <TresBoxGeometry :args="[.3, .4, 5]" />
        <TresMeshStandardMaterial color="#182631" :emissive="chapter === 5 ? '#56276f' : '#164c65'" :emissive-intensity=".3" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
