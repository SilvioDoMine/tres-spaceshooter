<script setup lang="ts">
import BaseModal from '~/components/ui/BaseModal.vue';

// Atalho do HUD para salvar o jogo como aplicativo. Some assim que o jogo está instalado.
// Android/desktop abrem o diálogo do navegador; no iPhone o Safari não tem diálogo,
// então o modal mostra o caminho Compartilhar → Adicionar à Tela de Início.
const { canInstall, needsManualInstall, install } = usePwa();
const instructions = useModal('install-app-modal');

const visible = computed(() => canInstall.value || needsManualInstall.value);

async function handleClick() {
  if (canInstall.value) {
    await install();
    return;
  }
  instructions.open();
}
</script>

<template>
  <LobbyHudButton
    v-if="visible"
    label="Instalar"
    variant="green"
    class="pointer-events-auto hud-button-shake"
    @click="handleClick"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="2.5" width="12" height="19" rx="2.6" stroke="currentColor" stroke-width="2" />
      <path d="M12 7v7m0 0 2.8-2.8M12 14l-2.8-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M10.4 18.6h3.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </LobbyHudButton>

  <BaseModal modal-id="install-app-modal" title="Instalar o jogo" max-width="max-w-sm">
    <div class="flex flex-col gap-3 pointer-events-auto text-amber-900">
      <BaseInset variant="sunken" class="p-4 flex flex-col gap-2">
        <p class="font-bold">No iPhone e no iPad:</p>
        <ol class="list-decimal pl-5 flex flex-col gap-1 text-sm">
          <li>Toque em <strong>Compartilhar</strong> na barra do Safari.</li>
          <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
          <li>Abra o Hyfight Spaceshooter pelo ícone novo.</li>
        </ol>
      </BaseInset>
      <p class="text-sm">
        Instalado, o jogo abre em tela cheia, sem a barra do navegador, funciona sem internet
        e o seu progresso deixa de ser apagado pela limpeza automática do Safari.
      </p>
    </div>
  </BaseModal>
</template>
