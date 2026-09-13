import { defineStore } from 'pinia';
import { TALENTS } from '~/data/talents';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useLevelAccount } from '~/composables/useLevelAccount';
import {
  activeTalentSet,
  aggregateTalentBonuses,
  countDraws,
  drawRng,
  drawStatus,
  pickTalent,
  requiredLevelForDraw,
  sanitizeTalentStars,
  talentDrawCost,
  type TalentStars,
} from '~/utils/talents';

const STORAGE_KEY = 'talentProgress';
const STORAGE_VERSION = 1;

const newSeed = () => Math.floor(Math.random() * 2 ** 32);

// Carrega o progresso salvo ou começa do zero com uma semente nova
function loadProgress() {
  if (import.meta.server) {
    return { seed: 0, stars: {} as TalentStars, fresh: false };
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved?.version === STORAGE_VERSION && Number.isInteger(saved.seed)) {
      return { seed: saved.seed >>> 0, stars: sanitizeTalentStars(saved.stars), fresh: false };
    }
  } catch (error) {
    console.error('Failed to parse talent progress from localStorage:', error);
  }

  return { seed: newSeed(), stars: {} as TalentStars, fresh: true };
}

/**
 * Cartas de talento: progresso persistente, sorteio pago e bônus prontos para o jogo.
 * O jogo pode ler `bonuses` (e usar applyTalentBonuses de ~/utils/talents).
 */
export const useTalentStore = defineStore('talents', () => {
  const currentRunStore = useCurrentRunStore();
  const levelAccount = useLevelAccount();

  const initial = loadProgress();
  const seed = ref(initial.seed);
  const stars = ref<TalentStars>(initial.stars);

  function save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, seed: seed.value, stars: stars.value }),
    );
  }

  // Grava a semente nova já no início, para ela não mudar a cada recarga
  if (initial.fresh) save();

  const ownedEntries = computed(() =>
    TALENTS.filter(talent => (stars.value[talent.id] ?? 0) > 0).map(talent => ({
      talent,
      stars: stars.value[talent.id]!,
    })),
  );
  const lockedCount = computed(() => TALENTS.length - ownedEntries.value.length);

  const drawCount = computed(() => countDraws(stars.value));
  const drawCost = computed(() => talentDrawCost(drawCount.value));
  const requiredLevel = computed(() => requiredLevelForDraw(drawCount.value));
  const activeSet = computed(() => activeTalentSet(stars.value));

  const level = computed(() => levelAccount.getLevelAccount());
  const gold = computed(() => Number(currentRunStore.totalGold) || 0);
  const status = computed(() => drawStatus({ stars: stars.value, level: level.value, gold: gold.value }));

  /** Soma dos bônus de todas as cartas obtidas (para o jogo usar) */
  const bonuses = computed(() => aggregateTalentBonuses(stars.value));

  /** Compra um sorteio: cobra o ouro, dá +1 estrela e salva. Retorna null se não puder. */
  function draw() {
    if (status.value !== 'ok') return null;

    const cost = drawCost.value;
    const talent = pickTalent(stars.value, drawRng(seed.value, drawCount.value));
    if (!talent || !currentRunStore.spendGold(cost)) return null;

    const talentStars = (stars.value[talent.id] ?? 0) + 1;
    stars.value = { ...stars.value, [talent.id]: talentStars };
    save();

    return { talent, stars: talentStars, isNew: talentStars === 1 };
  }

  function resetTalents() {
    seed.value = newSeed();
    stars.value = {};
    save();
  }

  if (import.meta.client) {
    (window as unknown as { resetTalents: () => void }).resetTalents = resetTalents;
  }

  return {
    stars,
    seed,
    ownedEntries,
    lockedCount,
    drawCount,
    drawCost,
    requiredLevel,
    activeSet,
    level,
    gold,
    status,
    bonuses,
    draw,
    resetTalents,
  };
});
