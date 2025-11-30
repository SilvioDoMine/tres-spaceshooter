<script setup lang="js">

</script>

<template>
  <TresGroup>
    <TresMesh :rotation="[-Math.PI / 2, 0, 0]" name="GameWorld">
      <TresPlaneGeometry :args="[10, 20]" />
      <TresMeshStandardMaterial color="black" />
      <Stars />
    </TresMesh>

    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :intensity="1" :position="[5, 10, 7.5]" />
  </TresGroup>
</template>