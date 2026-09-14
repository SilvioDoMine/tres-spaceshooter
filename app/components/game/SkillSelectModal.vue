<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useSkillStore } from '~/stores/SkillStore';

const currentRunStore = useCurrentRunStore();
const skillStore = useSkillStore();

// Cartas no estilo dos cards da Loja (Archero 2): contorno escuro, sombra dura embaixo, brilho no topo,
// reflexo que atravessa a carta e inclinação 3D seguindo o ponteiro. A cor vem da raridade.
const RARITIES = {
    poor: { frame: 'gray', label: 'Comum' },
    common: { frame: 'gray', label: 'Comum' },
    uncommon: { frame: 'green', label: 'Incomum' },
    rare: { frame: 'blue', label: 'Rara' },
    epic: { frame: 'purple', label: 'Épica' },
    legendary: { frame: 'orange', label: 'Lendária' },
};

const rarityOf = (skill) => RARITIES[skill.rarity] ?? RARITIES.common;

const isOpen = computed(() => currentRunStore.isPaused && skillStore.isModalOpen);

// Descrição do próximo nível (cai no nível atual quando não existe o próximo)
const effectOf = (skill) =>
    skill.levels[skill.currentLevel + 1]?.description ?? skill.levels[skill.currentLevel]?.description ?? '';

const levelLabel = (skill) => {
    if (skill.repeatable) return 'Instantânea';
    return skill.currentLevel === 0 ? 'Nova!' : `Nv. ${skill.currentLevel} → ${skill.currentLevel + 1}`;
};

const pick = (skill) => {
    skillStore.selectSkill(skill);
    currentRunStore.gameResume(currentRunStore.levelConfig);
};

// Função para selecionar skill pelo índice (0, 1, 2)
const selectSkillByIndex = (index) => {
    const skill = skillStore.skillOptions[index];
    if (skill) pick(skill);
};

// Listener de teclado para as teclas 1, 2, 3
const handleKeyPress = (event) => {
    // Só processa se o modal estiver aberto
    if (!skillStore.isModalOpen || !currentRunStore.isPaused) return;

    const key = event.key;
    if (key === '1') {
        selectSkillByIndex(0);
    } else if (key === '2') {
        selectSkillByIndex(1);
    } else if (key === '3') {
        selectSkillByIndex(2);
    }
};

// Inclinação 3D: só com mouse/caneta (no toque a carta seria escolhida no mesmo gesto)
const tilt = (event) => {
    if (event.pointerType === 'touch') return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
};

const untilt = (event) => {
    const el = event.currentTarget;
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
    el.style.removeProperty('--gx');
    el.style.removeProperty('--gy');
};

// Adiciona/remove listeners quando o modal abre/fecha
onMounted(() => {
    window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
});

// When modal is closed and opens up, we should throw confetti
watch(
    () => skillStore.isModalOpen,
    (newVal, oldVal) => {
        if (newVal && !oldVal) {
            const duration = 200;

            confettiCustomParade(duration, {
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                ticks: 100,
            });

            confettiCustomParade(duration, {
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                ticks: 100,
            });

            confettiCustomParade(duration, {
                particleCount: 7,
                angle: 90,
                origin: { x: 0.5, y: 1 },
                ticks: 100,
            });
        }
    }
);
</script>

