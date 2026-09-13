<script setup lang="ts">
import { TALENT_STATS, type TalentStat } from '~/data/talents';
import { formatTalentAmount, type TalentBonuses } from '~/utils/talents';

// "Detalhes": soma dos bônus de todos os talentos obtidos.
const props = defineProps<{ open: boolean; bonuses: TalentBonuses }>();
const emit = defineEmits<{ close: [] }>();

const rows = computed(() =>
  (Object.keys(TALENT_STATS) as TalentStat[])
    .filter(stat => props.bonuses[stat] > 0)
    .map(stat => ({ stat, label: TALENT_STATS[stat].label, amount: formatTalentAmount(stat, props.bonuses[stat]) })),
);

function onKey(event: KeyboardEvent) {
  if (!props.open || event.key !== 'Escape') return;
  event.stopImmediatePropagation();
  emit('close');
}

onMounted(() => window.addEventListener('keydown', onKey, true));
onUnmounted(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <Teleport to="body">
    <Transition name="tstats">
      <div v-if="open" class="tstats" role="dialog" aria-modal="true" aria-label="Detalhes dos talentos" @click="emit('close')">
        <div class="tstats__panel">
          <h2 class="tstats__title">Detalhes</h2>
          <div class="tstats__divider" aria-hidden="true"><span></span><i></i><span></span></div>

          <dl v-if="rows.length" class="tstats__list">
            <div v-for="row in rows" :key="row.stat" class="tstats__row">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.amount }}</dd>
            </div>
          </dl>
          <p v-else class="tstats__empty">Você ainda não tem talentos.</p>
        </div>

        <p class="tstats__hint">Toque em qualquer área para fechar</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tstats{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px 72px;background:rgba(6,8,22,.86);cursor:pointer}
.tstats__panel{width:min(440px,100%)}
.tstats__title{margin:0;text-align:center;font:34px 'Lilita One',sans-serif;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.6)}
.tstats__divider{display:flex;align-items:center;gap:8px;margin:10px 8px 14px}
.tstats__divider span{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.6)}
.tstats__divider i{width:14px;height:14px;rotate:45deg;border:3px solid rgba(255,255,255,.8)}
.tstats__list{margin:0;display:flex;flex-direction:column;gap:6px}
.tstats__row{display:flex;justify-content:space-between;gap:16px;padding:0 12px}
.tstats__row dt,.tstats__row dd{margin:0;font:clamp(17px,4.6vw,22px)/1.2 'Lilita One',sans-serif;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.6)}
.tstats__row dd{flex-shrink:0;min-width:72px;text-align:left}
.tstats__empty{text-align:center;font:18px 'Lilita One',sans-serif;color:rgba(255,255,255,.7)}
.tstats__hint{position:absolute;bottom:max(24px,env(safe-area-inset-bottom));left:0;right:0;margin:0;text-align:center;font:16px 'Lilita One',sans-serif;color:rgba(255,255,255,.7)}
.tstats-enter-active,.tstats-leave-active{transition:opacity .2s ease}
.tstats-enter-from,.tstats-leave-to{opacity:0}
</style>
