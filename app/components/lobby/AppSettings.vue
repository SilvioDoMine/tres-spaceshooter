<script setup lang="ts">
// Bloco "Aplicativo" das Configurações: instalar o jogo, manter a tela acesa,
// tela cheia, notificações e o estado do save no aparelho.
const pwa = usePwa();
const wakeLock = useWakeLock();
const fullscreen = useFullscreen();
const push = usePushNotifications();
const instructions = useModal('install-app-modal');

const cacheSize = ref('');

onMounted(async () => {
  push.sync();
  const estimate = await pwa.storageEstimate();
  if (estimate?.usage) cacheSize.value = `${(estimate.usage / 1024 / 1024).toFixed(0)} MB`;
});

const saveState = computed(() => {
  if (pwa.persisted.value) return 'Progresso protegido neste aparelho.';
  if (pwa.isIos.value && !pwa.isStandalone.value) return 'Instale o jogo para o Safari parar de apagar o progresso.';
  return 'O navegador pode apagar o progresso se o espaço acabar.';
});

async function handleInstall() {
  if (pwa.canInstall.value) {
    await pwa.install();
    return;
  }
  instructions.open();
}

function toggleNotifications(value: boolean) {
  if (value) push.enable();
  else push.disable();
}
</script>

<template>
  <BaseInset variant="sunken" class="p-3 flex flex-col gap-3 text-md sm:text-lg">
    <h3 class="font-bold text-amber-900">Aplicativo</h3>

    <div v-if="!pwa.isInstalled.value" class="flex justify-between items-center gap-3">
      <p class="text-sm text-amber-900/80">
        Salve o jogo na tela de início: abre em tela cheia e funciona sem internet.
      </p>
      <BaseButton variant="green" size="sm" @click="handleInstall">Instalar</BaseButton>
    </div>

    <div v-if="wakeLock.supported" class="flex justify-between items-center">
      <h3 class="font-bold text-amber-900">Manter a tela acesa</h3>
      <BaseToggleCheckbox
        :model-value="wakeLock.enabled.value"
        @update:model-value="wakeLock.setEnabled($event)"
      />
    </div>

    <div v-if="fullscreen.supported" class="flex justify-between items-center">
      <h3 class="font-bold text-amber-900">Tela cheia</h3>
      <BaseToggleCheckbox
        :model-value="fullscreen.enabled.value"
        @update:model-value="fullscreen.setEnabled($event)"
      />
    </div>

    <div v-if="push.supported && !push.requiresInstall.value" class="flex justify-between items-center">
      <h3 class="font-bold text-amber-900">Notificações</h3>
      <BaseToggleCheckbox
        :model-value="push.permission.value === 'granted' && push.enabled.value"
        @update:model-value="toggleNotifications($event)"
      />
    </div>

    <p v-else-if="push.requiresInstall.value" class="text-sm text-amber-900/70">
      Notificações no iPhone só depois de instalar o jogo na tela de início.
    </p>

    <p v-if="push.permission.value === 'denied'" class="text-sm text-red-800/80">
      As notificações estão bloqueadas nas configurações do navegador.
    </p>

    <p class="text-sm text-amber-900/70">
      {{ saveState }}
      <span v-if="cacheSize"> Jogo guardado no aparelho: {{ cacheSize }}.</span>
    </p>
  </BaseInset>
</template>