<template>
    <div
        class="skills allow-scroll"
        :class="{ 'is-open': isOpen }"
        role="dialog"
        aria-modal="true"
        aria-label="Escolha uma habilidade"
    >
        <BaseRibbonTitle text="Escolha uma Habilidade" variant="blue" :open="isOpen" />

        <div class="skills__row">
            <div
                v-for="(skill, index) in skillStore.skillOptions"
                :key="skill.id"
                class="skills__slot"
                :style="{ '--i': index }"
            >
                <button
                    type="button"
                    class="scard"
                    :class="`is-${rarityOf(skill).frame}`"
                    data-ui-sound="confirm"
                    :aria-label="`${skill.name}, ${rarityOf(skill).label}: ${effectOf(skill)}`"
                    @pointermove="tilt"
                    @pointerleave="untilt"
                    @click="pick(skill)"
                >
                    <span class="scard__body">
                        <span class="scard__shine" aria-hidden="true"></span>
                        <span class="scard__sheen" aria-hidden="true"></span>
                        <span class="scard__glare" aria-hidden="true"></span>

                        <!-- Tecla de atalho desenhada como uma tecla de teclado -->
                        <span class="scard__key keycap" aria-hidden="true">
                            <span class="keycap__top"><b>{{ index + 1 }}</b></span>
                        </span>
                        <span class="scard__rarity">{{ rarityOf(skill).label }}</span>

                        <span class="scard__stage">
                            <span class="scard__rays" aria-hidden="true"></span>
                            <span class="scard__icon">
                                <BaseRarityFrame :rarity="rarityOf(skill).frame">
                                    <SkillIcon :icon="skill.icon" />
                                </BaseRarityFrame>
                            </span>
                        </span>

                        <span class="scard__info">
                            <strong class="scard__name">{{ skill.name }}</strong>
                            <span class="scard__level" :class="{ 'is-new': skill.currentLevel === 0 && !skill.repeatable }">
                                {{ levelLabel(skill) }}
                            </span>
                        </span>

                        <span class="scard__desc">
                            <span class="scard__effect">{{ effectOf(skill) }}</span>
                            <span class="scard__text">{{ skill.description }}</span>
                        </span>
                    </span>
                </button>

                <!-- Troca da carta (reroll) -->
                <button
                    type="button"
                    class="sreroll"
                    :class="{ 'is-hidden': skill.reRolls <= 0 }"
                    :disabled="skill.reRolls <= 0"
                    :title="`Trocas restantes: ${skill.reRolls}`"
                    :aria-label="`Trocar ${skill.name} (${skill.reRolls} restantes)`"
                    data-ui-sound="tap"
                    @click="skillStore.refreshSkill(skill)"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span class="sreroll__count">{{ skill.reRolls }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ==================== Overlay ==================== */
.skills {
    position: absolute;
    inset: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    padding: 36px 16px 24px;
    background:
        radial-gradient(ellipse at 50% 45%, rgba(40, 70, 160, 0.45), transparent 65%),
        rgba(6, 8, 22, 0.72);
    color: #fff;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s ease;
}
.skills.is-open {
    opacity: 1;
    pointer-events: auto;
}

.skills__row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: 100%;
    margin: auto 0;
}

.skills__slot {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(420px, 100%);
    perspective: 900px;
    animation: scard-in 0.55s cubic-bezier(0.25, 1.4, 0.5, 1) both;
    animation-delay: calc(var(--i) * 90ms + 80ms);
}

/* ==================== Carta ==================== */
.scard {
    /* Paleta cinza (padrão); as raridades trocam só as variáveis */
    --from: #c9d0db;
    --to: #8e97a6;
    --outline: #3c4352;
    --accent: #eef1f6;
    --glow: transparent;

    --rx: 0deg;
    --ry: 0deg;
    --gx: 50%;
    --gy: 0%;

    position: relative;
    flex: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transform-style: preserve-3d;
    transform: rotateX(var(--rx)) rotateY(var(--ry));
    transition: transform 0.18s ease-out, translate 0.12s ease;
    -webkit-tap-highlight-color: transparent;
}
.scard:active {
    translate: 0 3px;
}

.scard__body {
    position: relative;
    display: grid;
    grid-template-columns: 84px 1fr;
    grid-template-areas:
        'stage info'
        'desc desc';
    column-gap: 10px;
    overflow: hidden;
    padding: 12px 10px 0;
    border-radius: 16px;
    border: 3px solid var(--outline);
    background: linear-gradient(var(--from), var(--to) 75%);
    box-shadow:
        0 6px 0 var(--outline),
        0 10px 18px rgba(0, 0, 0, 0.45),
        0 0 26px var(--glow),
        inset 0 3px 0 rgba(255, 255, 255, 0.45),
        inset 0 -6px 0 rgba(0, 0, 0, 0.12);
    transition: box-shadow 0.15s ease;
}
.scard:active .scard__body {
    box-shadow:
        0 3px 0 var(--outline),
        0 6px 12px rgba(0, 0, 0, 0.4),
        0 0 26px var(--glow),
        inset 0 3px 0 rgba(255, 255, 255, 0.45),
        inset 0 -6px 0 rgba(0, 0, 0, 0.12);
}

/* Brilho oval do canto (igual aos cards da Loja) */
.scard__shine {
    position: absolute;
    z-index: 3;
    top: 7px;
    left: 9px;
    width: 18px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    rotate: -30deg;
    pointer-events: none;
}

/* Reflexo diagonal que atravessa a carta de tempos em tempos */
.scard__sheen {
    position: absolute;
    z-index: 3;
    inset: -20% auto -20% 0;
    width: 38%;
    background: linear-gradient(
        100deg,
        transparent 0%,
        rgba(255, 255, 255, 0) 20%,
        rgba(255, 255, 255, 0.55) 50%,
        rgba(255, 255, 255, 0) 80%,
        transparent 100%
    );
    translate: -160% 0;
    skew: -18deg 0;
    pointer-events: none;
    animation: scard-sheen 3.6s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.35s + 0.8s);
    mix-blend-mode: soft-light;
}

/* Reflexo de "vidro" que segue o ponteiro */
.scard__glare {
    position: absolute;
    z-index: 3;
    inset: 0;
    background: radial-gradient(circle at var(--gx) var(--gy), rgba(255, 255, 255, 0.35), transparent 55%);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
}
.scard:hover .scard__glare {
    opacity: 1;
}

