<script setup lang="ts">
import { Group } from 'three'
import { buildWing, disposeWing } from '~/utils/wingModels'
import { useEquipmentStore } from '~/stores/useEquipmentStore'

// A asa é um módulo acoplado ao corpo, não parte dele. Trocar o equipamento
// substitui o modelo inteiro dos dois lados — nada é sobreposto na asa antiga.
const props = defineProps<{ materials: Record<string, any>; gameplay?: boolean; preview?: Record<string, string | number> }>()
const gear = useEquipmentStore()
const root = new Group(); root.name = 'WingSockets'
const mounted: Group[] = []

function rebuild() {
  mounted.splice(0).forEach((wing) => { root.remove(wing); disposeWing(wing) })
  const variant = props.preview ? props.preview.wings : gear.equippedItem('wings' as any)?.defId
  for (const side of [-1, 1]) {
    const wing = buildWing(variant as string | undefined, side, props.materials)
    root.add(wing); mounted.push(wing)
  }
}

watch(() => [props.preview ? props.preview.wings : gear.equippedItem('wings' as any)?.defId], rebuild, { immediate: true })
onUnmounted(() => { mounted.forEach(disposeWing); root.clear() })
</script>
<template><primitive :object="root" /></template>
