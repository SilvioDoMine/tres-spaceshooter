<script setup lang="ts">
// Ícone de uma recompensa "equipamento aleatório" (~/data/randomEquipment), já com tooltip.
// Um só componente para marcos de capítulo, missões e fim de partida não repetirem essa montagem.
//
// A moldura mostra a raridade que vai sair, o losango "?" lembra que a peça ainda é sorteio e o miolo
// mostra a silhueta do slot quando ele é fixo ("Arma Aleatória") ou o emblema genérico quando é livre.
// A silhueta vem de LobbyEquipmentItemIcon, que já desenha um mini-ícone por slot.
//
// A silhueta é clara, não tingida pela raridade: quem carrega a cor é a moldura, e uma peça verde
// em cima de moldura verde sumia.
import { sanitizeDrop, type RandomEquipmentDrop } from '~/data/randomEquipment';

const props = withDefaults(
  defineProps<{
    drop: RandomEquipmentDrop;
    size?: 'sm' | 'md' | 'lg';
    /** Quantidade no canto (para "2x Arma Aleatória" e afins) */
    quantity?: number | string;
    /** Não aplica o realce de hover do tooltip (quem envolve já tem o seu) */
    noHighlight?: boolean;
  }>(),
  { size: 'sm', quantity: '', noHighlight: true },
);

const drop = computed(() => sanitizeDrop(props.drop) ?? { slot: 'any' as const, rarity: 'gray' as const });
</script>

<template>
  <BaseItemTooltip :drop="drop" :no-highlight="noHighlight">
    <BaseAbilityIcon :rarity="drop.rarity" :size="size" :quantity="`${quantity}`" badge="?" :clickable="false">
      <span v-if="drop.slot === 'any'" class="rdrop__art">
        <SvgEquipmentIcon />
      </span>
      <span v-else class="rdrop__art rdrop__art--slot">
        <LobbyEquipmentItemIcon :slot="drop.slot" />
      </span>
    </BaseAbilityIcon>
  </BaseItemTooltip>
</template>

<style scoped>
/* A moldura é quadrada e usa container queries: o miolo acompanha o tamanho dela em vez de um px fixo */
.rdrop__art {
  display: block;
  width: 58%;
  margin-inline: auto;
}
.rdrop__art :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
/* Silhueta do slot: clara, com o contorno escuro e o apoio sólido do resto da UI */
.rdrop__art--slot {
  color: #eef3fb;
}
.rdrop__art--slot :deep(svg) {
  filter:
    drop-shadow(0 0 1.5px rgba(12, 18, 36, 0.9))
    drop-shadow(0 0 1.5px rgba(12, 18, 36, 0.9))
    drop-shadow(0 2px 0 rgba(12, 18, 36, 0.55));
}
</style>