/* Tecla 1/2/3 em losango (mesmo badge dos ícones) */
.scard__key {
    position: absolute;
    z-index: 4;
    top: 6px;
    right: 8px;
}

/* ==================== Tecla de teclado ====================
   Corpo (a "saia" da tecla, mais escura e mais larga embaixo) + topo côncavo mais claro com a legenda.
   Apertar = o topo desce e a saia visível encolhe. */
.keycap {
    --cap-size: 30px;
    --cap-depth: 5px;

    display: block;
    width: var(--cap-size);
    height: calc(var(--cap-size) + var(--cap-depth));
    padding-bottom: var(--cap-depth);
    border-radius: 7px;
    background: linear-gradient(180deg, #9aa2b0 0%, #7d8594 55%, #5f6674 100%);
    box-shadow:
        0 0 0 2px #1d212c,
        0 3px 5px 1px rgba(0, 0, 0, 0.45),
        inset 0 -2px 0 rgba(0, 0, 0, 0.25),
        inset 2px 0 0 rgba(255, 255, 255, 0.12),
        inset -2px 0 0 rgba(0, 0, 0, 0.12);
    transition: padding 0.08s ease, height 0.08s ease, translate 0.08s ease;
}
.keycap__top {
    position: relative;
    display: grid;
    place-items: center;
    height: 100%;
    margin: 0 3px;
    border-radius: 5px 5px 6px 6px;
    /* Topo levemente côncavo: claro no meio, escurecendo nas bordas */
    background:
        radial-gradient(ellipse 70% 60% at 50% 42%, #ffffff 0%, rgba(255, 255, 255, 0) 70%),
        linear-gradient(180deg, #f4f6fa 0%, #dfe3ea 60%, #cfd4dd 100%);
    box-shadow:
        inset 0 1px 0 #fff,
        inset 0 -1px 1px rgba(0, 0, 0, 0.12),
        0 1px 0 rgba(0, 0, 0, 0.18);
}
/* Reflexo no canto do topo */
.keycap__top::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 4px;
    width: 8px;
    height: 3px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    rotate: -20deg;
}
.keycap__top b {
    font: 16px/1 'Lilita One', sans-serif;
    color: #2b303d;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}
.scard:hover .keycap {
    --cap-depth: 2px;
    translate: 0 3px;
}
.scard:active .keycap {
    --cap-depth: 1px;
    translate: 0 4px;
}
/* Atalho de teclado não faz sentido no celular */
@media (hover: none) {
    .scard__key {
        display: none;
    }
}

/* Faixa da raridade pendurada no topo */
.scard__rarity {
    position: absolute;
    z-index: 4;
    top: 0;
    left: 50%;
    translate: -50% 0;
    padding: 2px 12px 3px;
    border-radius: 0 0 10px 10px;
    background: var(--outline);
    font: 11px/1 'Lilita One', sans-serif;
    letter-spacing: 0.5px;
    color: var(--accent);
    text-transform: uppercase;
    white-space: nowrap;
}

/* Ícone */
.scard__stage {
    grid-area: stage;
    position: relative;
    display: grid;
    place-items: center;
    align-self: center;
    padding: 6px 0;
    transform: translateZ(30px);
}
.scard__icon {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    animation: scard-float 2.8s ease-in-out infinite;
    animation-delay: calc(var(--i) * -0.9s);
}

/* Raios girando atrás do ícone (épica e lendária) */
.scard__rays {
    position: absolute;
    inset: -30%;
    display: none;
    background: repeating-conic-gradient(from 0deg, rgba(255, 255, 255, 0.4) 0deg 10deg, transparent 10deg 30deg);
    -webkit-mask: radial-gradient(circle, #000 20%, transparent 68%);
    mask: radial-gradient(circle, #000 20%, transparent 68%);
    animation: scard-spin 9s linear infinite;
    pointer-events: none;
}
.scard.is-purple .scard__rays,
.scard.is-orange .scard__rays {
    display: block;
}

.scard__info {
    grid-area: info;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    padding: 8px 22px 6px 0;
    transform: translateZ(20px);
}
.scard__name {
    font: 21px/1.05 'Lilita One', sans-serif;
    -webkit-text-stroke: 5px var(--outline);
    paint-order: stroke fill;
}
.scard__level {
    padding: 3px 9px;
    border-radius: 999px;
    background: rgba(10, 14, 36, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.35);
    font: 12px/1 'Lilita One', sans-serif;
    white-space: nowrap;
}
.scard__level.is-new {
    background: linear-gradient(#6ff06a, #2fb52a);
    border: 2px solid #135c10;
    color: #0e3f0b;
}

/* Rodapé claro com o efeito (igual à área de preço dos cards da Loja) */
.scard__desc {
    grid-area: desc;
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: 8px -10px 0;
    padding: 8px 12px 10px;
    background: linear-gradient(#eef6ff, #c9dcf3);
    border-top: 2px solid rgba(0, 0, 0, 0.18);
    transform: translateZ(10px);
}
.scard__effect {
    font: 16px/1.15 'Lilita One', sans-serif;
    letter-spacing: 0.3px;
    color: #fff;
    -webkit-text-stroke: 3px #1c3a78;
    paint-order: stroke fill;
}
.scard__text {
    font: 12px/1.25 'Fredoka One', sans-serif;
    color: #3a4a6b;
}

/* ==================== Raridades ==================== */
.scard.is-green {
    --from: #7fe46a;
    --to: #34a526;
    --outline: #1f5f19;
    --accent: #d6ffc9;
}
.scard.is-blue {
    --from: #5fb8ff;
    --to: #2a74db;
    --outline: #173f7d;
    --accent: #d4ecff;
}
.scard.is-purple {
    --from: #d07cff;
    --to: #8a32cf;
    --outline: #3f1470;
    --accent: #f3d9ff;
    --glow: rgba(200, 110, 255, 0.45);
}
.scard.is-orange {
    --from: #ffd257;
    --to: #f08a14;
    --outline: #7a4006;
    --accent: #fff0c0;
    --glow: rgba(255, 196, 80, 0.6);
}

/* ==================== Botão de troca ==================== */
.sreroll {
    position: relative;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    padding: 0;
    border-radius: 50%;
    border: 3px solid #134a91;
    background: linear-gradient(#6cc2ff, #2a7ee0);
    box-shadow: 0 4px 0 #134a91, inset 0 2px 0 rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: translate 0.12s ease, box-shadow 0.12s ease, opacity 0.2s ease;
}
.sreroll:active {
    translate: 0 3px;
    box-shadow: 0 1px 0 #134a91, inset 0 2px 0 rgba(255, 255, 255, 0.5);
}
.sreroll svg {
    width: 24px;
    fill: none;
    stroke: #fff;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 1.5px 0 #134a91);
}
.sreroll__count {
    position: absolute;
    right: -6px;
    bottom: -4px;
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 4px;
    border-radius: 999px;
    background: radial-gradient(circle at 40% 35%, #fff6c4, #ffd34d 70%);
    border: 2px solid #9a6b00;
    color: #7a4a00;
    font: 12px/1 'Lilita One', sans-serif;
}
.sreroll.is-hidden {
    opacity: 0;
    pointer-events: none;
}

/* ==================== Telas largas: cartas em pé lado a lado ==================== */
@media (min-width: 640px) {
    .skills {
        justify-content: center;
    }
    .skills__row {
        flex-direction: row;
        align-items: stretch;
        justify-content: center;
        gap: 22px;
        margin: 0;
    }
    .skills__slot {
        flex-direction: column;
        width: 250px;
        gap: 14px;
    }
    .scard {
        width: 100%;
        display: flex;
    }
    .scard__body {
        width: 100%;
        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr;
        grid-template-areas:
            'stage'
            'info'
            'desc';
        padding: 26px 14px 0;
    }
    .scard__stage {
        width: 58%;
        justify-self: center;
        padding: 10px 0 4px;
    }
    .scard__info {
        align-items: center;
        text-align: center;
        padding: 8px 0 4px;
    }
    .scard__name {
        font-size: 23px;
    }
    .scard__desc {
        margin: 10px -14px 0;
        padding: 12px 14px 16px;
        text-align: center;
    }
    .scard__effect {
        font-size: 18px;
    }
    .scard__text {
        font-size: 13px;
    }
    .scard__key {
        top: 10px;
        right: 12px;
    }
    .keycap {
        --cap-size: 34px;
    }
    .keycap__top b {
        font-size: 18px;
    }
}

@media (min-width: 1024px) {
    .skills__slot {
        width: 280px;
    }
}

/* ==================== Animações ==================== */
@keyframes scard-in {
    0% {
        opacity: 0;
        transform: translateY(40px) rotateX(-70deg) scale(0.8);
    }
    100% {
        opacity: 1;
        transform: none;
    }
}
@keyframes scard-sheen {
    0%,
    55% {
        translate: -160% 0;
    }
    100% {
        translate: 360% 0;
    }
}
@keyframes scard-float {
    0%,
    100% {
        translate: 0 0;
    }
    50% {
        translate: 0 -4px;
    }
}
@keyframes scard-spin {
    to {
        rotate: 360deg;
    }
}

@media (prefers-reduced-motion: reduce) {
    .skills__slot,
    .scard__sheen,
    .scard__icon,
    .scard__rays {
        animation: none;
    }
}
</style>
