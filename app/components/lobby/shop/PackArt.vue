<script setup lang="ts">
// Ilustração dos pacotes: pilhas de gemas/moedas sobre um recipiente (saco, barril, baú) conforme o tamanho.
const props = defineProps<{ kind: 'gems' | 'gold'; art: string }>();

interface Piece {
  x: number;
  y: number;
  s: number;
  r?: number;
}

/** Posições em % do quadro; s = tamanho relativo */
const LAYOUTS: Record<string, Piece[]> = {
  few: [
    { x: 38, y: 58, s: 0.42, r: -12 },
    { x: 58, y: 60, s: 0.38, r: 14 },
    { x: 48, y: 44, s: 0.46 },
  ],
  pile: [
    { x: 28, y: 64, s: 0.34, r: -18 },
    { x: 70, y: 64, s: 0.34, r: 18 },
    { x: 42, y: 60, s: 0.4 },
    { x: 58, y: 58, s: 0.4, r: 8 },
    { x: 50, y: 42, s: 0.46 },
  ],
  heap: [
    { x: 20, y: 68, s: 0.3, r: -20 },
    { x: 80, y: 68, s: 0.3, r: 20 },
    { x: 34, y: 62, s: 0.36, r: -8 },
    { x: 66, y: 62, s: 0.36, r: 10 },
    { x: 50, y: 64, s: 0.38 },
    { x: 40, y: 46, s: 0.4, r: -6 },
    { x: 60, y: 46, s: 0.4, r: 6 },
    { x: 50, y: 30, s: 0.42 },
  ],
  container: [
    { x: 30, y: 36, s: 0.34, r: -14 },
    { x: 50, y: 30, s: 0.4 },
    { x: 70, y: 36, s: 0.34, r: 14 },
    { x: 40, y: 22, s: 0.32, r: -6 },
    { x: 60, y: 22, s: 0.32, r: 8 },
    { x: 18, y: 78, s: 0.26, r: -20 },
    { x: 84, y: 80, s: 0.26, r: 18 },
  ],
};

const container = computed(() => {
  const map: Record<string, string | null> = { sack: 'sack', barrel: 'barrel', chest: 'chest', few: null, pile: null, heap: null, handful: null };
  return map[props.art] ?? null;
});

const pieces = computed(() => {
  if (container.value) return LAYOUTS.container!;
  if (props.art === 'handful') return LAYOUTS.pile!;
  return LAYOUTS[props.art] ?? LAYOUTS.few!;
});
</script>

<template>
  <div class="art" aria-hidden="true">
    <!-- Recipiente atrás das peças de cima -->
    <svg v-if="container === 'sack'" class="art__container" viewBox="0 0 100 100">
      <path d="M30 40 Q18 60 22 80 Q30 96 50 96 Q70 96 78 80 Q82 60 70 40 Z" fill="#e0a45a" stroke="#6b3d12" stroke-width="3" />
      <path d="M32 40 Q50 30 68 40 L64 34 Q50 26 36 34 Z" fill="#c07a34" stroke="#6b3d12" stroke-width="3" />
      <path d="M34 42 Q50 50 66 42" stroke="#6b3d12" stroke-width="3" fill="none" />
      <path d="M30 60 Q34 80 44 88" stroke="#f6c98a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7" />
    </svg>
    <svg v-else-if="container === 'barrel'" class="art__container" viewBox="0 0 100 100">
      <path d="M24 40 Q20 68 26 94 H74 Q80 68 76 40 Z" fill="#a8683a" stroke="#4a2810" stroke-width="3" />
      <path d="M22 50 H78 M24 82 H76" stroke="#7b8594" stroke-width="6" />
      <path d="M36 42 V92 M50 42 V94 M64 42 V92" stroke="#7a4722" stroke-width="2" opacity=".7" />
      <ellipse cx="50" cy="40" rx="27" ry="7" fill="#6b3a18" stroke="#4a2810" stroke-width="3" />
    </svg>
    <svg v-else-if="container === 'chest'" class="art__container" viewBox="0 0 100 100">
      <path d="M14 48 H86 V92 H14 Z" fill="#8a5a36" stroke="#3f2410" stroke-width="3" />
      <path d="M14 48 H86 V58 H14 Z" fill="#6f4526" />
      <path d="M26 48 V92 M74 48 V92" stroke="#7b8594" stroke-width="7" />
      <path d="M10 42 H90 V50 H10 Z" fill="#9aa4b3" stroke="#3f2410" stroke-width="3" />
      <rect x="44" y="60" width="12" height="14" rx="2" fill="#c9d1dd" stroke="#3f2410" stroke-width="2" />
    </svg>

    <span
      v-for="(piece, index) in pieces"
      :key="index"
      class="art__piece"
      :style="{ left: `${piece.x}%`, top: `${piece.y}%`, width: `${piece.s * 100}%`, rotate: `${piece.r ?? 0}deg` }"
    >
      <SvgGemIcon v-if="kind === 'gems'" :size="100" :sparkle="index === pieces.length - 1" />
      <SvgCoinIcon v-else :size="100" />
    </span>
  </div>
</template>

<style scoped>
.art {
  position: relative;
  width: 100%;
  aspect-ratio: 1.3;
}
.art__container {
  position: absolute;
  inset: 8% 10% 0;
  width: 80%;
  height: 92%;
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.25));
}
.art__piece {
  position: absolute;
  display: block;
  aspect-ratio: 1;
  translate: -50% -50%;
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.3));
}
.art__piece :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
