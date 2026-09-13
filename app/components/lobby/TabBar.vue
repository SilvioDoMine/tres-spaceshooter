<script setup lang="ts">
// Barra de abas do rodapé do lobby (estilo Archero): a aba ativa fica amarela, mais larga e com nome.
type LobbyTab = 'shop' | 'equipment' | 'chapters' | 'talents';

/** badges: abas com ação pendente (mostra o "!") */
defineProps<{ modelValue: LobbyTab; badges?: Partial<Record<LobbyTab, boolean>> }>();
defineEmits<{ 'update:modelValue': [tab: LobbyTab] }>();

const tabs: { id: LobbyTab; label: string }[] = [
  { id: 'shop', label: 'Loja' },
  { id: 'equipment', label: 'Equipamento' },
  { id: 'chapters', label: 'Capítulos' },
  { id: 'talents', label: 'Talentos' },
];
</script>

<template>
  <nav class="tabbar pointer-events-auto" aria-label="Navegação do lobby">
    <div class="tabbar__inner">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        data-ui-sound="tab"
        class="tab"
        :class="{ 'is-active': modelValue === tab.id }"
        :aria-label="tab.label"
        :aria-current="modelValue === tab.id ? 'page' : undefined"
        @click="$emit('update:modelValue', tab.id)"
      >
        <SvgShopIcon v-if="tab.id === 'shop'" class="tab__icon" />
        <SvgEquipmentIcon v-else-if="tab.id === 'equipment'" class="tab__icon" />
        <SvgChaptersIcon v-else-if="tab.id === 'chapters'" class="tab__icon" />
        <SvgTalentIcon v-else class="tab__icon" />
        <span v-if="badges?.[tab.id]" class="tab__badge" aria-label="Ação pendente"><BaseNotification /></span>
        <span class="tab__label">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tabbar{position:absolute;left:0;right:0;bottom:0;z-index:30;height:72px;display:flex;justify-content:center;background:linear-gradient(#222c47,#141b2e);border-top:3px solid #34425f;box-shadow:0 -4px 16px rgba(0,0,0,.4)}
.tabbar__inner{display:flex;width:100%;max-width:560px;height:100%}
.tab{position:relative;flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;background:none;border:0;cursor:pointer;transition:flex-grow .3s ease;-webkit-tap-highlight-color:transparent}
.tab::before{content:'';position:absolute;inset:-12px 3px 0;border-radius:16px 16px 0 0;background:linear-gradient(#fff3a8,#ffd24a 45%,#f5b400);box-shadow:inset 0 3px #fffbe0;opacity:0;translate:0 14px;transition:opacity .3s ease,translate .3s ease}
.tab__icon{position:relative;width:40px;height:40px;filter:drop-shadow(0 3px 0 rgba(0,0,0,.35));transition:translate .3s ease,scale .3s ease}
.tab__label{position:absolute;bottom:5px;left:0;right:0;text-align:center;font:15px 'Lilita One',sans-serif;color:#6b3a08;white-space:nowrap;opacity:0;translate:0 8px;transition:opacity .3s ease,translate .3s ease}
/* "!" no canto superior direito do ícone; acompanha o ícone quando a aba fica ativa */
.tab__badge{position:absolute;top:8px;left:calc(50% + 8px);width:20px;height:20px;scale:1.25;pointer-events:none;transition:translate .3s ease}
.tab.is-active .tab__badge{translate:6px -20px}
.tab.is-active{flex-grow:1.7}
.tab.is-active::before{opacity:1;translate:0 0}
.tab.is-active .tab__icon{translate:0 -14px;scale:1.3}
.tab.is-active .tab__label{opacity:1;translate:0 0}
@media(hover:hover){.tab:not(.is-active):hover .tab__icon{scale:1.1}}
@media(max-height:500px) and (orientation:landscape){
 .tabbar{height:56px}.tab__icon{width:32px;height:32px}.tab.is-active .tab__icon{translate:0 -10px;scale:1.2}.tab__label{font-size:12px;bottom:3px}
}
</style>
