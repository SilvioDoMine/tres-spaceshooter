<script setup lang="ts">
import { isSkillIconKey } from '~/data/skillIcons';

// Ícone de habilidade no estilo Archero 2: arte chapada com contorno escuro grosso, gradiente e brilho.
// Todos os SVGs usam o mesmo quadro (viewBox 100x100, arte dentro de ~6..94) e o componente é sempre um
// quadrado na largura do pai, então SVG e emoji saem do mesmo tamanho em qualquer moldura.
// `icon` que não for uma chave de SKILL_ICON_KEYS é desenhado como texto (emoji).
const props = defineProps<{ icon: string }>();

const isSvg = computed(() => isSkillIconKey(props.icon));

// Ids únicos por instância: vários ícones na tela não podem dividir os mesmos gradientes
const uid = useId();
const id = (name: string) => `skill-${uid}-${name}`;
const u = (name: string) => `url(#${id(name)})`;
const link = (name: string) => `#${id(name)}`;

const HEART = 'M50 86C22 68 10 54 10 38C10 24 20 15 32 15C40 15 46 20 50 26C54 20 60 15 68 15C80 15 90 24 90 38C90 54 78 68 50 86Z';
// Caça Rastreador: gancho de perseguição, do rabicho fechado até a ponta onde vai o projétil
const HOMING_HOOK = 'M72 62C80 70 76 86 58 90C36 95 12 84 12 60C12 38 30 20 50 19';
const ICE_ARMS = [0, 60, 120, 180, 240, 300];
const PELLETS = [-50, -25, 0, 25, 50].map((angle) => ({
  angle,
  x: 50 + 40 * Math.sin((angle * Math.PI) / 180),
  y: 78 - 40 * Math.cos((angle * Math.PI) / 180),
}));
</script>

