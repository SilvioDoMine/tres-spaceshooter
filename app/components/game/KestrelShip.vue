<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { buildKestrelHull } from '~/utils/kestrelModel'

const props = defineProps<{ gameplay?: boolean; preview?: Record<string, string | number> }>()
const emit = defineEmits<{ loaded: [] }>()

const settings = useShipAppearance()
const hull = buildKestrelHull()
watch(() => [settings.value.color, settings.value.finish], () => {
  hull.paint.color.set(settings.value.color)
  hull.paint.metalness = settings.value.finish ?? .4
  hull.paint.roughness = 1 - (settings.value.finish ?? .4) * .75
}, { immediate: true })
onMounted(() => emit('loaded'))
onUnmounted(() => hull.dispose())
</script>

<template><TresGroup><primitive :object="hull.root" /><GameShipEquipment :gameplay="props.gameplay" :preview="props.preview" /><GameEnginePlumes v-if="settings.thrusters" :gameplay="props.gameplay" :preview="props.preview" /></TresGroup></template>
