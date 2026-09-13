<script setup lang="ts">
import { EQUIPMENT_RARITIES } from '~/data/equipment';
import { CHESTS, type ChestType } from '~/data/shop';
import { useShopStore } from '~/stores/useShopStore';
import { chestDropTable, pityRemaining } from '~/utils/shop';

// (i) do baú: todos os itens que dropam, por raridade, com a chance de cada um e a regra do garantido.
const props = defineProps<{ type: ChestType | null }>();
defineEmits<{ close: [] }>();

const shop = useShopStore();
const chest = computed(() => (props.type ? CHESTS[props.type] : null));
const table = computed(() => (chest.value ? chestDropTable(chest.value) : []));
const pityRarity = computed(() => (chest.value ? EQUIPMENT_RARITIES[chest.value.pity.rarity] : null));
const remaining = computed(() => (chest.value && props.type ? pityRemaining(chest.value, shop.pity(props.type)) : 0));

const percent = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
</script>

<template>
  <LobbyShopDialog :open="!!chest" :title="chest?.name ?? ''" width="440px" @close="$emit('close')">
    <template v-if="chest && pityRarity">
      <section v-for="row in table" :key="row.rarity" class="drop">
        <header class="drop__header">
          <span class="drop__rarity" :style="{ color: EQUIPMENT_RARITIES[row.rarity].color }">
            Equipamento<br />{{ EQUIPMENT_RARITIES[row.rarity].label }}
          </span>
          <span class="drop__total">Chance total de {{ percent(row.percent) }}</span>
        </header>
        <div class="drop__grid">
          <div v-for="defId in row.items" :key="defId" class="drop__item">
            <LobbyEquipmentItemCard :item="{ uid: 0, defId, rarity: row.rarity }" />
            <span>{{ percent(row.itemPercent) }}</span>
          </div>
        </div>
      </section>

      <p class="drop__note">
        A cada {{ chest.pity.every }} aberturas sem um equipamento
        <b :style="{ color: pityRarity.color }">{{ pityRarity.label }}</b>, a próxima é garantida. O contador volta ao
        zero sempre que ele sai. Faltam <b>{{ remaining }}</b> para o garantido. Quando o prêmio garantido é
        acionado, todas as chances de queda de itens da raridade se igualam.
      </p>
    </template>
  </LobbyShopDialog>
</template>

<style scoped>
.drop + .drop {
  margin-top: 14px;
}
.drop__header {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  border-radius: 8px;
  background: #e4d2b3;
}
.drop__rarity {
  flex-shrink: 0;
  padding: 4px 18px 4px 10px;
  background: #2f2418;
  clip-path: polygon(0 0, 100% 0, 86% 100%, 0 100%);
  font: 14px/1.1 'Lilita One', sans-serif;
}
.drop__total {
  display: grid;
  place-items: center;
  flex: 1;
  padding: 4px 8px;
  font: 15px/1.15 'Lilita One', sans-serif;
  color: #4a3420;
  text-align: center;
}
.drop__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(58px, 1fr));
  gap: 8px;
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #efe2c6;
  border: 1px solid #d9c29a;
}
.drop__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font: 12px/1 'Lilita One', sans-serif;
  color: #4a3420;
}
.drop__note {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #efe2c6;
  font: 14px/1.35 'Lilita One', sans-serif;
  color: #8a5a2c;
  text-align: center;
}
</style>
