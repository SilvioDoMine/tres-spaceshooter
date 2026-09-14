<script lang="ts">
import type { ChestType } from '~/data/shop';

/** Último quadro de cada baú, guardado entre montagens (troca de aba) */
const snapshots = new Map<ChestType, string>();
</script>

<script setup lang="ts">
// Canvas transparente do baú no card (a cena fica em chest/PreviewScene.vue, que precisa estar dentro do canvas).
//
// Troca de aba sem "buraco" no card (mesma ideia do palco da nave em equipment/ShipStage.vue):
// - Saindo: o WebGL é destruído no desmontar, antes da animação de saída acabar; o último quadro
//   vira uma imagem por cima para o baú continuar visível até a tela sair.
// - Entrando: a foto da última visita fica por cima até o canvas desenhar os primeiros quadros.
const props = defineProps<{ type: ChestType; glow?: boolean }>();

/** Tempo com a foto por cima ao entrar, até o canvas novo já ter desenhado */
const PLACEHOLDER_MS = 350;

const root = ref<HTMLElement | null>(null);
const placeholder = ref<string | null>(snapshots.get(props.type) ?? null);

let timer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  if (placeholder.value) timer = setTimeout(() => (placeholder.value = null), PLACEHOLDER_MS);
});

onBeforeUnmount(() => {
  clearTimeout(timer);
  const canvas = root.value?.querySelector('canvas');
  if (!canvas || !root.value) return;
  try {
    const dataUrl = canvas.toDataURL();
    // "data:," = canvas sem tamanho/sem quadro desenhado; uma imagem vazia viraria ícone quebrado
    if (dataUrl.length < 32) return;
    snapshots.set(props.type, dataUrl);

    // Criada direto no DOM: o componente já está desmontando, mas o elemento fica até a saída acabar
    const snapshot = document.createElement('img');
    snapshot.src = dataUrl;
    snapshot.alt = '';
    Object.assign(snapshot.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '1' });
    root.value.appendChild(snapshot);
    // O canvas é transparente: sem o WebGL ele fica branco e apareceria em volta do baú, pelas partes
    // transparentes da foto. Some com ele e deixa só a foto.
    canvas.style.visibility = 'hidden';
  } catch (error) {
    console.warn('Não foi possível congelar o preview do baú:', error);
  }
});
</script>

<template>
  <div ref="root" class="cpreview" :class="{ 'is-glow': glow }">
    <span class="cpreview__shadow" aria-hidden="true"></span>
    <!-- O TresCanvas põe `pointer-events: auto; touch-action: none` inline no <canvas>, o que prende o toque
         e impede o scroll da loja. O baú é só decorativo, então o canvas deixa os eventos passarem. -->
    <TresCanvas
      :alpha="true"
      :clear-alpha="0"
      :dpr="[1, 1.5]"
      :preserve-drawing-buffer="true"
      :style="{ pointerEvents: 'none', touchAction: 'auto' }"
    >
      <LobbyShopChestPreviewScene :type="type" :glow="glow" />
    </TresCanvas>
    <Transition name="cpreview-photo">
      <img v-if="placeholder" :src="placeholder" alt="" class="cpreview__photo" />
    </Transition>
  </div>
</template>

<style scoped>
.cpreview {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.cpreview__shadow {
  position: absolute;
  left: 22%;
  right: 22%;
  bottom: 30px;
  height: 18px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(10, 8, 40, 0.45), transparent);
}
.cpreview__photo {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
}
.cpreview-photo-leave-active {
  transition: opacity 0.2s ease;
}
.cpreview-photo-leave-to {
  opacity: 0;
}
.cpreview.is-glow::before {
  content: '';
  position: absolute;
  inset: 8% 16% 22%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 238, 160, 0.55), transparent);
  animation: cpreview-glow 1.6s ease-in-out infinite;
}
@keyframes cpreview-glow {
  50% {
    opacity: 0.45;
    scale: 0.9;
  }
}
</style>
