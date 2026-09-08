<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { useLoop } from '@tresjs/core'
import { Group, Mesh, MeshStandardMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const model = shallowRef(new Group())
const settings = useShipAppearance()

const panels: MeshStandardMaterial[] = []
let disposed = false
onMounted(async () => {
  try {
    const { scene } = await new GLTFLoader().loadAsync('/models/kestrel-07.glb')
    if (disposed) { dispose(scene); return }
    scene.scale.setScalar(.18)
    scene.traverse((object) => {
      if (/jato|ignicao/i.test(object.name)) object.visible = false
      if (!(object instanceof Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (material instanceof MeshStandardMaterial && /petroleo|laranja/i.test(material.name)) panels.push(material)
      })
    })
    model.value = scene
  } catch (error) { console.error('Falha ao carregar Kestrel-07', error) }
})
useLoop().onBeforeRender(() => {
  panels.forEach(m => { m.color.set(settings.value.color); m.metalness=settings.value.finish ?? .4; m.roughness=1-(settings.value.finish ?? .4)*.75 })
})
function dispose(group: Group) {
  group.traverse((o) => {
    if (!(o instanceof Mesh)) return
    o.geometry.dispose()
    ;(Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose())
  })
}
onUnmounted(() => { disposed = true; dispose(model.value) })
</script>

<template><TresGroup><primitive :object="model" /><GameEnginePlumes v-if="settings.thrusters" /></TresGroup></template>


