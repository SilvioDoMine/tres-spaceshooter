<script setup lang="ts">
// Rodapé da tela de talentos: botão de sortear (ativo / sem ouro) ou aviso de nível.
const props = defineProps<{
  cost: number;
  gold: number;
  level: number;
  requiredLevel: number;
  /** Todos os talentos já estão com estrelas no máximo */
  completed: boolean;
}>();
defineEmits<{ draw: [] }>();

const isLevelLocked = computed(() => props.level < props.requiredLevel);
const canAfford = computed(() => props.gold >= props.cost);
const formattedCost = computed(() => props.cost.toLocaleString('pt-BR'));
</script>

<template>
  <div class="tdraw">
    <p v-if="completed" class="tdraw__notice">Todos os talentos no máximo!</p>

    <p v-else-if="isLevelLocked" class="tdraw__notice">
      <span class="tdraw__level">{{ requiredLevel }}</span>
      Sorteie após Nv.{{ requiredLevel }}
    </p>

    <template v-else>
      <button
        type="button"
        class="tdraw__button"
        :class="{ 'is-disabled': !canAfford }"
        :disabled="!canAfford"
        :aria-label="`Sortear talento por ${formattedCost} de ouro`"
        @click="$emit('draw')"
      >
        <span class="tdraw__gloss"></span>
        <span class="tdraw__label">SORTEAR</span>
        <span class="tdraw__cost" :class="{ 'is-short': !canAfford }">
          <SvgCoinIcon :size="22" />
          {{ formattedCost }}
        </span>
      </button>
      <p v-if="!canAfford" class="tdraw__missing">Ouro insuficiente</p>
    </template>
  </div>
</template>

<style scoped>
/* Fade escuro por cima da grade: as cartas continuam aparecendo por trás */
.tdraw{display:flex;flex-direction:column;align-items:center;gap:4px;padding:48px 16px 12px;background:linear-gradient(rgba(14,10,40,0),rgba(14,10,40,.45) 45%,rgba(14,10,40,.7));pointer-events:none}
.tdraw__button{pointer-events:auto}
.tdraw__button{
  position:relative;overflow:hidden;width:min(320px,100%);height:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  border-radius:18px;border:4px solid #c97813;background:linear-gradient(#ffe59a,#ffd058 50%,#ffb321);
  box-shadow:0 7px 0 #9b5c0f,0 12px 22px rgba(0,0,0,.3);cursor:pointer;transition:translate .12s ease,box-shadow .12s ease;
}
.tdraw__button:active:not(:disabled){translate:0 5px;box-shadow:0 2px 0 #9b5c0f,0 5px 12px rgba(0,0,0,.3)}
.tdraw__button.is-disabled{cursor:not-allowed;border-color:#6d7380;background:linear-gradient(#c9ced6,#a7adb8 50%,#8e95a1);box-shadow:0 7px 0 #555b66,0 12px 22px rgba(0,0,0,.3)}
.tdraw__gloss{position:absolute;inset:4px 10px auto;height:40%;border-radius:12px;background:linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,0));pointer-events:none}
.tdraw__label{position:relative;font:26px/1 'Lilita One',sans-serif;letter-spacing:1px;color:#6b3a08;text-shadow:0 2px 0 rgba(255,255,255,.35)}
.is-disabled .tdraw__label{color:#4a4f59}
.tdraw__cost{position:relative;display:flex;align-items:center;gap:4px;font:18px/1 'Lilita One',sans-serif;color:#6b3a08}
.tdraw__cost.is-short{color:#d62839}
.tdraw__missing{margin:6px 0 0;font:14px 'Lilita One',sans-serif;color:#ff8a95;text-shadow:0 2px 0 rgba(0,0,0,.5)}
.tdraw__notice{display:flex;align-items:center;gap:10px;min-height:72px;margin:0;font:clamp(22px,6vw,30px) 'Lilita One',sans-serif;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.55)}
.tdraw__level{display:grid;place-items:center;width:46px;height:46px;flex-shrink:0;clip-path:polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);background:linear-gradient(#7cc8ff,#2f7cd1);font-size:20px}
@media(max-height:500px) and (orientation:landscape){.tdraw{padding:28px 16px 6px}.tdraw__button{height:52px;border-radius:14px}.tdraw__label{font-size:20px}.tdraw__cost{font-size:14px}.tdraw__notice{min-height:52px;font-size:20px}}
</style>
