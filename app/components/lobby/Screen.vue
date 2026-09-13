<script setup lang="ts">
// Tela cheia do lobby que troca com o modo de capítulos (Equipamento, Talentos...).
// Fica entre a topbar (que continua por cima) e a barra de abas do rodapé.
withDefaults(defineProps<{ title: string; theme?: 'blue' | 'purple' }>(), { theme: 'blue' });
</script>

<template>
  <section class="lobby-screen pointer-events-auto" :class="`lobby-screen--${theme}`" :aria-label="title">
    <!-- Faixa opaca: o conteúdo rola por baixo dela -->
    <header class="lobby-screen__header">
      <h2 class="lobby-screen__title">{{ title }}</h2>
      <div class="lobby-screen__divider" aria-hidden="true"><span></span><i></i><span></span></div>
      <!-- Pendurado na borda esquerda, logo abaixo da faixa -->
      <div v-if="$slots['header-start']" class="lobby-screen__header-start"><slot name="header-start" /></div>
    </header>

    <div class="lobby-screen__body allow-scroll" :class="{ 'has-footer': $slots.footer }">
      <slot>
        <div class="lobby-screen__empty">
          <span>✦</span>
          <p>Em breve</p>
        </div>
      </slot>
    </div>

    <!-- Flutua por cima do fim do conteúdo (o conteúdo continua visível por trás) -->
    <div v-if="$slots.footer" class="lobby-screen__footer">
      <slot name="footer" />
    </div>
  </section>
</template>

<style scoped>
.lobby-screen{position:absolute;top:0;left:0;right:0;bottom:72px;z-index:10;display:flex;flex-direction:column;padding-top:72px;color:white}
.lobby-screen--blue{
  --band:linear-gradient(#2f6fc4,#24569e);--pill:linear-gradient(#7cc0ff,#4a90e2);--pill-edge:#1d4a88;
  background:linear-gradient(#4aa3ec 0%,#2d6fbf 30%,#1d3566 60%,#161f3f 100%);
}
.lobby-screen--purple{
  --band:linear-gradient(#5a45b8,#4a389e);--pill:linear-gradient(#9b86f0,#735bd6);--pill-edge:#3b2a86;
  background:linear-gradient(#5f47b8 0%,#4b3a95 45%,#322b66 100%);
}
.lobby-screen__header{
  position:relative;z-index:2;display:flex;justify-content:center;padding:10px 16px 16px;
  background:var(--band);border-bottom:3px solid rgba(255,255,255,.14);box-shadow:0 8px 14px rgba(10,6,40,.28);
}
.lobby-screen__title{
  width:min(520px,100%);margin:0;padding:6px 24px;text-align:center;border-radius:999px;
  border:3px solid var(--pill-edge);background:var(--pill);
  box-shadow:inset 0 3px 0 rgba(255,255,255,.35),inset 0 -3px 0 rgba(0,0,0,.12),0 4px 0 rgba(0,0,0,.2);
  font:26px 'Lilita One',sans-serif;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.35);
}
/* Separador: linha que clareia no centro com um losango */
.lobby-screen__divider{position:absolute;left:10%;right:10%;bottom:-10px;display:flex;align-items:center;pointer-events:none}
.lobby-screen__divider span{flex:1;height:4px;border-radius:2px;background:linear-gradient(to right,rgba(255,255,255,0),rgba(255,255,255,.9))}
.lobby-screen__divider span:last-child{background:linear-gradient(to left,rgba(255,255,255,0),rgba(255,255,255,.9))}
.lobby-screen__divider i{width:16px;height:16px;margin:0 4px;rotate:45deg;border-radius:3px;border:3px solid #fff;background:linear-gradient(135deg,#ffd27a,#f08a1c);box-shadow:0 0 0 2px var(--pill-edge)}
.lobby-screen__header-start{position:absolute;left:0;top:calc(100% + 12px)}
.lobby-screen__body{flex:1;min-height:0;overflow:auto;padding:16px}
/* Espaço para a última fileira rolar até acima do rodapé flutuante */
.lobby-screen__body.has-footer{padding-bottom:128px}
.lobby-screen__footer{position:absolute;left:0;right:0;bottom:0;pointer-events:none}
.lobby-screen__empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:rgba(255,255,255,.6);font-family:'Lilita One',sans-serif}
.lobby-screen__empty span{font-size:40px;color:#ffe09a}
.lobby-screen__empty p{margin:0;font-size:20px}
@media(max-width:650px){.lobby-screen__title{font-size:22px;padding:4px 28px}}
@media(max-height:500px) and (orientation:landscape){.lobby-screen{bottom:56px;padding-top:68px}.lobby-screen__header{padding:4px 16px 10px}.lobby-screen__title{font-size:18px;padding:2px 24px}.lobby-screen__header-start{top:calc(100% + 8px)}.lobby-screen__body{padding:8px}.lobby-screen__body.has-footer{padding-bottom:84px}}
</style>
