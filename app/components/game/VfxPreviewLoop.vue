<script setup lang="ts">
const projectiles=useProjectileStore()
useLoop().onBeforeRender(({delta})=>projectiles.update(Math.min(delta,.05)))
</script>
<template><TresGroup /></template>
