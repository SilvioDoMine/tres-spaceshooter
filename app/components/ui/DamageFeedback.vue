<script setup lang="ts">
import { subscribeImpacts } from '~/utils/combatEffects'
const visible=ref(false);let timer:ReturnType<typeof setTimeout>
const unsubscribe=subscribeImpacts(e=>{if(e.kind!=='player')return;visible.value=true;clearTimeout(timer);timer=setTimeout(()=>visible.value=false,380)})
onUnmounted(()=>{unsubscribe();clearTimeout(timer)})
</script>
<template><div class="damage-feedback" :class="{active:visible}" aria-hidden="true" /></template>
<style scoped>
.damage-feedback{position:fixed;inset:0;z-index:9;pointer-events:none;opacity:0;box-shadow:inset 0 0 55px 15px #ff432677;background:radial-gradient(ellipse at center,transparent 55%,#c52d2638);transition:opacity .25s ease-out}.damage-feedback.active{opacity:1;transition-duration:.07s}@media(prefers-reduced-motion:reduce){.damage-feedback{transition:none;box-shadow:inset 0 0 20px #e94b4588;background:none}}
</style>
