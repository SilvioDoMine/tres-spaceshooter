<script setup lang="ts">
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useMissions } from '~/composables/useMissions.js';

// Meta tags para prevenir zoom e gestos mobile + instalação como aplicativo (PWA)
useHead({
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent'
    },
    {
      // Nome sob o ícone quando o jogador adiciona à tela de início do iPhone
      name: 'apple-mobile-web-app-title',
      content: 'Hyfight'
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes'
    },
    {
      name: 'theme-color',
      content: '#000814'
    }
  ],
  link: [
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png', sizes: '180x180' },
    { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192.png' }
  ]
});

// Ativa bloqueio de gestos mobile
useMobileGestureLock();

// Baixa imagens, sons, modelos e fontes antes de montar qualquer página;
// ao terminar, a rota atual (lobby, partida...) aparece normalmente.
const { progress: assetsProgress, done: assetsReady, start: preloadAssets } = useAssetPreloader();
preloadAssets();

// Com uma versão nova baixando, a tela de loading segura o jogo até ela estar
// pronta (poucos segundos, com teto em usePwa): a troca acontece aqui dentro em
// vez de recarregar o lobby logo depois — dois carregamentos seguidos.
const pwa = usePwa();
const gameReady = computed(() => assetsReady.value && !pwa.updateInstalling.value);
const updatingTo = computed(() => (pwa.updateInstalling.value ? pwa.publishedVersion.value : null));

const currentRunStore = useCurrentRunStore();
currentRunStore.initializePermanentState();

const {
  // Event Handler
  handleEvent,
} = useMissions();

onMounted(() => {
  handleEvent('login');
});

// watchOnce(paneContainer, (newVal) => {
//   console.log('Pane container changed:', newVal);
// }, { immediate: true });

// onMounted(async () => {
//   await nextTick();

//   if (! paneContainer.value) {
//     console.log('Pane container not found');
//     return;
//   }

//   console.log('Creating Tweakpane in container:', paneContainer.value);

//   console.log('Tweakpane container:', document.getElementById('paneContainer'));
  
//   const pane = tweakpaneStore.createPane(
//     document.getElementById('paneContainer'),
//     {
//       title: 'Game Controls',
//       expanded: true,
//     }
//   );

//   console.log('Tweakpane created:', pane.value);

//   // // Example: read only value
//   const myValue = ref(42);

//   const folder = pane.value.addFolder({
//     title: 'Player',
//     expanded: true,
//   });

//   folder.addBinding(myValue, 'value', {
//     label: 'Position',
//     interval: 500,
//     readonly: true,
//   });

//   folder.addBinding(currentRunStore.playerPosition, 'value', {
//     label: 'Player Position',
//     interval: 500,
//     readonly: true,
//   });

//   const paneEnemies = pane.value.addFolder({
//     title: 'Enemies',
//     expanded: true,
//   });

//   console.log(enemyManager.activeEnemies.value);

//   // enemy manager store active enemies quantity
//   paneEnemies.addBinding(enemyManager.activeEnemies.value, 'length', {
//     label: 'Active Enemies',
//     interval: 500,
//     readonly: true,
//   });

// });

// Get current commit version
// Vem da tag do git em produção (o workflow grava APP_VERSION no Coolify).
// Sem build versionado, vale 'DEBUG'.
const appVersion = useAppVersion();
</script>

<template>
  <div class="game-root">
    <template v-if="gameReady">
      <NuxtPage />
      <ClientOnly><LobbyEquipmentGrantModal /><LobbyShopChestOpening /></ClientOnly>
    </template>
    <Transition name="app-loading-fade">
      <AppLoadingScreen v-if="!gameReady" :progress="assetsProgress" :updating-to="updatingTo" />
    </Transition>
    <!-- pointer-events-none: esta div cobre a tela toda, sem isso ela
         engole todo clique e toque do jogo. -->
    <div class="pointer-events-none absolute top-0 right-0 bottom-2 left-0 flex items-end justify-center">
      <p class="text-white/30">Versão {{ appVersion }}</p>
    </div>
    <ClientOnly><UiAppUpdateToast /><UiOrientationGuard /></ClientOnly>
  </div>
</template>

<style>
/* Faixas de área segura (Dynamic Island, indicador de home) na mesma cor do
   fundo das cenas (clear-color dos TresCanvas), para a emenda não aparecer */
html,
body {
  background-color: #000814;
  margin: 0;
  padding: 0;
  /* Previne double-tap zoom - permite apenas pan/scroll */
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.app-loading-fade-leave-active {
  transition: opacity 0.4s ease;
}

.app-loading-fade-leave-to {
  opacity: 0;
}

/* Área segura do aparelho (Dynamic Island, notch, indicador de home).
   Em variáveis para dar para simular no navegador ao testar o layout:
   document.documentElement.style.setProperty('--safe-top', '59px') */
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}

/* Todo o jogo vive aqui dentro: cena, HUD, modais e avisos.
   `position` + `transform` fazem deste elemento o containing block dos filhos
   `absolute` E `fixed` — sem o transform, o HUD e os modais se prendem à tela
   inteira e somem sob a Dynamic Island e o indicador de home no iPhone. */
.game-root {
  position: absolute;
  /* inset e não padding: o containing block de um filho absolute é o padding box
     do ancestral, então padding não afastaria nada. Encolhendo a caixa, todo
     `top: 0` / `bottom: 0` de dentro do jogo passa a valer na área visível. */
  top: var(--safe-top);
  right: var(--safe-right);
  bottom: var(--safe-bottom);
  left: var(--safe-left);
  overflow: hidden;
  transform: translateZ(0);
}
</style>