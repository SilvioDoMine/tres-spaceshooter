<script setup lang="ts">
import { useAudio } from '~/composables/useAudio';
import { formatStat } from '~/utils/equipment';

// Resumo ATQ | HP abaixo da nave. Quando o valor muda, o número corre até o novo valor
// com reforço visual/sonoro: verde subindo quando melhora, vermelho tremendo quando piora.
const props = defineProps<{ damage: number; health: number }>();
defineEmits<{ info: [] }>();

const audio = useAudio();

type Trend = 'up' | 'down' | null;

function useAnimatedStat(source: () => number) {
  const shown = ref(source());
  const trend = ref<Trend>(null);
  const delta = ref(0);
  const pulse = ref(0);
  let frame = 0;
  let clearTrend: ReturnType<typeof setTimeout> | undefined;

  watch(source, (next, prev) => {
    if (next === prev) return;
    cancelAnimationFrame(frame);
    clearTimeout(clearTrend);

    const from = shown.value;
    const start = performance.now();
    const duration = 650;
    trend.value = next > prev ? 'up' : 'down';
    delta.value = next - prev;
    pulse.value++;

    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      shown.value = from + (next - from) * eased;
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    clearTrend = setTimeout(() => (trend.value = null), 1400);
  });

  onUnmounted(() => {
    cancelAnimationFrame(frame);
    clearTimeout(clearTrend);
  });

  return { shown, trend, delta, pulse };
}

const atk = useAnimatedStat(() => props.damage);
const hp = useAnimatedStat(() => props.health);

// Um único som por mudança (equipar mexe nos dois ao mesmo tempo às vezes)
watch(
  () => [props.damage, props.health] as const,
  ([damage, health], [prevDamage, prevHealth]) => {
    const gain = damage - prevDamage + (health - prevHealth) / 5;
    if (gain === 0) return;
    audio.playUiSound(gain > 0 ? 'statUp' : 'statDown');
    audio.vibrate(gain > 0 ? [10, 30, 10] : [40]);
  },
);

const signed = (value: number) => `${value > 0 ? '+' : '−'}${formatStat(Math.abs(value))}`;
</script>

<template>
  <div class="statbar">
    <div v-for="stat in [{ key: 'atk', label: 'ATQ', data: atk }, { key: 'hp', label: 'HP', data: hp }]" :key="stat.key" class="statbar__pill" :class="[`statbar__pill--${stat.key}`, stat.data.trend.value && `is-${stat.data.trend.value}`]">
      <span class="statbar__icon" aria-hidden="true">
        <svg v-if="stat.key === 'atk'" viewBox="0 0 24 24"><path d="M20 2h2v2L10 16l-2-2z" fill="#e6ecf5" stroke="#2a3148" stroke-width="1.5" /><path d="m5 13 6 6-2 2-2-2-3 3-2-2 3-3-2-2z" fill="#f0b23a" stroke="#2a3148" stroke-width="1.5" /></svg>
        <svg v-else viewBox="0 0 24 24"><path d="M12 21 3.5 12.5A5 5 0 0 1 12 5.5a5 5 0 0 1 8.5 7z" fill="#ff4a5e" stroke="#2a3148" stroke-width="1.5" /><path d="M7.5 9a2 2 0 0 1 2-1.5" stroke="#ffd0d6" stroke-width="1.8" fill="none" stroke-linecap="round" /></svg>
        <small>{{ stat.label }}</small>
      </span>
      <strong :key="stat.data.pulse.value" class="statbar__value">
        {{ formatStat(stat.data.shown.value) }}
        <i v-if="stat.data.trend.value" aria-hidden="true">{{ stat.data.trend.value === 'up' ? '▲' : '▼' }}</i>
      </strong>
      <span v-if="stat.data.trend.value" :key="`d-${stat.data.pulse.value}`" class="statbar__delta">
        {{ signed(stat.data.delta.value) }}
      </span>
    </div>

    <button type="button" class="statbar__info" aria-label="Todos os atributos" @click="$emit('info')">i</button>
  </div>
</template>

<style scoped>
.statbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 14px;
  background: linear-gradient(#b0643a, #8a4524);
  border: 3px solid #5a2a14;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35), inset 0 2px 0 rgba(255, 255, 255, 0.25);
}
.statbar__pill {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 108px;
  padding: 2px 10px 2px 2px;
  border-radius: 999px;
  background: rgba(30, 14, 8, 0.55);
}
.statbar__icon {
  position: relative;
  width: 34px;
  height: 34px;
  margin: -8px 0 -4px -6px;
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.35));
}
.statbar__icon svg {
  width: 100%;
  height: 100%;
}
.statbar__icon small {
  position: absolute;
  left: 50%;
  bottom: -4px;
  translate: -50% 0;
  font: 11px/1 'Lilita One', sans-serif;
  color: #fff;
  -webkit-text-stroke: 3px #2a3148;
  paint-order: stroke fill;
}
.statbar__value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font: 17px/1 'Lilita One', sans-serif;
  font-variant-numeric: tabular-nums;
  color: #fff;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.5);
}
.statbar__value i {
  font-style: normal;
  font-size: 11px;
}
.is-up .statbar__value {
  color: #7dff8a;
  animation: stat-pop 0.45s ease;
}
.is-down .statbar__value {
  color: #ff6b6b;
  animation: stat-shake 0.45s ease;
}
.is-up {
  box-shadow: 0 0 0 2px #46e05a, 0 0 14px rgba(70, 224, 90, 0.7);
}
.is-down {
  box-shadow: 0 0 0 2px #ff4a4a, 0 0 14px rgba(255, 74, 74, 0.6);
}
.statbar__pill {
  transition: box-shadow 0.4s ease;
}
.statbar__delta {
  position: absolute;
  right: 6px;
  bottom: 100%;
  font: 18px/1 'Lilita One', sans-serif;
  pointer-events: none;
  -webkit-text-stroke: 4px #1b1030;
  paint-order: stroke fill;
  animation: stat-float 1.3s ease-out forwards;
}
.is-up .statbar__delta {
  color: #7dff8a;
}
.is-down .statbar__delta {
  color: #ff6b6b;
  animation-name: stat-sink;
}
.statbar__info {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 3px solid #fff;
  background: #1a1a22;
  font: 18px/1 'Lilita One', serif;
  color: #fff;
  cursor: pointer;
}
@keyframes stat-pop {
  40% {
    scale: 1.3;
  }
}
@keyframes stat-shake {
  20%,
  60% {
    translate: -3px 0;
  }
  40%,
  80% {
    translate: 3px 0;
  }
}
@keyframes stat-float {
  from {
    opacity: 0;
    translate: 0 8px;
  }
  15% {
    opacity: 1;
  }
  to {
    opacity: 0;
    translate: 0 -26px;
  }
}
@keyframes stat-sink {
  from {
    opacity: 0;
    translate: 0 -10px;
  }
  15% {
    opacity: 1;
  }
  to {
    opacity: 0;
    translate: 0 14px;
  }
}
</style>
