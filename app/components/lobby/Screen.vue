<script setup lang="ts">
// Tela cheia do lobby que troca com o modo de capítulos (Equipamento, Talentos...).
// Fica entre a topbar (que continua por cima) e a barra de abas do rodapé.
withDefaults(defineProps<{ title: string; theme?: 'blue' | 'purple' }>(), { theme: 'blue' });
</script>

<template>
  <section class="lobby-screen pointer-events-auto" :class="`lobby-screen--${theme}`" :aria-label="title">
    <header class="lobby-screen__header">
      <div class="lobby-screen__header-start"><slot name="header-start" /></div>
      <h2 class="lobby-screen__title">{{ title }}</h2>
    </header>

    <div class="lobby-screen__body allow-scroll">
      <slot>
        <div class="lobby-screen__empty">
          <span>✦</span>
          <p>Em breve</p>
        </div>
      </slot>
    </div>

    <!-- Fixo embaixo, fora da rolagem -->
    <slot name="footer" />
  </section>
</template>

<style scoped>
.lobby-screen{position:absolute;top:0;left:0;right:0;bottom:72px;z-index:10;display:flex;flex-direction:column;padding-top:72px;color:white}
.lobby-screen--blue{background:linear-gradient(#4aa3ec 0%,#2d6fbf 30%,#1d3566 60%,#161f3f 100%)}
.lobby-screen--purple{background:linear-gradient(#6a4cc4 0%,#4b3a95 45%,#322b66 100%)}
.lobby-screen__header{position:relative;display:flex;justify-content:center;padding:8px 16px 0}
.lobby-screen__header-start{position:absolute;left:12px;top:50%;translate:0 -30%}
.lobby-screen__title{margin:0;padding:6px 36px;border-radius:999px;border:3px solid rgba(255,255,255,.35);background:rgba(255,255,255,.16);box-shadow:0 4px 0 rgba(0,0,0,.2);font:26px 'Lilita One',sans-serif;text-shadow:0 3px 0 rgba(0,0,0,.35)}
.lobby-screen__body{flex:1;min-height:0;overflow:auto;padding:16px}
.lobby-screen__empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:rgba(255,255,255,.6);font-family:'Lilita One',sans-serif}
.lobby-screen__empty span{font-size:40px;color:#ffe09a}
.lobby-screen__empty p{margin:0;font-size:20px}
@media(max-width:650px){.lobby-screen__title{font-size:22px;padding:4px 28px}}
@media(max-height:500px) and (orientation:landscape){.lobby-screen{bottom:56px;padding-top:68px}.lobby-screen__header{padding-top:2px}.lobby-screen__title{font-size:18px;padding:2px 24px}.lobby-screen__body{padding:8px}}
</style>
