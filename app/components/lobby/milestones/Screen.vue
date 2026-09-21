<script setup lang="ts">
import { keyItemId } from '~/data/items';
import { useChapterMilestones } from '~/composables/useChapterMilestones';

const emit = defineEmits<{ back: []; openRewards: [rewards: unknown] }>();

const { milestones, currentIndex, current, currentCleared, allClaimed, claim } = useChapterMilestones();

// Quantos marcos aparecem de cada lado: o trilho ocupa a largura toda, então a fila é montada com
// vizinhos suficientes para transbordar as bordas — continua sem navegação, os vizinhos só mostram
// que há mais marcos antes e depois. `main` é a largura do escudo grande (Shield.vue) e `side` a do
// slot dos vizinhos (`--side-w` do trilho); ambos espelham o CSS de cada faixa de tela.
const LAYOUTS = {
  base: { main: 168, side: 116, gap: 36 },
  narrow: { main: 148, side: 100, gap: 26 },
  shortLandscape: { main: 90, side: 84, gap: 16 },
};

const sideCount = ref(1);
function updateSideCount() {
  const { innerWidth: w, innerHeight: h } = window;
  // Paisagem baixa divide a tela em duas colunas: o trilho só tem metade da largura para preencher
  const shortLandscape = h <= 560 && w > h;
  const { main, side, gap } = shortLandscape ? LAYOUTS.shortLandscape : w <= 479 ? LAYOUTS.narrow : LAYOUTS.base;
  const rail = shortLandscape ? w / 2 - 12 : w;
  // Arredonda para cima para a fila sempre passar das bordas e ser cortada pelo `overflow: hidden`
  sideCount.value = Math.max(1, Math.ceil((rail - main) / (2 * (side + gap))));
}

// Slots de tamanho fixo (vazios nas pontas da lista) para o marco atual ficar sempre no centro
const slotsAt = (start: number) =>
  Array.from({ length: sideCount.value }, (_, i) => milestones.value[start + i] ?? null);
const before = computed(() => slotsAt(currentIndex.value - sideCount.value));
const after = computed(() => slotsAt(currentIndex.value + 1));

const rewards = computed(() => current.value?.rewards ?? null);
const keyEntries = computed(() =>
  Object.entries(rewards.value?.keys ?? {}).filter(([, amount]) => Number(amount) > 0) as ['silver' | 'obsidian', number][],
);

const canClaim = computed(() => current.value?.state === 'claimable');
const missingRooms = computed(() => Math.max(0, (current.value?.room ?? 0) - currentCleared.value));

function handleClaim() {
  const claimed = claim();
  if (claimed) emit('openRewards', claimed);
}

// Esc fecha a tela, mas nunca por cima de um modal aberto (mesmo tratamento do Mecânico)
function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return;
  event.stopImmediatePropagation();
  emit('back');
}

onMounted(() => {
  updateSideCount();
  window.addEventListener('resize', updateSideCount);
  window.addEventListener('keydown', onKey, true);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSideCount);
  window.removeEventListener('keydown', onKey, true);
});
</script>

