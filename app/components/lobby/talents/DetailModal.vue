<script setup lang="ts">
import { TALENT_RARITIES, formatTalentEffect, type TalentDefinition } from '~/data/talents';

// Carta aberta em destaque, com setas para passar entre os talentos obtidos.
const props = defineProps<{
  open: boolean;
  entries: { talent: TalentDefinition; stars: number }[];
  index: number;
  newTalentId?: string | null;
}>();
const emit = defineEmits<{ close: []; 'update:index': [index: number] }>();

const entry = computed(() => props.entries[props.index]);

function go(step: number) {
  const total = props.entries.length;
  if (total < 2) return;
  emit('update:index', (props.index + step + total) % total);
}

// Captura no window para o Esc/setas não chegarem ao lobby (que troca de aba/capítulo)
function onKey(event: KeyboardEvent) {
  if (!props.open) return;
  const actions: Record<string, () => void> = {
    Escape: () => emit('close'),
    ArrowLeft: () => go(-1),
    ArrowRight: () => go(1),
  };
  const action = actions[event.key];
  if (!action) return;
  event.stopImmediatePropagation();
  action();
}

onMounted(() => window.addEventListener('keydown', onKey, true));
onUnmounted(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <Teleport to="body">
    <Transition name="tmodal">
      <div
        v-if="open && entry"
        class="tmodal"
        role="dialog"
        aria-modal="true"
        :aria-label="entry.talent.name"
        @click="emit('close')"
      >
        <button v-if="entries.length > 1" type="button" class="tmodal__arrow tmodal__arrow--prev" aria-label="Talento anterior" @click.stop="go(-1)">
          <svg viewBox="0 0 24 32" aria-hidden="true"><path d="M20 3 4 16l16 13z"/></svg>
        </button>

        <div class="tmodal__content">
          <Transition name="tswap" mode="out-in">
            <div :key="entry.talent.id" class="tmodal__card">
              <LobbyTalentsCard :talent="entry.talent" :stars="entry.stars" :is-new="entry.talent.id === newTalentId" />
            </div>
          </Transition>

          <p class="tmodal__rarity" :class="`is-${entry.talent.rarity}`">
            {{ TALENT_RARITIES[entry.talent.rarity].label }} · {{ entry.stars }}/{{ entry.talent.maxStars }} ★
          </p>
          <ul class="tmodal__effects">
            <li v-for="effect in entry.talent.effects" :key="effect.stat">
              {{ formatTalentEffect(effect.stat, effect.perStar * entry.stars) }}
            </li>
          </ul>
        </div>

        <button v-if="entries.length > 1" type="button" class="tmodal__arrow tmodal__arrow--next" aria-label="Próximo talento" @click.stop="go(1)">
          <svg viewBox="0 0 24 32" aria-hidden="true"><path d="M4 3l16 13L4 29z"/></svg>
        </button>

        <p class="tmodal__hint">Toque em qualquer área para fechar</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tmodal{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;background:rgba(6,8,22,.78);cursor:pointer}
.tmodal__content{display:flex;flex-direction:column;align-items:center;gap:14px;width:min(300px,64vw)}
.tmodal__card{width:100%;padding-top:10%}
.tmodal__rarity{margin:6px 0 0;padding:3px 14px;border-radius:999px;font:15px 'Lilita One',sans-serif;color:#fff;background:#8d99a4}
.tmodal__rarity.is-rare{background:#2f7cd1}.tmodal__rarity.is-epic{background:#9444d6}.tmodal__rarity.is-legendary{background:#d98a0b}
.tmodal__effects{margin:0;padding:0;list-style:none;text-align:center}
.tmodal__effects li{font:clamp(20px,5.5vw,28px)/1.25 'Lilita One',sans-serif;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.6)}
.tmodal__arrow{position:absolute;top:50%;translate:0 -50%;width:48px;height:64px;display:grid;place-items:center;background:none;border:0;cursor:pointer}
.tmodal__arrow svg{width:28px;height:36px;fill:#fff;filter:drop-shadow(0 3px 0 rgba(0,0,0,.5));transition:scale .15s ease}
.tmodal__arrow:active svg{scale:.85}
.tmodal__arrow--prev{left:max(8px,calc(50% - 280px))}
.tmodal__arrow--next{right:max(8px,calc(50% - 280px))}
.tmodal__hint{position:absolute;bottom:max(24px,env(safe-area-inset-bottom));left:0;right:0;margin:0;text-align:center;font:16px 'Lilita One',sans-serif;color:rgba(255,255,255,.85);text-shadow:0 2px 0 rgba(0,0,0,.6)}

.tmodal-enter-active,.tmodal-leave-active{transition:opacity .2s ease}
.tmodal-enter-from,.tmodal-leave-to{opacity:0}
.tmodal-enter-active .tmodal__card{transition:scale .25s cubic-bezier(.3,1.5,.6,1)}
.tmodal-enter-from .tmodal__card{scale:.6}
.tswap-enter-active,.tswap-leave-active{transition:opacity .12s ease,scale .12s ease}
.tswap-enter-from,.tswap-leave-to{opacity:0;scale:.92}
</style>
