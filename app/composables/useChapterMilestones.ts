import type { OwnedEquipment } from '~/utils/equipment';
import { useCash } from '~/composables/useCash';
import { useLevelAccount } from '~/composables/useLevelAccount';
import { useChapterProgressStore } from '~/stores/useChapterProgressStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useEquipmentStore } from '~/stores/useEquipmentStore';
import { useShopStore } from '~/stores/useShopStore';
import { allMilestones, currentMilestoneIndex, hasClaimableMilestone, milestoneState } from '~/utils/chapterMilestones';

export type MilestoneState = 'claimed' | 'claimable' | 'locked';

/** Recompensas já entregues, no formato que o LobbyRewardsModal espera */
export interface ClaimedRewards {
  gold: number;
  exp: number;
  cash: number;
  keys: { silver: number; obsidian: number };
  equipment: OwnedEquipment[];
}

/**
 * Marcos de conclusão de sala: a lista completa (todos os capítulos, em ordem), o marco em foco
 * e o resgate. O jogador resgata um marco por vez, sempre o mais antigo pendente.
 */
export function useChapterMilestones() {
  const chapterProgress = useChapterProgressStore();
  const catalog = allMilestones();

  const milestones = computed(() =>
    catalog.map(milestone => ({ ...milestone, state: milestoneState(chapterProgress.progress, milestone) as MilestoneState })),
  );

  const currentIndex = computed(() => currentMilestoneIndex(chapterProgress.progress, catalog));
  const current = computed(() => milestones.value[currentIndex.value] ?? null);
  const hasClaimable = computed(() => hasClaimableMilestone(chapterProgress.progress, catalog));
  const allClaimed = computed(() => milestones.value.every(milestone => milestone.state === 'claimed'));

  /** Salas limpas no capítulo do marco em foco (para o texto "faltam N salas") */
  const currentCleared = computed(() => Number(chapterProgress.clearedRooms[current.value?.chapter ?? 0]) || 0);

  /**
   * Resgata o marco em foco. Entrega cada recompensa pela API da moeda correspondente e só então
   * marca como resgatado. Devolve o que foi entregue (ou null se não havia nada a resgatar).
   */
  function claim(): ClaimedRewards | null {
    const milestone = current.value;
    if (!milestone || milestone.state !== 'claimable') return null;

    const { rewards } = milestone;
    const claimed: ClaimedRewards = {
      gold: rewards.gold,
      exp: rewards.exp,
      cash: rewards.cash,
      keys: { ...rewards.keys },
      equipment: [],
    };

    if (rewards.gold > 0) useCurrentRunStore().addPersistentGold(rewards.gold);
    if (rewards.cash > 0) useCash().addCash(rewards.cash);
    if (rewards.exp > 0) useLevelAccount().addExp(rewards.exp);

    const shop = useShopStore();
    for (const [type, amount] of Object.entries(rewards.keys)) {
      if (amount > 0) shop.addKeys(type as 'silver' | 'obsidian', amount);
    }

    // Os sorteios viram peças de verdade só agora (slot fixo ou livre, ver ~/data/randomEquipment)
    claimed.equipment = useEquipmentStore().grantDrops(rewards.equipmentDrops);

    chapterProgress.markMilestoneClaimed(milestone.key);
    return claimed;
  }

  return { milestones, currentIndex, current, currentCleared, hasClaimable, allClaimed, claim };
}