<template>
  <section class="ms" aria-label="Recompensas de conclusão de sala">
    <div class="ms__head">
      <BaseRibbonTitle text="Recompensas de Conclusão" variant="yellow" />
    </div>

    <div class="ms__body">
      <!-- Carrossel travado no marco atual: os vizinhos só mostram que a fila continua -->
      <Transition name="ms-advance" mode="out-in">
        <div :key="current?.key ?? 'empty'" class="ms__rail">
          <div v-for="(milestone, i) in before" :key="milestone?.key ?? `before-${i}`" class="ms__slot is-side" aria-hidden="true">
            <LobbyMilestonesShield v-if="milestone" :chapter="milestone.chapter" :room="milestone.room" :state="milestone.state" size="sm" />
          </div>

          <div class="ms__slot is-main">
            <LobbyMilestonesShield v-if="current" :chapter="current.chapter" :room="current.room" :state="current.state" size="lg" />
          </div>

          <div v-for="(milestone, i) in after" :key="milestone?.key ?? `after-${i}`" class="ms__slot is-side" aria-hidden="true">
            <LobbyMilestonesShield v-if="milestone" :chapter="milestone.chapter" :room="milestone.room" :state="milestone.state" size="sm" />
          </div>
        </div>
      </Transition>

      <div class="ms__panel allow-scroll">
        <div class="ms__divider">
          <BaseSectionDivider text="Recompensas" />
        </div>

        <div v-if="rewards" class="ms__rewards">
          <BaseItemTooltip v-if="rewards.gold > 0" resource="gold" no-highlight>
            <BaseAbilityIcon rarity="gray" size="sm" :quantity="`${rewards.gold}`">
              <SvgCoinIcon :size="25" />
            </BaseAbilityIcon>
          </BaseItemTooltip>

          <BaseItemTooltip v-if="rewards.cash > 0" resource="gems" no-highlight>
            <BaseAbilityIcon rarity="gray" size="sm" :quantity="`${rewards.cash}`">
              <SvgGemIcon :size="25" />
            </BaseAbilityIcon>
          </BaseItemTooltip>

          <BaseItemTooltip v-if="rewards.exp > 0" resource="exp" no-highlight>
            <BaseAbilityIcon rarity="gray" size="sm" :quantity="`${rewards.exp}`">
              <SvgExpIcon :size="25" />
            </BaseAbilityIcon>
          </BaseItemTooltip>

          <BaseItemTooltip v-for="[type, amount] in keyEntries" :key="`key-${type}`" :resource="keyItemId(type)" no-highlight>
            <BaseAbilityIcon rarity="gray" size="sm" :quantity="`${amount}`">
              <SvgKeyIcon :size="30" :type="type" />
            </BaseAbilityIcon>
          </BaseItemTooltip>

          <!-- Item ainda não sorteado: mostra só a moldura da raridade que vai sair -->
          <BaseAbilityIcon v-for="(rarity, i) in rewards.equipmentRarities" :key="`eq-${i}`" :rarity="rarity" size="sm">
            <SvgEquipmentIcon :size="28" />
          </BaseAbilityIcon>
        </div>

        <div class="ms__cta">
          <BaseButton v-if="!allClaimed" variant="yellow" size="lg" :disabled="!canClaim" data-ui-sound="confirm" @click="handleClaim">
            RESGATAR
          </BaseButton>
          <p v-if="allClaimed" class="ms__hint">Todos os marcos resgatados. Novos capítulos trazem novos marcos.</p>
          <p v-else-if="!canClaim && current" class="ms__hint">
            Conclua a sala {{ current.room }} do Capítulo {{ current.chapter }}
            <span v-if="missingRooms > 0">— faltam {{ missingRooms }} {{ missingRooms === 1 ? 'sala' : 'salas' }}</span>
          </p>
        </div>
      </div>
    </div>

    <div class="ms__footer">
      <button type="button" class="ms__back" aria-label="Voltar" data-ui-sound="tap" @click="emit('back')">
        <svg viewBox="0 0 40 24" aria-hidden="true"><path d="M14 2 2 12l12 10v-6h24V8H14z" /></svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Mesma caixa das outras telas do lobby: por baixo da topbar e acima da barra de abas, que continua usável */
.ms {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 72px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  pointer-events: auto;
  background:
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.015) 0 22px, rgba(0, 0, 0, 0.02) 22px 44px),
    linear-gradient(#3d4870 0%, #333c63 45%, #272e4e 100%);
}

.ms__head {
  flex-shrink: 0;
  width: 100%;
  padding: 82px 12px 0;
  display: flex;
  justify-content: center;
}

.ms__body {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

/* Trilho na largura inteira: o script monta vizinhos suficientes para a fila passar das bordas,
   que cortam os das pontas e mostram que a fila continua. */
.ms__rail {
  --side-w: 116px;
  --gap: 36px;

  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap);
  width: 100%;
  padding: 8px 0;
  overflow: hidden;
}
.ms__slot {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}
.ms__slot.is-side {
  width: var(--side-w);
}

.ms__panel {
  width: 100%;
  max-width: 480px;
  padding: 0 16px;
}

.ms__rewards {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 72px;
  padding: 6px 0 4px;
}

.ms__cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}
.ms__hint {
  margin: 0;
  max-width: 320px;
  text-align: center;
  font: 14px/1.3 'Lilita One', sans-serif;
  color: rgba(255, 255, 255, 0.72);
  text-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
}

.ms__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background: linear-gradient(rgba(39, 46, 78, 0), #222848 45%);
  pointer-events: none;
}
.ms__back {
  width: 64px;
  height: 44px;
  padding: 6px 10px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  pointer-events: auto;
}
.ms__back svg {
  width: 100%;
  height: 100%;
  fill: #fff;
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.5));
}

/* Avanço depois do resgate: o marco resgatado sai pela esquerda e o próximo entra pela direita */
.ms-advance-enter-active,
.ms-advance-leave-active {
  transition: translate 0.25s ease, opacity 0.25s ease;
}
.ms-advance-enter-from {
  translate: 60px 0;
  opacity: 0;
}
.ms-advance-leave-to {
  translate: -60px 0;
  opacity: 0;
}

@media (max-width: 479px) {
  .ms__rail {
    --side-w: 100px;
    --gap: 26px;
  }
}

/* Paisagem baixa: a altura é curta e a largura sobra, então carrossel e recompensas ficam lado a lado */
@media (max-height: 560px) and (orientation: landscape) {
  .ms {
    bottom: 56px;
  }
  .ms__head {
    padding-top: 62px;
  }
  .ms__body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 8px;
    padding: 0 8px 36px;
  }
  .ms__rail {
    --side-w: 84px;
    --gap: 16px;
    padding: 0;
  }
  .ms__panel {
    padding: 0 8px;
  }
  .ms__divider :deep(> div) {
    margin-top: 0;
    padding-block: 2px;
  }
  .ms__rewards {
    gap: 8px;
    min-height: 0;
    padding: 0;
  }
  .ms__cta {
    margin-top: 10px;
  }
  .ms__back {
    width: 54px;
    height: 36px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ms-advance-enter-active,
  .ms-advance-leave-active {
    transition: none;
  }
}
</style>
