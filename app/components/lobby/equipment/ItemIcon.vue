<script setup lang="ts">
// Arte vetorial dos equipamentos (um desenho por item) e mini-ícone de slot para o selo do card.
// Sem gradientes com id: o mesmo SVG aparece várias vezes na tela.
import type { EquipmentSlot } from '~/data/equipment';

defineProps<{ defId?: string; slot?: EquipmentSlot }>();
</script>

<template>
  <svg viewBox="0 0 64 64" class="gear-icon" aria-hidden="true">
    <!-- Slots (selo pequeno / silhueta de slot vazio) -->
    <g v-if="!defId && slot === 'weapon'" fill="currentColor">
      <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" stroke-width="6" />
      <rect x="29" y="6" width="6" height="16" rx="2" /><rect x="29" y="42" width="6" height="16" rx="2" />
      <rect x="6" y="29" width="16" height="6" rx="2" /><rect x="42" y="29" width="16" height="6" rx="2" />
    </g>
    <path v-else-if="!defId && slot === 'wings'" fill="currentColor" d="M32 40 4 20l6 22 22 10 22-10 6-22z" />
    <path v-else-if="!defId && slot === 'cockpit'" fill="currentColor" d="M8 44a24 24 0 0 1 48 0v6H8z" />
    <path v-else-if="!defId && slot === 'generator'" fill="currentColor" d="M36 4 12 36h16l-4 24 26-34H34z" />
    <path v-else-if="!defId && slot === 'forcefield'" fill="currentColor" d="M32 4 56 12v18c0 16-10 26-24 30C18 56 8 46 8 30V12z" />
    <path v-else-if="!defId && slot === 'thrusters'" fill="currentColor" d="M32 4c10 12 16 22 16 34a16 16 0 0 1-32 0C16 26 22 16 32 4z" />

    <!-- Armas -->
    <g v-else-if="defId === 'canhao-plasma'">
      <rect x="8" y="30" width="30" height="20" rx="5" fill="#3b4a66" stroke="#1b2334" stroke-width="3" />
      <rect x="30" y="24" width="24" height="12" rx="4" fill="#8fa3c2" stroke="#1b2334" stroke-width="3" />
      <rect x="14" y="36" width="14" height="5" rx="2" fill="#5c6f91" />
      <circle cx="56" cy="30" r="7" fill="#35e0ff" stroke="#e8fdff" stroke-width="2" />
      <circle cx="56" cy="30" r="12" fill="#35e0ff" opacity=".25" />
      <rect x="12" y="48" width="8" height="10" rx="2" fill="#2a3448" stroke="#1b2334" stroke-width="2" />
    </g>
    <g v-else-if="defId === 'lanca-ionica'">
      <path d="m10 54 30-30" stroke="#1b2334" stroke-width="10" stroke-linecap="round" />
      <path d="m10 54 30-30" stroke="#c9a15a" stroke-width="5" stroke-linecap="round" />
      <path d="m36 18 10-10 10 0 0 10-10 10z" fill="#b76bff" stroke="#1b2334" stroke-width="3" stroke-linejoin="round" />
      <path d="m44 14 6 0 0 6" fill="none" stroke="#f1dcff" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="30" cy="34" r="6" fill="#6d7fa3" stroke="#1b2334" stroke-width="3" />
      <circle cx="50" cy="14" r="14" fill="#b76bff" opacity=".2" />
    </g>

    <!-- Asas -->
    <g v-else-if="defId === 'asas-falcao'" stroke="#1b2334" stroke-width="3" stroke-linejoin="round">
      <path d="M30 34 4 16l4 22 22 10z" fill="#f08a2c" />
      <path d="M34 34 60 16l-4 22-22 10z" fill="#f08a2c" />
      <path d="M30 34 10 26l2 10 18 8z" fill="#ffd9a8" stroke-width="0" />
      <path d="M34 34 54 26l-2 10-18 8z" fill="#ffd9a8" stroke-width="0" />
      <rect x="27" y="26" width="10" height="26" rx="5" fill="#eef3fb" />
    </g>
    <g v-else-if="defId === 'asas-nebula'" stroke="#1b2334" stroke-width="3" stroke-linejoin="round">
      <path d="M29 30C18 10 6 12 4 20c6 10 8 22 25 26z" fill="#6f4dd8" />
      <path d="M35 30C46 10 58 12 60 20c-6 10-8 22-25 26z" fill="#6f4dd8" />
      <circle cx="14" cy="24" r="2.5" fill="#bfe8ff" stroke-width="0" />
      <circle cx="21" cy="34" r="2" fill="#f5c6ff" stroke-width="0" />
      <circle cx="50" cy="24" r="2.5" fill="#bfe8ff" stroke-width="0" />
      <circle cx="43" cy="34" r="2" fill="#f5c6ff" stroke-width="0" />
      <rect x="27" y="24" width="10" height="28" rx="5" fill="#b8a4f2" />
    </g>

    <!-- Cockpit -->
    <g v-else-if="defId === 'cockpit-mira'">
      <path d="M8 46a24 24 0 0 1 48 0z" fill="#58c7ff" stroke="#1b2334" stroke-width="3" stroke-linejoin="round" />
      <path d="M16 36a16 16 0 0 1 14-12" fill="none" stroke="#e6f8ff" stroke-width="3" stroke-linecap="round" />
      <rect x="4" y="44" width="56" height="10" rx="4" fill="#4a5875" stroke="#1b2334" stroke-width="3" />
      <circle cx="38" cy="36" r="7" fill="none" stroke="#ff4b5c" stroke-width="3" />
      <path d="M38 25v6m0 10v6m-11-11h6m10 0h6" stroke="#ff4b5c" stroke-width="3" stroke-linecap="round" />
    </g>
    <g v-else-if="defId === 'cockpit-quantico'">
      <path d="M8 46a24 24 0 0 1 48 0z" fill="#4c3aa8" stroke="#1b2334" stroke-width="3" stroke-linejoin="round" />
      <rect x="4" y="44" width="56" height="10" rx="4" fill="#4a5875" stroke="#1b2334" stroke-width="3" />
      <ellipse cx="32" cy="34" rx="15" ry="5" fill="none" stroke="#7ff6ff" stroke-width="2.5" />
      <ellipse cx="32" cy="34" rx="15" ry="5" fill="none" stroke="#7ff6ff" stroke-width="2.5" transform="rotate(60 32 34)" />
      <ellipse cx="32" cy="34" rx="15" ry="5" fill="none" stroke="#7ff6ff" stroke-width="2.5" transform="rotate(-60 32 34)" />
      <circle cx="32" cy="34" r="3.5" fill="#fff" />
    </g>

    <!-- Geradores -->
    <g v-else-if="defId === 'gerador-fusao'" stroke="#1b2334" stroke-width="3">
      <rect x="14" y="8" width="36" height="10" rx="3" fill="#7d8aa5" />
      <rect x="14" y="46" width="36" height="10" rx="3" fill="#7d8aa5" />
      <rect x="18" y="16" width="28" height="32" rx="4" fill="#2b3550" />
      <rect x="23" y="20" width="18" height="24" rx="6" fill="#4cff9a" stroke-width="2" />
      <path d="M34 22 26 34h6l-2 8 8-12h-6z" fill="#eafff3" stroke-width="0" />
    </g>
    <g v-else-if="defId === 'gerador-solar'" stroke="#1b2334" stroke-width="3">
      <path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6" stroke="#ffc02e" stroke-width="4" stroke-linecap="round" />
      <circle cx="32" cy="32" r="18" fill="#5b4a3a" />
      <circle cx="32" cy="32" r="12" fill="#ffb21e" stroke-width="2" />
      <circle cx="28" cy="28" r="4" fill="#fff4c2" stroke-width="0" />
    </g>

    <!-- Campos de força -->
    <g v-else-if="defId === 'campo-egide'" stroke="#1b2334" stroke-width="3" stroke-linejoin="round">
      <path d="M32 4 56 12v18c0 16-10 26-24 30C18 56 8 46 8 30V12z" fill="#3a8fe0" />
      <path d="M32 12 48 18v12c0 11-7 18-16 21-9-3-16-10-16-21V18z" fill="#8fd0ff" stroke-width="0" />
      <path d="m32 20 8 5v9l-8 5-8-5v-9z" fill="#eaf6ff" />
    </g>
    <g v-else-if="defId === 'campo-prisma'" stroke="#1b2334" stroke-width="3" stroke-linejoin="round">
      <path d="M32 4 58 26 32 60 6 26z" fill="#e0c2ff" />
      <path d="M32 4 44 26 32 60 20 26z" fill="#b184ff" />
      <path d="M6 26h52" />
      <path d="m18 16 6-4" stroke="#fff" stroke-linecap="round" />
    </g>

    <!-- Propulsores -->
    <g v-else-if="defId === 'propulsor-cometa'" stroke="#1b2334" stroke-width="3" stroke-linejoin="round">
      <path d="M22 42c0 10 4 16 10 20 6-4 10-10 10-20z" fill="#ff7a1f" />
      <path d="M27 42c0 7 2 11 5 14 3-3 5-7 5-14z" fill="#ffe38a" stroke-width="0" />
      <path d="M18 6h28l-4 36H22z" fill="#8994ab" />
      <rect x="14" y="4" width="36" height="8" rx="3" fill="#56617a" />
      <path d="M24 18h16" stroke="#c9d2e3" />
    </g>
    <g v-else-if="defId === 'propulsor-vortice'" stroke="#1b2334" stroke-width="3" stroke-linejoin="round">
      <rect x="6" y="10" width="22" height="34" rx="6" fill="#7c86a0" />
      <rect x="36" y="10" width="22" height="34" rx="6" fill="#7c86a0" />
      <path d="M10 44c2 10 4 12 7 14 3-2 5-4 7-14z" fill="#58e1ff" />
      <path d="M40 44c2 10 4 12 7 14 3-2 5-4 7-14z" fill="#58e1ff" />
      <path d="M17 20a6 6 0 1 1-5 6M47 20a6 6 0 1 1-5 6" fill="none" stroke="#bff5ff" stroke-width="3" stroke-linecap="round" />
    </g>
  </svg>
</template>

<style scoped>
.gear-icon {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
