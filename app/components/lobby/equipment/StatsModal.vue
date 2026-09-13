<script setup lang="ts">
import { formatStat, type PlayerStats } from '~/utils/equipment';

// Modal do (i): todos os atributos do jogador somando base, talentos e equipamentos.
const props = defineProps<{ open: boolean; stats: PlayerStats }>();
const emit = defineEmits<{ close: [] }>();

const percent = (value: number) => `+${Number(value.toFixed(1))}%`;

const sections = computed(() => {
  const s = props.stats;
  const b = s.bonuses;
  return [
    {
      title: 'Ataque',
      rows: [
        { label: 'ATQ Total', value: formatStat(s.damage), highlight: true },
        { label: 'ATQ base', value: formatStat(s.baseDamage) },
        { label: 'ATQ dos equipamentos', value: `+${formatStat(s.gearDamage)}` },
        { label: 'ATQ dos talentos', value: `+${formatStat(s.talentDamage)}` },
        { label: 'Bônus de ATQ', value: percent(b.damagePercent) },
        { label: 'Taxa Crít.', value: percent(b.critRatePercent) },
        { label: 'Dano Crít.', value: percent(b.critDamagePercent) },
        { label: 'VEL ATQ', value: percent(b.attackSpeedPercent) },
      ],
    },
    {
      title: 'Defesa',
      rows: [
        { label: 'HP Total', value: formatStat(s.maxHealth), highlight: true },
        { label: 'HP base', value: formatStat(s.baseHealth) },
        { label: 'HP dos equipamentos', value: `+${formatStat(s.gearHealth)}` },
        { label: 'HP dos talentos', value: `+${formatStat(s.talentHealth)}` },
        { label: 'Bônus de HP Máx.', value: percent(b.maxHealthPercent) },
        { label: 'Desvio', value: percent(b.dodgePercent) },
        { label: 'Redução de dano de colisão', value: percent(b.collisionReductionPercent) },
        { label: 'Cura dos corações', value: percent(b.heartHealPercent) },
      ],
    },
    {
      title: 'Outros',
      rows: [
        { label: 'VEL MOV', value: percent(b.moveSpeedPercent) },
        { label: 'Atributos base dos equipamentos', value: percent(b.gearBaseStatsPercent) },
      ],
    },
  ];
});

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
    <Transition name="gstats">
      <div v-if="open" class="gstats" role="dialog" aria-modal="true" aria-label="Atributos" @click="emit('close')">
        <div class="gstats__panel allow-scroll">
          <h2 class="gstats__title">Atributos</h2>
          <section v-for="section in sections" :key="section.title" class="gstats__section">
            <h3>{{ section.title }}</h3>
            <dl>
              <div v-for="row in section.rows" :key="row.label" class="gstats__row" :class="{ 'is-highlight': row.highlight }">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
          </section>
        </div>
        <p class="gstats__hint">Toque em qualquer área para fechar</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.gstats {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px 72px;
  background: rgba(6, 8, 22, 0.86);
  cursor: pointer;
}
.gstats__panel {
  width: min(440px, 100%);
  max-height: 100%;
  overflow: auto;
}
.gstats__title {
  margin: 0 0 8px;
  text-align: center;
  font: 34px 'Lilita One', sans-serif;
  color: #fff;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.6);
}
.gstats__section h3 {
  margin: 14px 0 6px;
  font: 18px 'Lilita One', sans-serif;
  color: #ffd27a;
}
.gstats__section dl {
  margin: 0;
}
.gstats__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 12px;
  font: 15px 'Fredoka One', sans-serif;
  color: #d9e2f5;
}
.gstats__row:nth-child(odd) {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}
.gstats__row dd {
  margin: 0;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
.gstats__row.is-highlight {
  font-size: 18px;
  color: #fff;
}
.gstats__row.is-highlight dd {
  color: #7dff8a;
}
.gstats__hint {
  margin: 0;
  font: 13px 'Fredoka One', sans-serif;
  color: rgba(255, 255, 255, 0.55);
}
.gstats-enter-active,
.gstats-leave-active {
  transition: opacity 0.2s ease;
}
.gstats-enter-active .gstats__panel {
  transition: scale 0.25s cubic-bezier(0.3, 1.5, 0.6, 1);
}
.gstats-enter-from,
.gstats-leave-to {
  opacity: 0;
}
.gstats-enter-from .gstats__panel {
  scale: 0.9;
}
</style>
