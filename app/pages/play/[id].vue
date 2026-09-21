<script setup lang="js">
import { LEVELS } from '~/games/levels';
import { useAudio } from '~/composables/useAudio';
import UiFlightRadar from '~/components/ui/FlightRadar.vue';
import UiTargetBeacons from '~/components/ui/TargetBeacons.vue';

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

// Trocar de capítulo (/play/1 → /play/2) remonta a página e inicia uma partida nova
definePageMeta({ key: route => route.fullPath });

const levels = LEVELS;
const chapterProgress = useChapterProgressStore();

const audioInitialized = ref(false);

// A trilha acompanha a sala: calma na intro e com a sala limpa, combate nas ondas e chefe no boss
const musicIntensity = computed(() => {
  const stage = currentRunStore.currentStage;
  if (!stage || stage.type === 'intro' || currentRunStore.isStageCompleted) return 'calm';
  return stage.type === 'boss' ? 'boss' : 'combat';
});
// Sala limpa só acalma a música depois de um tempo: indo direto para a próxima sala, a bateria
// segue tocando em vez de sumir e voltar a cada porta
const CALM_DELAY_MS = 10000;
let calmTimer = 0;
watch(musicIntensity, level => {
  clearTimeout(calmTimer);
  if (level === 'calm') calmTimer = setTimeout(() => audio.setMusicIntensity('calm'), CALM_DELAY_MS);
  else audio.setMusicIntensity(level);
});

// Inicializa áudio na primeira interação do usuário
const initAudioOnFirstInput = async () => {
  if (audioInitialized.value) return;

  console.log('First user interaction detected, initializing audio...');
  audioInitialized.value = true;

  // Inicia o sistema de áudio
  await audio.init();

  // Trilha gerada do capítulo, já na intensidade da sala atual
  const chapterId = Number(route.params.id);
  audio.playChapterMusic(levels[chapterId]?.chapter ?? chapterId, musicIntensity.value);

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

  if (!chapterProgress.isUnlocked(currentId)) {
    console.warn('Chapter locked:', currentId);
    navigateTo('/');
    return;
  }

  // O lobby volta a abrir neste capítulo
  chapterProgress.markPlayed(currentId);

  // Efeitos já vêm decodificados da tela de loading; isto só cobre alguma falha do preload
  audio.loadGameSounds();

  // Veio clicando pelo lobby: o navegador já liberou o áudio, a música entra na hora.
  // Link direto/recarregou a página: espera a primeira interação.
  if (navigator.userActivation?.hasBeenActive) {
    initAudioOnFirstInput();
  } else {
    window.addEventListener('click', initAudioOnFirstInput, { once: false });
    window.addEventListener('keydown', initAudioOnFirstInput, { once: false });
    window.addEventListener('touchstart', initAudioOnFirstInput, { once: false });
  }

  // Inicia uma nova partida ao montar a página
  currentRunStore.gameStart(levels[route.params.id ]);
});

onUnmounted(() => {
  console.log('Play page unmounted');

  // Para a música ao desmontar
  clearTimeout(calmTimer);
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
      :dpr="[1, 1.5]"
      window-size
    >
      <GameOrchestrator>
        <GameDoorManager />
        <GamePlayerCharacter />
        <GameEnemyManager />
        <GameProjectileManager />
        <GameElementalEffects />
        <GameHeartPickups />
        <GameLootPickups />
        <GameEquipmentEffects />
        <GameHeartFuryAura />
        <GameHyperdriveBurst />
        
        <GameWorld :key="Number(route.params.id)" :chapter="Number(route.params.id)" />
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
      <UiDamageFeedback /><UiFlightRadar /><UiTargetBeacons /><UiSpatialDilation />
    </ClientOnly>
  </div>
</template>


