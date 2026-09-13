<script setup lang="ts">
import type { TalentIconKey } from '~/data/talents';

defineProps<{ icon: TalentIconKey }>();
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" stroke-linejoin="round">
    <!-- Glória: cálice -->
    <g v-if="icon === 'goblet'" stroke="#3b2410" stroke-width="3">
      <path d="M28 16h44v16c0 15-9 26-22 28-13-2-22-13-22-28z" fill="#ffd23f"/>
      <path d="M34 20h9v12c0 9 3 16 8 20-10-2-17-11-17-24z" fill="#fff" opacity=".4" stroke="none"/>
      <circle cx="50" cy="33" r="7" fill="#e5383b"/>
      <path d="M45 58h10v14H45z" fill="#f0a21e"/>
      <path d="M32 86h36l-5-14H37z" fill="#ffd23f"/>
    </g>

    <!-- Táticas: orbe girando sobre livro aberto -->
    <g v-else-if="icon === 'book'">
      <circle cx="50" cy="38" r="26" fill="#ffc53d" stroke="#8a4b00" stroke-width="3"/>
      <path d="M36 36a14 14 0 0 1 24-8l4-4 1 14-13-1 4-4a8 8 0 0 0-14 5z" fill="#fff4c2"/>
      <path d="M64 40a14 14 0 0 1-24 8l-4 4-1-14 13 1-4 4a8 8 0 0 0 14-5z" fill="#fff4c2"/>
      <path d="M12 62q19-7 38 6 19-13 38-6v22q-19-6-38 6-19-12-38-6z" fill="#8f5ae0" stroke="#3b2060" stroke-width="3"/>
      <path d="M50 68v22" stroke="#3b2060" stroke-width="3"/>
      <path d="M18 66q14-4 27 4v13q-13-6-27-4z" fill="#fff" opacity=".35"/>
    </g>

    <!-- Vento Veloz: capa -->
    <g v-else-if="icon === 'cape'">
      <path d="M26 18h48l10 60-16-8-18 16-18-16-16 8z" fill="#3a1d2e" stroke="#1c0c16" stroke-width="3"/>
      <path d="M40 24 32 76l18 12V24z" fill="#c1272d"/>
      <path d="M60 24l8 52-18 12V24z" fill="#8e1b22"/>
      <path d="M8 40h14M4 52h16M10 64h12" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
      <circle cx="36" cy="24" r="7" fill="#ffd23f" stroke="#7a4300" stroke-width="3"/>
      <circle cx="64" cy="24" r="7" fill="#ffd23f" stroke="#7a4300" stroke-width="3"/>
    </g>

    <!-- Refinamento: brasão -->
    <g v-else-if="icon === 'emblem'">
      <path d="M50 12 82 24v24c0 20-13 34-32 40-19-6-32-20-32-40V24z" fill="#ffd23f" stroke="#6b3d00" stroke-width="3"/>
      <path d="M50 22 72 30v18c0 14-9 24-22 29-13-5-22-15-22-29V30z" fill="#3b2a1a"/>
      <path d="M40 42l10 6 10-6-2 12 6 4-14 10-14-10 6-4z" fill="#ffb938"/>
      <path d="M40 38l-6-8M60 38l6-8" stroke="#ffb938" stroke-width="4" stroke-linecap="round"/>
    </g>

    <!-- Riqueza: maçã dourada -->
    <g v-else-if="icon === 'apple'">
      <path d="M50 30c-10-8-30-6-32 14-2 22 14 40 32 38 18 2 34-16 32-38-2-20-22-22-32-14z" fill="#ffd23f" stroke="#8a4b00" stroke-width="3"/>
      <path d="M30 46c2-8 10-11 15-9-7 2-11 8-11 15z" fill="#fff" opacity=".55"/>
      <path d="M50 30c0-8 2-14 8-18" stroke="#6b3d00" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M56 18c8-8 20-6 24-2-6 8-18 8-24 2z" fill="#5cc23a" stroke="#2c6b16" stroke-width="3"/>
      <path d="M16 20v8M12 24h8M84 70v8M80 74h8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    </g>

    <!-- Taxa crítica: mira -->
    <g v-else-if="icon === 'crosshair'">
      <circle cx="50" cy="50" r="28" fill="#ffd23f" stroke="#e5383b" stroke-width="8"/>
      <path d="M50 6l9 15H41zM50 94l-9-15h18zM6 50l15-9v18zM94 50l-15 9V41z" fill="#e5383b" stroke="#7a1a1d" stroke-width="2"/>
      <path d="M50 34v9M50 57v9M34 50h9M57 50h9" stroke="#e5383b" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="4.5" fill="#e5383b"/>
    </g>

    <!-- Dano crítico: runa -->
    <g v-else-if="icon === 'rune'">
      <circle cx="50" cy="50" r="40" fill="#fff" opacity=".18"/>
      <circle cx="50" cy="50" r="31" fill="#b76bff" stroke="#f3e2ff" stroke-width="4"/>
      <circle cx="50" cy="50" r="22" fill="none" stroke="#f3e2ff" stroke-width="2.5"/>
      <path d="M50 33 65 60H35z" fill="none" stroke="#fff" stroke-width="4"/>
      <path d="M50 33v19l15 8M50 52l-15 8" stroke="#fff" stroke-width="2.5"/>
    </g>

    <!-- Desvio: lua em disparada -->
    <g v-else-if="icon === 'dash'">
      <path d="M62 12C37 15 20 32 20 52s17 35 42 38c-15-7-23-21-23-38s8-31 23-40z" fill="#1d2b2f" stroke="#0b1416" stroke-width="3"/>
      <path d="M50 40h36M56 52h32M50 64h34" stroke="#5ff5e0" stroke-width="5" stroke-linecap="round"/>
      <path d="M46 30h20M48 74h18" stroke="#b8fff5" stroke-width="3" stroke-linecap="round"/>
    </g>

    <!-- Vigor: peitoral -->
    <g v-else-if="icon === 'armor'">
      <path d="M30 20l12-4q8 8 16 0l12 4 14 14-8 12-6-4v42H30V42l-6 4-8-12z" fill="#d9dde3" stroke="#3a3f48" stroke-width="3"/>
      <path d="M36 32h28v22q-14 10-28 0z" fill="#b24a2a"/>
      <path d="M36 66h28M36 76h28" stroke="#8c939e" stroke-width="3"/>
      <path d="M22 32l8-8M78 32l-8-8" stroke="#c0692f" stroke-width="6" stroke-linecap="round"/>
    </g>

    <!-- Força: espada -->
    <g v-else-if="icon === 'sword'">
      <path d="M50 6 60 18v46H40V18z" fill="#9ff0ff" stroke="#1e4a66" stroke-width="3"/>
      <path d="M50 11v50" stroke="#fff" stroke-width="3" opacity=".75"/>
      <path d="M28 64h44v8H28z" fill="#ffd23f" stroke="#6b3d00" stroke-width="3"/>
      <path d="M45 72h10v14H45z" fill="#7a4a2a" stroke="#3b2410" stroke-width="3"/>
      <circle cx="50" cy="90" r="5" fill="#ffd23f" stroke="#6b3d00" stroke-width="3"/>
    </g>

    <!-- Recuperação: coração com asas -->
    <g v-else-if="icon === 'heart'">
      <path d="M27 46C19 35 8 35 3 40c6 2 9 6 9 11 4-2 9 0 11 4zM73 46c8-11 19-11 24-6-6 2-9 6-9 11-4-2-9 0-11 4z" fill="#fff" stroke="#8a8fa0" stroke-width="2.5"/>
      <path d="M50 84C30 70 25 58 25 48c0-10 8-17 17-17 4 0 7 2 8 5 1-3 4-5 8-5 9 0 17 7 17 17 0 10-5 22-25 36z" fill="#ff4d6d" stroke="#7a1030" stroke-width="3"/>
      <path d="M50 44l7 9-7 11-7-11z" fill="#ffd23f" stroke="#a3162a" stroke-width="2"/>
      <path d="M36 44c-3 2-5 6-4 10" stroke="#ffc2cf" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Muro de Ferro: escudo com cruz -->
    <g v-else-if="icon === 'wall'">
      <path d="M50 10 84 22v22c0 22-14 38-34 46-20-8-34-24-34-46V22z" fill="#a9b4c2" stroke="#3a4250" stroke-width="3"/>
      <path d="M50 20 74 29v16c0 16-10 28-24 34-14-6-24-18-24-34V29z" fill="#5d4638"/>
      <path d="M44 24h12v52H44zM28 42h44v12H28z" fill="#8a5a3c"/>
      <path d="M30 26 50 18v10l-18 7z" fill="#fff" opacity=".35"/>
    </g>

    <!-- Cura: poção -->
    <g v-else-if="icon === 'potion'">
      <path d="M42 20h16v14c14 4 24 16 24 30 0 16-14 26-32 26S18 80 18 64c0-14 10-26 24-30z" fill="#d8f7cf" opacity=".9"/>
      <path d="M20 58h60c1 18-13 30-30 30S19 76 20 58z" fill="#4cc94f"/>
      <path d="M42 20h16v14c14 4 24 16 24 30 0 16-14 26-32 26S18 80 18 64c0-14 10-26 24-30z" fill="none" stroke="#1e5a2a" stroke-width="3"/>
      <rect x="39" y="8" width="22" height="12" rx="3" fill="#b07a4a" stroke="#4a2a10" stroke-width="3"/>
      <circle cx="38" cy="68" r="4" fill="#d8ffcf"/>
      <circle cx="58" cy="76" r="3" fill="#d8ffcf"/>
      <path d="M28 50c2-6 6-10 11-12" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>

    <!-- Titã: martelo -->
    <g v-else-if="icon === 'hammer'">
      <path d="M45 40h10v52H45z" fill="#8a5a3c" stroke="#3b2410" stroke-width="3"/>
      <path d="M45 56h10M45 68h10M45 80h10" stroke="#3b2410" stroke-width="3"/>
      <path d="M20 12h60v30H20z" fill="#9aa3ae" stroke="#343a44" stroke-width="3"/>
      <path d="M20 12h13v30H20zM67 12h13v30H67z" fill="#6f7782" stroke="#343a44" stroke-width="3"/>
      <path d="M38 19h24" stroke="#d6dbe2" stroke-width="3" stroke-linecap="round"/>
    </g>
  </svg>
</template>
