<script setup lang="ts">
import { DynamicDrawUsage, ExtrudeGeometry, InstancedMesh, MeshStandardMaterial, Object3D, Shape } from 'three';
import { useLoop } from '@tresjs/core';
import { useHeartStore } from '~/stores/useHeartStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';

const store = useHeartStore();
const run = useCurrentRunStore();
const shape = new Shape();
shape.moveTo(0, -.5);
shape.bezierCurveTo(-1, .1, -.65, .8, 0, .35);
shape.bezierCurveTo(.65, .8, 1, .1, 0, -.5);
const geometry = new ExtrudeGeometry(shape, { depth: .12, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .04, bevelThickness: .04, curveSegments: 8 });
geometry.rotateX(-Math.PI / 2);
const material = new MeshStandardMaterial({ color: '#ff7199', emissive: '#ed245c', emissiveIntensity: .65, roughness: .35 });
const mesh = new InstancedMesh(geometry, material, 32);
mesh.instanceMatrix.setUsage(DynamicDrawUsage);
mesh.frustumCulled = false;
mesh.count = 0;
const dummy = new Object3D();
let time = 0;
useLoop().onBeforeRender(({ delta }) => {
  if (run.isPlaying) time += Math.min(delta, .1);
  mesh.count = store.hearts.length;
  store.hearts.forEach((heart, i) => {
    dummy.position.set(heart.x, .45 + Math.sin(time * 2 + heart.id) * .1, heart.z);
    dummy.scale.setScalar(.7 + Math.sin(time * 4 + heart.id) * .04);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
});
onUnmounted(() => { mesh.dispose(); geometry.dispose(); material.dispose(); });
</script>

<template><primitive :object="mesh" /></template>