<template>
  <span class="skill-icon">
    <svg
      v-if="isSvg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
      stroke-linejoin="round"
    >
      <defs>
        <linearGradient :id="id('gold')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff4a3" />
          <stop offset="0.5" stop-color="#ffcb3a" />
          <stop offset="1" stop-color="#e8870e" />
        </linearGradient>
        <linearGradient :id="id('goldSide')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f0a41c" />
          <stop offset="1" stop-color="#b0600a" />
        </linearGradient>
        <linearGradient :id="id('red')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff95a3" />
          <stop offset="0.45" stop-color="#ff3b57" />
          <stop offset="1" stop-color="#c8103a" />
        </linearGradient>
        <linearGradient :id="id('metal')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f4f8fc" />
          <stop offset="0.5" stop-color="#b9c5d6" />
          <stop offset="1" stop-color="#7a879c" />
        </linearGradient>
        <linearGradient :id="id('gun')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#5a6477" />
          <stop offset="0.4" stop-color="#c9d2de" />
          <stop offset="1" stop-color="#5a6477" />
        </linearGradient>
        <linearGradient :id="id('plasma')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e8ffff" />
          <stop offset="0.45" stop-color="#5ce1ff" />
          <stop offset="1" stop-color="#2586e8" />
        </linearGradient>
        <linearGradient :id="id('green')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d9ffb3" />
          <stop offset="0.5" stop-color="#71e04a" />
          <stop offset="1" stop-color="#2e9c26" />
        </linearGradient>
        <linearGradient :id="id('purple')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f3d6ff" />
          <stop offset="0.5" stop-color="#b86bff" />
          <stop offset="1" stop-color="#7430cc" />
        </linearGradient>
        <linearGradient :id="id('fire')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff7b8" />
          <stop offset="0.4" stop-color="#ffb627" />
          <stop offset="1" stop-color="#ff4b1f" />
        </linearGradient>
        <linearGradient :id="id('fireCore')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fffbe0" />
          <stop offset="1" stop-color="#ffc93c" />
        </linearGradient>
        <linearGradient :id="id('ice')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.5" stop-color="#aeeeff" />
          <stop offset="1" stop-color="#4fa6ff" />
        </linearGradient>
        <linearGradient :id="id('screen')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1d4a80" />
          <stop offset="1" stop-color="#0b1a33" />
        </linearGradient>
        <linearGradient :id="id('bone')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.6" stop-color="#e6e0cf" />
          <stop offset="1" stop-color="#b9ae94" />
        </linearGradient>
        <linearGradient :id="id('glass')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#cfe8f7" />
          <stop offset="0.35" stop-color="#ffffff" />
          <stop offset="1" stop-color="#8fb9d6" />
        </linearGradient>
        <linearGradient :id="id('sweep')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#5ce1ff" stop-opacity="0.8" />
          <stop offset="1" stop-color="#5ce1ff" stop-opacity="0.1" />
        </linearGradient>
        <radialGradient :id="id('glow')" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.75" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="id('glowRed')" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ff6b7d" stop-opacity="0.7" />
          <stop offset="1" stop-color="#ff6b7d" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="id('glowFire')" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ffb627" stop-opacity="0.75" />
          <stop offset="1" stop-color="#ffb627" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="id('glowIce')" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#dff8ff" stop-opacity="0.9" />
          <stop offset="1" stop-color="#dff8ff" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="id('glowPlasma')" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#7ff0ff" stop-opacity="0.8" />
          <stop offset="1" stop-color="#7ff0ff" stop-opacity="0" />
        </radialGradient>
        <clipPath :id="id('heart')">
          <path :d="HEART" />
        </clipPath>

        <!-- Nave do jogador apontando para cima, centrada na origem -->
        <g :id="id('ship')" stroke="#1b2238" stroke-width="3.5" stroke-linejoin="round">
          <path d="M-6 22L0 40L6 22Z" :fill="u('fire')" stroke-width="2.5" />
          <path d="M0 -34L10 -10L28 8V18L10 14L6 24H-6L-10 14L-28 18V8L-10 -10Z" :fill="u('metal')" />
          <path d="M-28 8L-20 0V16.2L-28 18ZM28 8L20 0V16.2L28 18Z" fill="#e5383b" stroke-width="2.5" />
          <path d="M0 -20L5 -6L0 2L-5 -6Z" :fill="u('plasma')" stroke-width="2.5" />
          <path d="M-2 -26L-6 -14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
        </g>

        <!-- Projétil de plasma apontando para cima: ponta afiada, corpo em cápsula e rastro -->
        <g :id="id('bolt')" stroke="#1b2238" stroke-width="3" stroke-linejoin="round">
          <ellipse cx="0" cy="2" rx="11" ry="20" :fill="u('glowPlasma')" stroke="none" />
          <path d="M-4 11L0 24L4 11Z" fill="#5ce1ff" stroke="none" opacity="0.55" />
          <path d="M0 -17C4 -12 6 -7 6 -2V8C6 11 3 13 0 13C-3 13 -6 11 -6 8V-2C-6 -7 -4 -12 0 -17Z" :fill="u('plasma')" />
          <path d="M0 -10C2 -7 2.5 -4 2.5 -1V6C2.5 7.5 1.5 8.5 0 8.5C-1.5 8.5 -2.5 7.5 -2.5 6V-1C-2.5 -4 -2 -7 0 -10Z" fill="#fff" stroke="none" opacity="0.9" />
        </g>

        <!-- Chama solta, centrada na origem: o tamanho vem da escala do <use> -->
        <g :id="id('flame')" stroke="#1b2238" stroke-width="3.5" stroke-linejoin="round">
          <path d="M1 -18C3 -10 9 -6 9 1C9 8 5 14 0 14C-5 14 -9 8 -9 1C-9 -4 -4 -6 -3 -12C-1 -9 0 -13 1 -18Z" :fill="u('fire')" />
          <path
            d="M.5 -8C1.5 -3 4.5 -2 4.5 2C4.5 6.5 2.5 10 0 10C-2.5 10 -4.5 6.5 -4.5 2C-4.5 -1 -2 -3 .5 -8Z"
            :fill="u('fireCore')"
            stroke="none"
          />
        </g>

        <!-- Brilho de 4 pontas (a cor vem do fill do <use>) -->
        <path
          :id="id('spark')"
          d="M0 -9Q1.6 -1.6 9 0Q1.6 1.6 0 9Q-1.6 1.6 -9 0Q-1.6 -1.6 0 -9Z"
          stroke="#1b2238"
          stroke-width="1.5"
        />
      </defs>

      <!-- Ouro Bônus: pilha de créditos + moeda com estrela -->
      <g v-if="icon === 'coins'" stroke="#1b2238" stroke-width="3.5">
        <circle cx="50" cy="52" r="42" :fill="u('glow')" stroke="none" opacity="0.6" />
        <path d="M14 76v8c0 4 8 7 18 7s18-3 18-7v-8" :fill="u('goldSide')" />
        <ellipse cx="32" cy="76" rx="18" ry="7" :fill="u('gold')" />
        <path d="M14 66v8c0 4 8 7 18 7s18-3 18-7v-8" :fill="u('goldSide')" />
        <ellipse cx="32" cy="66" rx="18" ry="7" :fill="u('gold')" />
        <path d="M14 56v8c0 4 8 7 18 7s18-3 18-7v-8" :fill="u('goldSide')" />
        <ellipse cx="32" cy="56" rx="18" ry="7" :fill="u('gold')" />
        <circle cx="64" cy="50" r="27" :fill="u('goldSide')" />
        <circle cx="64" cy="46" r="27" :fill="u('gold')" />
        <circle cx="64" cy="46" r="19" fill="none" stroke="#c46f06" stroke-width="3" />
        <path
          d="M64 35L66.7 42.3L74.5 42.6L68.4 47.4L70.5 54.9L64 50.6L57.5 54.9L59.6 47.4L53.5 42.6L61.3 42.3Z"
          fill="#fff6c9"
          stroke="#c46f06"
          stroke-width="2.5"
        />
        <path d="M46 34a22 22 0 0 1 12-9" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.85" />
        <use :href="link('spark')" fill="#fff" transform="translate(22 32)" />
        <use :href="link('spark')" fill="#fff" transform="translate(88 82) scale(.7)" />
      </g>

      <!-- Dano Aumentado: munição de plasma + seta verde -->
      <g v-else-if="icon === 'damage-up'" stroke="#1b2238" stroke-width="3.5">
        <circle cx="40" cy="48" r="38" :fill="u('glowRed')" stroke="none" />
        <path d="M40 8C52 20 55 32 55 44V72H25V44C25 32 28 20 40 8Z" :fill="u('red')" />
        <path d="M33 22C30 30 30 40 30 54" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.7" />
        <path d="M25 60H55" stroke-width="3" />
        <rect x="22" y="72" width="36" height="18" rx="3" :fill="u('gold')" />
        <path d="M30 78v6M40 78v6M50 78v6" stroke="#b06a08" stroke-width="3" stroke-linecap="round" />
        <path d="M78 36L94 56H85V84H71V56H62Z" :fill="u('green')" />
        <path d="M76 60V78" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.6" />
      </g>

      <!-- Vida Aumentada: coração com cruz + seta verde -->
      <g v-else-if="icon === 'health-up'" stroke="#1b2238" stroke-width="3.5">
        <path
          d="M42 78C18 63 10 50 10 38C10 26 18 18 28 18C35 18 40 22 42 27C44 22 49 18 56 18C66 18 74 26 74 38C74 50 66 63 42 78Z"
          :fill="u('red')"
        />
        <path d="M18 36C19 30 23 26 29 26" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity="0.8" />
        <path d="M37 33h10v7h7v10h-7v7H37v-7h-7V40h7Z" fill="#fff" stroke="#7a1030" stroke-width="2.5" />
        <path d="M80 44L94 62H86V88H74V62H66Z" :fill="u('green')" />
        <path d="M78 66V82" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6" />
      </g>

      <!-- Núcleo Vital: coração-reator + célula que acumula vida a cada coração -->
      <g v-else-if="icon === 'vital-core'" stroke="#1b2238" stroke-width="3.5">
        <circle cx="40" cy="46" r="40" :fill="u('glowRed')" stroke="none" />
        <path
          d="M42 78C18 63 10 50 10 38C10 26 18 18 28 18C35 18 40 22 42 27C44 22 49 18 56 18C66 18 74 26 74 38C74 50 66 63 42 78Z"
          :fill="u('red')"
        />
        <path d="M18 36C19 30 23 26 29 26" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity="0.8" />
        <circle cx="42" cy="41" r="15" :fill="u('metal')" stroke-width="3" />
        <circle cx="42" cy="41" r="9" :fill="u('fireCore')" stroke-width="2.5" />
        <path d="M36 45l6-8 6 8" fill="none" stroke="#c46f06" stroke-width="3" stroke-linecap="round" />
        <rect x="70" y="30" width="22" height="58" rx="6" :fill="u('metal')" />
        <rect x="75" y="22" width="12" height="9" rx="3" :fill="u('metal')" stroke-width="3" />
        <rect x="75" y="68" width="12" height="14" rx="2" :fill="u('red')" stroke-width="2.5" />
        <rect x="75" y="52" width="12" height="12" rx="2" :fill="u('red')" stroke-width="2.5" />
        <rect x="75" y="38" width="12" height="10" rx="2" :fill="u('gold')" stroke-width="2.5" />
        <use :href="link('spark')" fill="#fff" transform="translate(81 18) scale(.55)" />
      </g>

      <!-- Fúria Carmesim: coração energizado com a aura girando em volta -->
      <g v-else-if="icon === 'heart-fury'" stroke="#1b2238" stroke-width="3.5">
        <circle cx="50" cy="50" r="44" :fill="u('glowRed')" stroke="none" />
        <g transform="rotate(-18 50 52)">
          <path d="M8 52A42 19 0 0 1 92 52" fill="none" stroke-width="10" stroke-linecap="round" />
          <path d="M8 52A42 19 0 0 1 92 52" fill="none" stroke="#ff8fa3" stroke-width="4.5" stroke-linecap="round" />
        </g>
        <path
          d="M50 84C26 68 16 55 16 42C16 30 24 22 34 22C41 22 46 26 50 32C54 26 59 22 66 22C76 22 84 30 84 42C84 55 74 68 50 84Z"
          :fill="u('red')"
        />
        <path d="M24 40C25 34 29 30 35 30" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity="0.8" />
        <path
          d="M50 37L54.6 48.6L67 50L57.8 58.3L60.4 70.5L50 64.1L39.6 70.5L42.2 58.3L33 50L45.4 48.6Z"
          :fill="u('gold')"
          stroke-width="2.5"
        />
        <g transform="rotate(-18 50 52)">
          <path d="M92 52A42 19 0 0 1 8 52" fill="none" stroke-width="10" stroke-linecap="round" />
          <path d="M92 52A42 19 0 0 1 8 52" fill="none" stroke="#ffd23f" stroke-width="4.5" stroke-linecap="round" />
          <circle cx="86" cy="55" r="6.5" :fill="u('gold')" stroke-width="3" />
          <circle cx="14" cy="55" r="5" :fill="u('gold')" stroke-width="3" />
        </g>
      </g>

      <!-- Aprendizado: datapad com gráfico subindo + estrela -->
      <g v-else-if="icon === 'datapad'" stroke="#1b2238" stroke-width="3.5">
        <rect x="12" y="22" width="72" height="62" rx="10" :fill="u('metal')" />
        <rect x="20" y="30" width="56" height="42" rx="5" :fill="u('screen')" stroke-width="3" />
        <path d="M20 44H76M20 58H76M34 30V72M48 30V72M62 30V72" stroke="#5ce1ff" stroke-width="1" opacity="0.3" />
        <rect x="26" y="54" width="10" height="12" rx="1.5" :fill="u('plasma')" stroke-width="2.5" />
        <rect x="43" y="45" width="10" height="21" rx="1.5" :fill="u('plasma')" stroke-width="2.5" />
        <rect x="60" y="36" width="10" height="30" rx="1.5" :fill="u('green')" stroke-width="2.5" />
        <circle cx="48" cy="78" r="2.5" fill="#5ce1ff" stroke="none" />
        <path d="M18 34V30Q18 26 22 26H34" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8" />
        <path
          d="M80 8L83.5 17.1L93.3 17.7L85.7 23.9L88.2 33.3L80 28L71.8 33.3L74.3 23.9L66.7 17.7L76.5 17.1Z"
          :fill="u('gold')"
        />
      </g>

      <!-- Reparo de Emergência: chave inglesa + cruz verde -->
      <g v-else-if="icon === 'wrench'" stroke="#1b2238" stroke-width="3.5">
        <g transform="rotate(45 50 50)">
          <path
            d="M41 8V22H59V8C71 12 75 24 71 34C68 40 63 43 58 44V84C58 89 54 92 50 92C46 92 42 89 42 84V44C37 43 32 40 29 34C25 24 29 12 41 8Z"
            :fill="u('metal')"
          />
          <path d="M47 50V76" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.7" />
          <circle cx="50" cy="84" r="3" fill="#1b2238" stroke="none" />
        </g>
        <path d="M69 60h10v9h9v10h-9v9H69v-9h-9V69h9Z" :fill="u('green')" />
        <use :href="link('spark')" fill="#ffd23f" transform="translate(24 28)" />
        <use :href="link('spark')" fill="#fff" transform="translate(40 12) scale(.6)" />
      </g>

      <!-- Velocidade Aumentada: nave em disparada -->
      <g v-else-if="icon === 'thrusters'">
        <path d="M6 60L20 46M12 84L28 68M36 92L48 80" stroke="#1b2238" stroke-width="10" stroke-linecap="round" />
        <path d="M6 60L20 46M12 84L28 68M36 92L48 80" stroke="#bff6ff" stroke-width="4.5" stroke-linecap="round" />
        <use :href="link('ship')" transform="translate(58 42) rotate(45)" />
      </g>

      <!-- Tiro Ricochete: projétil quicando num inimigo -->
      <g v-else-if="icon === 'ricochet'" stroke="#1b2238" stroke-width="3.5">
        <path d="M50 6L64 14V30L50 38L36 30V14Z" :fill="u('purple')" />
        <path d="M50 22V38M50 22L36 14M50 22L64 14" stroke-width="2" opacity="0.45" />
        <path d="M41 15L49 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8" />
        <path d="M14 88L50 46L80 74" fill="none" stroke-width="9" stroke-linecap="round" stroke-dasharray="0.1 11" />
        <path d="M14 88L50 46L80 74" fill="none" stroke="#5ce1ff" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 11" />
        <use :href="link('spark')" fill="#ffd23f" transform="translate(50 44) scale(1.5)" />
        <use :href="link('bolt')" transform="translate(80 74) rotate(133) scale(1.1)" />
      </g>

      <!-- Tiros Diagonais: leque de projéteis saindo da nave -->
      <g v-else-if="icon === 'spread-shot'">
        <use :href="link('bolt')" transform="translate(50 23)" />
        <use :href="link('bolt')" transform="translate(24 32) rotate(-45)" />
        <use :href="link('bolt')" transform="translate(76 32) rotate(45)" />
        <use :href="link('bolt')" transform="translate(18 64) rotate(-90) scale(.7)" />
        <use :href="link('bolt')" transform="translate(82 64) rotate(90) scale(.7)" />
        <use :href="link('ship')" transform="translate(50 66) scale(.66)" />
      </g>

      <!-- Tiro Traseiro: canhões de ré disparando para baixo -->
      <g v-else-if="icon === 'back-shot'">
        <use :href="link('ship')" transform="translate(50 30) scale(.66)" />
        <use :href="link('spark')" fill="#ffb627" transform="translate(38 52) scale(.8)" />
        <use :href="link('spark')" fill="#ffb627" transform="translate(62 52) scale(.8)" />
        <use :href="link('bolt')" transform="translate(38 76) rotate(180)" />
        <use :href="link('bolt')" transform="translate(62 76) rotate(180)" />
      </g>

      <!-- Tiro Perfurante: lança de plasma atravessando dois inimigos -->
      <g v-else-if="icon === 'pierce'" stroke="#1b2238" stroke-width="3.5">
        <g transform="rotate(45 50 50)">
          <circle cx="50" cy="68" r="13" :fill="u('red')" />
          <circle cx="50" cy="36" r="13" :fill="u('red')" />
          <rect x="45.5" y="20" width="9" height="74" rx="4.5" :fill="u('plasma')" />
          <path d="M50 4L61 24H39Z" :fill="u('plasma')" />
          <path d="M50 26V88" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.9" />
          <path d="M36 62L30 58M64 62L70 58M36 30L30 26M64 30L70 26" stroke="#ffd23f" stroke-width="3" stroke-linecap="round" />
        </g>
      </g>

      <!-- Alcance Estendido: radar com seta indo além da borda -->
      <g v-else-if="icon === 'radar'" stroke="#1b2238" stroke-width="3.5">
        <circle cx="44" cy="56" r="34" :fill="u('metal')" />
        <circle cx="44" cy="56" r="27" :fill="u('screen')" stroke-width="3" />
        <circle cx="44" cy="56" r="18" fill="none" stroke="#5ce1ff" stroke-width="1.5" opacity="0.45" />
        <circle cx="44" cy="56" r="9" fill="none" stroke="#5ce1ff" stroke-width="1.5" opacity="0.45" />
        <path d="M44 56V29A27 27 0 0 1 69.4 46.8Z" :fill="u('sweep')" stroke="none" />
        <circle cx="30" cy="68" r="2.5" fill="#bff6ff" stroke="none" opacity="0.7" />
        <circle cx="54" cy="74" r="2.5" fill="#bff6ff" stroke="none" opacity="0.5" />
        <path d="M44 56L80 20" stroke-width="11" stroke-linecap="round" />
        <path d="M44 56L80 20" stroke="#ffd23f" stroke-width="5" stroke-linecap="round" />
        <path d="M92 8L86 34L66 14Z" :fill="u('gold')" />
        <circle cx="44" cy="56" r="5" :fill="u('gold')" stroke-width="3" />
      </g>

      <!-- Mira Precisa: retícula + brilho de crítico -->
      <g v-else-if="icon === 'crosshair'" stroke="#1b2238">
        <circle cx="50" cy="52" r="30" fill="none" stroke-width="13" />
        <circle cx="50" cy="52" r="30" fill="none" stroke="#ff3b57" stroke-width="7" />
        <path d="M24 37A30 30 0 0 1 35 26" fill="none" stroke="#ffc2cc" stroke-width="2.5" stroke-linecap="round" />
        <path d="M50 10V32M50 72V94M8 52H30M70 52H92" stroke-width="10" stroke-linecap="round" />
        <path d="M50 10V32M50 72V94M8 52H30M70 52H92" stroke="#fff" stroke-width="4" stroke-linecap="round" />
        <circle cx="50" cy="52" r="7" fill="#ff3b57" stroke-width="3.5" />
        <use :href="link('spark')" fill="#ffd23f" transform="translate(82 18) scale(1.4)" />
      </g>

      <!-- Cadência: canhão rotativo girando -->
      <g v-else-if="icon === 'rotary-cannon'" stroke="#1b2238" stroke-width="3.5">
        <use :href="link('bolt')" transform="translate(22 26) scale(.6)" opacity="0.75" />
        <use :href="link('bolt')" transform="translate(78 26) scale(.6)" opacity="0.75" />
        <use :href="link('bolt')" transform="translate(50 20) scale(.75)" />
        <path d="M14 44C8 52 8 62 14 70M86 44C92 52 92 62 86 70" fill="none" stroke-width="9" stroke-linecap="round" />
        <path d="M14 44C8 52 8 62 14 70M86 44C92 52 92 62 86 70" fill="none" stroke="#bff6ff" stroke-width="4" stroke-linecap="round" />
        <rect x="32" y="38" width="10" height="28" :fill="u('gun')" />
        <rect x="45" y="38" width="10" height="28" :fill="u('gun')" />
        <rect x="58" y="38" width="10" height="28" :fill="u('gun')" />
        <rect x="28" y="50" width="44" height="7" rx="3" :fill="u('metal')" />
        <rect x="28" y="34" width="44" height="8" rx="4" :fill="u('metal')" />
        <path d="M22 62H78V82C78 88 73 92 67 92H33C27 92 22 88 22 82Z" :fill="u('metal')" />
        <path d="M22 70H78V78H22Z" fill="#e5383b" stroke-width="2.5" />
        <path d="M28 66H48" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8" />
      </g>

      <!-- Adrenalina: coração quase vazio com batimento -->
      <g v-else-if="icon === 'adrenaline'" stroke="#1b2238" stroke-width="3.5">
        <circle cx="50" cy="50" r="44" :fill="u('glowRed')" stroke="none" />
        <path :d="HEART" fill="#3a1424" />
        <g :clip-path="u('heart')">
          <path d="M8 62Q18 56 28 62T48 62T68 62T88 62V92H8Z" :fill="u('red')" stroke="none" />
        </g>
        <path :d="HEART" fill="none" />
        <path d="M20 34C21 28 25 24 31 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.5" />
        <path d="M8 48H28L35 34L44 64L53 26L61 54L67 48H92" fill="none" stroke-width="10" stroke-linecap="round" />
        <path d="M8 48H28L35 34L44 64L53 26L61 54L67 48H92" fill="none" stroke="#ffe066" stroke-width="4.5" stroke-linecap="round" />
      </g>

      <!-- Tiro Certeiro: crânio alienígena na mira -->
      <g v-else-if="icon === 'alien-skull'" stroke="#1b2238" stroke-width="3.5">
        <path d="M8 26V8H26M74 8H92V26M92 74V92H74M26 92H8V74" fill="none" stroke-width="10" stroke-linecap="round" />
        <path d="M8 26V8H26M74 8H92V26M92 74V92H74M26 92H8V74" fill="none" stroke="#ff3b57" stroke-width="5" stroke-linecap="round" />
        <path
          d="M50 14C70 14 82 28 82 46C82 58 76 66 68 70V80C68 84 64 86 60 86H40C36 86 32 84 32 80V70C24 66 18 58 18 46C18 28 30 14 50 14Z"
          :fill="u('bone')"
        />
        <path d="M34 24C40 19 48 18 55 19" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" />
        <path d="M27 45C31 37 42 37 46 48C42 55 31 54 27 45ZM73 45C69 37 58 37 54 48C58 55 69 54 73 45Z" fill="#1b2238" />
        <ellipse cx="38" cy="47" rx="3.5" ry="3" fill="#ff5a6e" stroke="none" />
        <ellipse cx="62" cy="47" rx="3.5" ry="3" fill="#ff5a6e" stroke="none" />
        <path d="M50 57L46.5 64H53.5Z" fill="#1b2238" stroke-width="2" />
        <path d="M32 72H68M42 72V84M50 72V86M58 72V84" fill="none" stroke-width="2.5" />
      </g>

      <!-- Manobra Evasiva: nave desviando e deixando um vulto para trás -->
      <g v-else-if="icon === 'evasion'">
        <use :href="link('ship')" transform="translate(32 58) rotate(-8) scale(.7)" opacity="0.45" />
        <circle cx="30" cy="44" r="15" :fill="u('glowRed')" />
        <path d="M10 8L37 39L24 47Z" fill="#ff95a3" opacity="0.65" />
        <circle cx="30" cy="44" r="8.5" :fill="u('red')" stroke="#1b2238" stroke-width="3" />
        <circle cx="27.5" cy="41" r="2.5" fill="#fff" opacity="0.85" />
        <path d="M20 88C44 94 70 84 86 62" fill="none" stroke="#1b2238" stroke-width="10" stroke-linecap="round" />
        <path d="M20 88C44 94 70 84 86 62" fill="none" stroke="#bff6ff" stroke-width="4.5" stroke-linecap="round" />
        <use :href="link('ship')" transform="translate(64 44) rotate(20) scale(.78)" />
      </g>

      <!-- Sifão: célula de energia sugando vida de um inimigo destruído -->
      <g v-else-if="icon === 'siphon'" stroke="#1b2238" stroke-width="3.5">
        <path d="M70 60L80 52L90 60L84 74L72 72Z" :fill="u('purple')" />
        <path d="M88 80L94 84L88 90Z" :fill="u('purple')" stroke-width="2.5" />
        <circle cx="84" cy="44" r="4.5" :fill="u('red')" stroke-width="2" />
        <circle cx="85" cy="29" r="4" :fill="u('red')" stroke-width="2" />
        <circle cx="75" cy="17" r="3.5" :fill="u('red')" stroke-width="2" />
        <circle cx="62" cy="13" r="3" :fill="u('red')" stroke-width="2" />
        <rect x="26" y="30" width="40" height="56" rx="10" :fill="u('glass')" />
        <path d="M29 58Q37 53 46 58T63 58V84H29Z" :fill="u('red')" stroke="none" />
        <rect x="26" y="30" width="40" height="56" rx="10" fill="none" />
        <path
          d="M46 78C39 73 36 69 36 66C36 63 38 61 41 61C43 61 45 62 46 64C47 62 49 61 51 61C54 61 56 63 56 66C56 69 53 73 46 78Z"
          fill="#fff"
          stroke="none"
          opacity="0.9"
        />
        <path d="M33 40V52" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.9" />
        <rect x="22" y="22" width="48" height="12" rx="4" :fill="u('metal')" />
        <rect x="22" y="82" width="48" height="10" rx="4" :fill="u('metal')" />
      </g>

      <!-- Tiro Frontal: três projéteis paralelos -->
      <g v-else-if="icon === 'front-shot'">
        <use :href="link('bolt')" transform="translate(30 32)" />
        <use :href="link('bolt')" transform="translate(50 24)" />
        <use :href="link('bolt')" transform="translate(70 32)" />
        <use :href="link('ship')" transform="translate(50 66) scale(.64)" />
      </g>

      <!-- Caça Rastreador: o projétil descreve a curva atrás do alvo -->
      <g v-else-if="icon === 'homing-shot'">
        <path :d="HOMING_HOOK" fill="none" stroke="#1b2238" stroke-width="23" stroke-linecap="round" />
        <path :d="HOMING_HOOK" fill="none" :stroke="u('red')" stroke-width="13.5" stroke-linecap="round" />
        <path d="M15 53C18 37 30 26 44 22" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.45" />
        <use :href="link('bolt')" transform="translate(57 21) rotate(62)" />
      </g>

      <!-- Tiro de Fogo: bola de fogo em disparada -->
      <g v-else-if="icon === 'fire-shot'" stroke="#1b2238" stroke-width="3.5">
        <circle cx="16" cy="62" r="3.5" :fill="u('fire')" stroke-width="2" />
        <circle cx="38" cy="88" r="3" :fill="u('fire')" stroke-width="2" />
        <circle cx="12" cy="84" r="2.5" :fill="u('fire')" stroke-width="2" />
        <g transform="rotate(45 50 50)">
          <path
            d="M50 14C62 14 70 24 70 36C70 52 62 60 64 76C58 70 56 74 56 84C52 78 50 82 50 94C46 82 44 78 42 84C40 74 38 70 34 76C36 60 30 52 30 36C30 24 38 14 50 14Z"
            :fill="u('fire')"
          />
          <path
            d="M50 22C58 22 62 29 62 37C62 48 56 54 57 64C53 60 51 64 50 72C49 64 47 60 43 64C44 54 38 48 38 37C38 29 42 22 50 22Z"
            :fill="u('fireCore')"
            stroke="none"
          />
          <circle cx="50" cy="35" r="9" fill="#fff" stroke="none" />
        </g>
      </g>

      <!-- Rastro de Fogo: a nave acende o chão por onde passa -->
      <g v-else-if="icon === 'fire-trail'">
        <ellipse cx="38" cy="68" rx="44" ry="26" :fill="u('glowFire')" transform="rotate(-44 38 68)" />
        <use :href="link('flame')" transform="translate(12 90) scale(.48) rotate(-14)" opacity="0.65" />
        <use :href="link('flame')" transform="translate(24 81) scale(.7) rotate(-10)" opacity="0.82" />
        <use :href="link('flame')" transform="translate(36 70) scale(.92) rotate(-7)" />
        <use :href="link('flame')" transform="translate(48 58) scale(1.12) rotate(-4)" />
        <use :href="link('flame')" transform="translate(59 45) scale(1.32)" />
        <use :href="link('spark')" fill="#ffd23f" transform="translate(74 60) scale(.75)" />
        <use :href="link('spark')" fill="#fff" transform="translate(19 64) scale(.55)" />
        <use :href="link('ship')" transform="translate(70 26) rotate(34) scale(.6)" />
      </g>

      <!-- Tiro de Gelo: cristal de gelo -->
      <g v-else-if="icon === 'ice-crystal'" stroke="#1b2238" stroke-width="3">
        <circle cx="50" cy="50" r="42" :fill="u('glowIce')" stroke="none" />
        <g v-for="angle in ICE_ARMS" :key="angle" :transform="`rotate(${angle} 50 50)`">
          <path d="M50 8L58 24L50 44L42 24Z" :fill="u('ice')" />
          <path d="M48 15L45 24" stroke="#fff" stroke-width="2" stroke-linecap="round" />
        </g>
        <path d="M50 38L60.4 44V56L50 62L39.6 56V44Z" :fill="u('ice')" />
        <circle cx="50" cy="50" r="4" fill="#fff" stroke="none" />
      </g>

      <!-- Tiro de Raio: raio encadeando em dois inimigos -->
      <g v-else-if="icon === 'lightning'" stroke="#1b2238" stroke-width="3.5">
        <path d="M40 32L30 24L24 30L18 24M62 60L70 58L72 68L82 70" fill="none" stroke-width="7" stroke-linecap="round" />
        <path d="M40 32L30 24L24 30L18 24M62 60L70 58L72 68L82 70" fill="none" stroke="#bff6ff" stroke-width="3" stroke-linecap="round" />
        <circle cx="15" cy="21" r="8" :fill="u('purple')" />
        <circle cx="86" cy="76" r="8" :fill="u('purple')" />
        <path d="M56 6H78L62 36H80L34 94L44 56H24Z" :fill="u('gold')" />
        <path d="M59 12H70L58 34" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.85" />
        <use :href="link('spark')" fill="#fff" transform="translate(86 14) scale(.8)" />
      </g>

      <!-- Tiros Múltiplos: rajada repetida -->
      <g v-else-if="icon === 'burst'">
        <use :href="link('bolt')" transform="translate(26 66) scale(1.1)" opacity="0.45" />
        <use :href="link('bolt')" transform="translate(50 50) scale(1.1)" opacity="0.7" />
        <use :href="link('bolt')" transform="translate(74 32) scale(1.1)" />
        <use :href="link('spark')" fill="#ffd23f" transform="translate(88 64) scale(1.1)" />
        <use :href="link('spark')" fill="#fff" transform="translate(26 22) scale(.8)" />
      </g>

      <!-- Posição Firme: nave plantada dentro do medidor de ancoragem, cuspindo rajada contínua.
           O anel de placas no chão é o mesmo medidor de carga do efeito em jogo. -->
      <g v-else-if="icon === 'standing-ground'">
        <circle cx="50" cy="52" r="42" :fill="u('glowFire')" stroke="none" />
        <use :href="link('bolt')" transform="translate(50 12) scale(.5)" />
        <use :href="link('ship')" transform="translate(50 50) scale(.7)" />
        <use :href="link('spark')" fill="#ffd23f" transform="translate(50 26) scale(1.1)" />
        <use :href="link('spark')" fill="#fff" transform="translate(50 26) scale(.6)" />
        <ellipse cx="50" cy="78" rx="39" ry="13" fill="none" stroke="#1b2238" stroke-width="14" stroke-dasharray="12 8" />
        <ellipse cx="50" cy="78" rx="39" ry="13" fill="none" :stroke="u('fire')" stroke-width="6.5" stroke-dasharray="12 8" />
        <use :href="link('spark')" fill="#ffd23f" transform="translate(13 56) scale(.9)" />
        <use :href="link('spark')" fill="#fff" transform="translate(88 40) scale(.65)" />
      </g>

      <!-- Tiro de Curta Distância: estouro em cone com limite de alcance -->
      <g v-else-if="icon === 'shotgun'">
        <path d="M50 80L14 44Q50 14 86 44Z" :fill="u('fire')" opacity="0.35" />
        <path d="M16 26Q50 2 84 26" fill="none" stroke="#ff3b57" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="6 6" />
        <use
          v-for="pellet in PELLETS"
          :key="pellet.angle"
          :href="link('bolt')"
          :transform="`translate(${pellet.x} ${pellet.y}) rotate(${pellet.angle}) scale(.75)`"
        />
        <use :href="link('spark')" fill="#ffb627" transform="translate(50 78) scale(1.7)" />
        <use :href="link('spark')" fill="#fff" transform="translate(50 78) scale(.8)" />
      </g>
    </svg>

    <span v-else class="skill-icon__emoji">{{ icon }}</span>
  </span>
</template>

<style scoped>
.skill-icon {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  container-type: inline-size;
  line-height: 1;
}
.skill-icon svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.skill-icon__emoji {
  font-size: 72cqw;
}
</style>
