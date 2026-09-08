<script setup lang="ts">
const state=useSpatialDilation().state
const run=useCurrentRunStore()
const audio=useAudio()
let soundTimer:ReturnType<typeof setInterval>
const unlock=()=>audio.init()
onMounted(()=>{
 window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock)
 soundTimer=setInterval(()=>audio.updateSpatialAudio(state.value.visual,state.value.phase,state.value.notice,run.isPlaying && !document.hidden),100)
})
onUnmounted(()=>{clearInterval(soundTimer);audio.stopSpatialAudio();window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock)})
const reduced=useState('spatial-reduced-motion',()=>false)
const critical=computed(()=>['CRITICAL','STRUCTURAL_DAMAGE'].includes(state.value.phase))
let media:MediaQueryList
const preference=()=>{reduced.value=media.matches}
onMounted(()=>{media=window.matchMedia('(prefers-reduced-motion: reduce)');preference();media.addEventListener('change',preference)})
onUnmounted(()=>media?.removeEventListener('change',preference))
</script>
<template>
 <aside v-if="run.isPlaying && (state.notice || critical)" class="spatial-notice" :class="{critical}" role="status" aria-live="polite">
  <strong>{{ critical ? 'INSTABILIDADE ESPACIAL' : state.notice }}</strong>
  <span v-if="critical">{{ state.phase==='STRUCTURAL_DAMAGE'?'Distorção causando dano estrutural.':'Tensão estrutural crescente.' }} Retorne à zona estável.</span>
  <span v-else-if="state.phase!=='SAFE'">A expansão reduz seu avanço. Retorne à zona estável.</span>
 </aside>
</template>
<style scoped>
.spatial-notice{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(380px,calc(100vw - 32px));padding:9px 14px;border:1px solid #76b6e6;border-radius:12px;background:#112a43e8;color:#bbdef4;text-align:center;pointer-events:none;z-index:13;box-shadow:0 3px 16px #0006}.spatial-notice strong{display:block;font:14px 'Lilita One',sans-serif;letter-spacing:.5px}.spatial-notice span{display:block;font:12px/1.4 sans-serif;margin-top:4px}.spatial-notice.critical{border-color:#e0a674;color:#ffe0c2;background:#3b2533eb}
@media(max-width:650px){.spatial-notice{left:50%;width:calc(100vw - 32px);top:110px;bottom:auto;padding:7px 9px}.spatial-notice strong{font-size:11px}.spatial-notice span{font-size:10px}}
@media(max-height:500px) and (orientation:landscape){.spatial-notice{left:50%;transform:translateX(-50%);width:min(340px,65vw);top:auto;bottom:8px;padding:5px 9px}.spatial-notice strong{font-size:11px}.spatial-notice span{font-size:10px}}
</style>
