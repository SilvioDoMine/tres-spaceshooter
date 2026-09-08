<script setup lang="ts">
const run = useCurrentRunStore()
const halfWidth = computed(() => (run.currentStage?.width || 10) / 2)
const halfHeight = computed(() => (run.currentStage?.height || 20) / 2)
const posts = computed(() => {
  const out: [number, number, number][] = []
  for (let x = -halfWidth.value; x <= halfWidth.value; x += 4) {
    out.push([x,-.45,-halfHeight.value], [x,-.45,halfHeight.value])
  }
  for (let z = -halfHeight.value + 4; z < halfHeight.value; z += 4) {
    out.push([-halfWidth.value,-.45,z], [halfWidth.value,-.45,z])
  }
  return out
})
</script>
<template>
  <TresGroup name="Limites visiveis da arena">
    <TresMesh v-for="side in [-1,1]" :key="`x${side}`" :position="[side * halfWidth,-.28,0]">
      <TresBoxGeometry :args="[.045,.045,halfHeight*2]" />
      <TresMeshBasicMaterial color="#2bbfcb" :transparent="true" :opacity=".65" />
    </TresMesh>
    <TresMesh v-for="side in [-1,1]" :key="`z${side}`" :position="[0,-.28,side * halfHeight]">
      <TresBoxGeometry :args="[halfWidth*2,.045,.045]" />
      <TresMeshBasicMaterial color="#2bbfcb" :transparent="true" :opacity=".65" />
    </TresMesh>
    <TresGroup v-for="(position,i) in posts" :key="i" :position="position">
      <TresMesh><TresCylinderGeometry :args="[.15,.3,.24,6]" /><TresMeshStandardMaterial color="#344d60" :metalness=".6" /></TresMesh>
      <TresMesh :position="[0,.13,0]"><TresSphereGeometry :args="[.075,8,6]" /><TresMeshBasicMaterial color="#79eeec" /></TresMesh>
    </TresGroup>
  </TresGroup>
</template>
