<script setup lang="ts">
import {
  AdditiveBlending, CircleGeometry, Color, DynamicDrawUsage, Group, InstancedMesh,
  Mesh, MeshBasicMaterial, Object3D, RingGeometry, SphereGeometry,
} from 'three';
import { useLoop } from '@tresjs/core';
import { useEquipmentEffectsStore } from '~/stores/useEquipmentEffectsStore';

const store = useEquipmentEffectsStore();
const root = new Group(), dummy = new Object3D();
const orbGeometry = new SphereGeometry(.34, 10, 7);
const orbMaterial = new MeshBasicMaterial({ color: new Color('#bd75ff'), transparent: true, opacity: .86, blending: AdditiveBlending, depthWrite: false });
const orbs = new InstancedMesh(orbGeometry, orbMaterial, 4);
orbs.instanceMatrix.setUsage(DynamicDrawUsage); orbs.frustumCulled = false; root.add(orbs);
const trailGeometry = new CircleGeometry(1, 14); trailGeometry.rotateX(-Math.PI / 2);
const trailMaterial = new MeshBasicMaterial({ color: '#ff8a35', transparent: true, opacity: .28, blending: AdditiveBlending, depthWrite: false });
const trails = new InstancedMesh(trailGeometry, trailMaterial, 64);
trails.instanceMatrix.setUsage(DynamicDrawUsage); trails.frustumCulled = false; root.add(trails);
const flareGeometry = new RingGeometry(.75, 1, 48); flareGeometry.rotateX(-Math.PI / 2);
const flareMaterial = new MeshBasicMaterial({ color: '#ffd25a', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: 2 });
const flareMesh = new Mesh(flareGeometry, flareMaterial); flareMesh.visible = false; root.add(flareMesh);

useLoop().onBeforeRender(() => {
  orbs.count = store.orbPositions.length;
  store.orbPositions.forEach((orb, index) => {
    dummy.position.set(orb.x, .8, orb.z); dummy.scale.setScalar(1); dummy.updateMatrix(); orbs.setMatrixAt(index, dummy.matrix);
  });
  orbs.instanceMatrix.needsUpdate = true;
  trails.count = store.trail.length;
  store.trail.forEach((point, index) => {
    const fade = Math.max(.2, point.ttl / point.maxTtl);
    dummy.position.set(point.x, .16, point.z); dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(point.width * fade); dummy.updateMatrix(); trails.setMatrixAt(index, dummy.matrix);
  });
  trails.instanceMatrix.needsUpdate = true;
  const flare = store.flare;
  flareMesh.visible = !!flare;
  if (flare) {
    const progress = 1 - flare.ttl / flare.maxTtl;
    flareMesh.position.set(flare.x, .28, flare.z);
    flareMesh.scale.setScalar(1 + progress * 8);
    flareMaterial.opacity = (1 - progress) * .82;
  }
});
onUnmounted(() => {
  orbs.dispose(); trails.dispose(); orbGeometry.dispose(); trailGeometry.dispose();
  orbMaterial.dispose(); trailMaterial.dispose(); flareGeometry.dispose(); flareMaterial.dispose();
});
</script>

<template><primitive :object="root" /></template>
