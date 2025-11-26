<script setup lang="ts">
// Page metadata
useHead({
  title: 'Play',
  meta: [
    { name: 'description', content: 'A TresJS Nuxt application' }
  ]
})
</script>

<template>
  <TresCanvas
    clear-color="#720220"
    window-size
  >
    <TheExperience />
  </TresCanvas>
</template>