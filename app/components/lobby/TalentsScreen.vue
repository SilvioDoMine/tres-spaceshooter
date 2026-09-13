<script setup lang="ts">
import { useTalentStore } from '~/stores/useTalentStore';

// Progresso, custo, limite por nível e sorteio vêm da store (salva no localStorage e cobra ouro).
const talentStore = useTalentStore();

const detailOpen = ref(false);
const detailIndex = ref(0);
const statsOpen = ref(false);
const newTalentId = ref<string | null>(null);
const upgradedTalentId = ref<string | null>(null);

function openDetail(index: number) {
  newTalentId.value = null;
  upgradedTalentId.value = null;
  detailIndex.value = index;
  detailOpen.value = true;
}

function draw() {
  const result = talentStore.draw();
  if (!result) return;

  detailIndex.value = talentStore.ownedEntries.findIndex(entry => entry.talent.id === result.talent.id);
  newTalentId.value = result.isNew ? result.talent.id : null;
  upgradedTalentId.value = result.isNew ? null : result.talent.id;
  detailOpen.value = true;
}
</script>

<template>
  <LobbyScreen title="Cartas de Talento" theme="purple">
    <template #header-start>
      <button type="button" class="talents__info" aria-label="Detalhes dos talentos" @click="statsOpen = true"></button>
    </template>

    <div class="talents__grid">
      <button
        v-for="(entry, index) in talentStore.ownedEntries"
        :key="entry.talent.id"
        type="button"
        class="talents__slot"
        :aria-label="`${entry.talent.name}, ${entry.stars} estrelas`"
        @click="openDetail(index)"
      >
        <LobbyTalentsCard :talent="entry.talent" :stars="entry.stars" />
      </button>
      <div v-for="n in talentStore.lockedCount" :key="`locked-${n}`" class="talents__slot is-locked">
        <LobbyTalentsCard />
      </div>
    </div>

    <!-- Os modais usam Teleport; ficam aqui dentro para a tela ter uma raiz só (a transição de aba precisa) -->
    <LobbyTalentsDetailModal
      v-model:index="detailIndex"
      :open="detailOpen"
      :entries="talentStore.ownedEntries"
      :new-talent-id="newTalentId"
      :upgraded-talent-id="upgradedTalentId"
      @close="detailOpen = false"
    />
    <LobbyTalentsStatsModal :open="statsOpen" :bonuses="talentStore.bonuses" @close="statsOpen = false" />

    <template #footer>
      <LobbyTalentsDrawBar
        :status="talentStore.status"
        :cost="talentStore.drawCost"
        :required-level="talentStore.requiredLevel"
        @draw="draw"
      />
    </template>
  </LobbyScreen>
</template>

<style scoped>
.talents__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:26px 12px;max-width:620px;margin:0 auto;padding:24px 0 8px}
.talents__slot{display:block;padding:0;background:none;border:0;cursor:pointer;transition:scale .15s ease}
.talents__slot:active{scale:.95}
.talents__slot.is-locked{cursor:default}
.talents__slot.is-locked:active{scale:1}
/* Aba colada na borda esquerda, como na referência */
.talents__info{display:flex;align-items:center;justify-content:flex-end;width:48px;height:38px;padding:0 5px 0 0;border:0;border-radius:0 999px 999px 0;background:#15122b;box-shadow:0 3px 0 rgba(0,0,0,.35);cursor:pointer}
.talents__info::before{content:'i';display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#fff;color:#15122b;font:18px/1 'Lilita One',sans-serif}
@media(min-width:900px){.talents__grid{grid-template-columns:repeat(5,minmax(0,1fr));max-width:760px;gap:30px 16px}}
@media(max-width:400px){.talents__grid{gap:22px 8px}}
@media(max-height:500px) and (orientation:landscape){.talents__grid{grid-template-columns:repeat(8,minmax(0,1fr));max-width:none;gap:18px 8px;padding-top:12px}}
</style>
