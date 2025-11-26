<script setup lang="ts">
// Page metadata
useHead({
  title: 'Level Select',
  meta: [
    { name: 'description', content: 'A TresJS Nuxt application' }
  ]
})
</script>

<template>
  <TresCanvas
    clear-color="#420220"
    window-size
  >
    <TheExperience />
  </TresCanvas>
</template>