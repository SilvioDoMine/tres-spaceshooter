<script setup lang="js">
import { LEVEL_1 } from '~/games/levels/LevelOneConfig';
import { useAudio } from '~/composables/useAudio';

// Page metadata
useHead({
  title: 'Home',
  meta: [
    { name: 'description', content: 'A TresJS Nuxt application' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'theme-color', content: '#020420' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
  ],
})

const route = useRoute();
const currentRunStore = useCurrentRunStore();
const audio = useAudio();

const levels = {
  1: LEVEL_1,
};

const audioInitialized = ref(false);

// Inicializa áudio na primeira interação do usuário
const initAudioOnFirstInput = async () => {
  if (audioInitialized.value) return;

  console.log('First user interaction detected, initializing audio...');
  audioInitialized.value = true;

  // Inicia o sistema de áudio
  await audio.init();

  // Toca música de fundo
  audio.playBackgroundMusic('/sounds/background_main.mp3', true);

  // Carrega efeitos sonoros principais
  audio.loadSound('levelup', '/sounds/levelup.wav');
  audio.loadSound('shoot-player', '/sounds/shoot-player.wav');
  audio.loadSound('player-death', '/sounds/player-death.wav');
  audio.loadSound('shoot2', '/sounds/shoot2.wav');
  audio.loadSound('shoot7', '/sounds/shoot7.wav');
  audio.loadSound('shoot1', '/sounds/shoot1.wav');
  audio.loadSound('hit-soft1', '/sounds/hit-soft1.wav');
  audio.loadSound('hit-soft2', '/sounds/hit-soft2.wav');
  audio.loadSound('hit-soft3', '/sounds/hit-soft3.wav');
  audio.loadSound('hit-soft4', '/sounds/hit-soft3.wav');
  audio.loadSound('hit-soft5', '/sounds/hit-soft3.wav');
  audio.loadSound('enemy-death1', '/sounds/enemy-death1.wav');
  audio.loadSound('enemy-death2', '/sounds/enemy-death2.wav');
  audio.loadSound('enemy-death3', '/sounds/enemy-death3.wav');
  audio.loadSound('hit-hard1', '/sounds/hit-hard1.wav');
  audio.loadSound('hit-hard2', '/sounds/hit-hard2.wav');
  audio.loadSound('hit-hard3', '/sounds/hit-hard3.wav');
  audio.loadSound('hit-hard4', '/sounds/hit-hard4.wav');
  audio.loadSound('hit-hard5', '/sounds/hit-hard5.wav');

  // Carrega efeitos sonoros (exemplo)
  // await audio.loadSound('shoot', '/sounds/shoot.mp3');
  // await audio.loadSound('hit', '/sounds/hit.mp3');

  // Remove os listeners após inicializar
  window.removeEventListener('click', initAudioOnFirstInput);
  window.removeEventListener('keydown', initAudioOnFirstInput);
  window.removeEventListener('touchstart', initAudioOnFirstInput);
};

onMounted(async () => {
  await nextTick();

  const currentId = Number(route.params.id);

  if (! Number.isInteger(currentId) ) {
    console.error('Invalid level id:', route.params.id );
    navigateTo('/');
    return;
  }

  if (!levels[currentId]) {
    console.error('Level not found:', route.params.id );
    navigateTo('/');
    return;
  }

  // Aguarda primeira interação do usuário para inicializar áudio
  window.addEventListener('click', initAudioOnFirstInput, { once: false });
  window.addEventListener('keydown', initAudioOnFirstInput, { once: false });
  window.addEventListener('touchstart', initAudioOnFirstInput, { once: false });

  // Inicia uma nova partida ao montar a página
  currentRunStore.gameStart(levels[route.params.id ]);
});

onUnmounted(() => {
  console.log('Play page unmounted');

  // Para a música ao desmontar
  audio.stopBackgroundMusic();

  // Remove listeners caso ainda existam
  window.removeEventListener('click', initAudioOnFirstInput);
  window.removeEventListener('keydown', initAudioOnFirstInput);
  window.removeEventListener('touchstart', initAudioOnFirstInput);

  // currentRunStore.endRun();
});
</script>

<template>
  <div class="relative w-full h-dvh">
    <TresCanvas
      clear-color="#000814"
      window-size
    >
      <GameOrchestrator>
        <GameDoorManager />
        <GamePlayerCharacter />
        <GameEnemyManager />
        <GameProjectileManager />
        
        <GameWorld />
        <!-- <OrbitControls /> -->
      </GameOrchestrator>
    </TresCanvas>

    <!-- Modals -->
    <PlayPauseModal />
    <PlayOverModal />
    <PlayVictoryModal />
    <GameSkillSelectModal />
    <LobbySettingsModal />

    <!-- Leches -->
    <!-- <TresLeches /> -->

    <!-- Hud -->
    <ClientOnly>
      <UiVirtualJoystick />
      <UiResources />
      <UiLevel />
    </ClientOnly>
  </div>
</template>
