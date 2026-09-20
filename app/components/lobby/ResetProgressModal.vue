<script setup lang="js">
import { ref } from 'vue';
import BaseModal from '~/components/ui/BaseModal.vue';
import { useModal } from '~/composables/useModal';
import { resetAllProgress } from '~/utils/resetProgress';

// Confirmação do reset de conta aberto pelas Configurações. Ação destrutiva e sem volta:
// o "não" é o caminho fácil (overlay, ESC, X e botão) e o "sim" exige um toque deliberado.
const MODAL_ID = 'reset-progress-modal';

const { close } = useModal(MODAL_ID);
const resetting = ref(false);

function handleConfirm() {
  // O recarregamento leva um instante; trava o botão para não disparar duas vezes
  if (resetting.value) return;
  resetting.value = true;
  resetAllProgress();
}
</script>

<template>
  <BaseModal
    :modal-id="MODAL_ID"
    title="Resetar Progresso"
    variant="red"
    max-width="max-w-lg"
  >
    <div class="flex flex-col gap-4">
      <BaseInset class="flex flex-col gap-3 p-4 text-center text-amber-900">
        <h3 class="title-text text-xl">Isso vai apagar TUDO</h3>
        <p class="text-base">
          Todo o seu progresso será excluído permanentemente e não há como recuperar depois.
        </p>
        <BaseInset variant="sunken" class="p-3">
          <ul class="text-sm sm:text-base text-left list-disc list-inside space-y-1">
            <li>Capítulos, salas e marcos conquistados</li>
            <li>Nível da conta, talentos e estatísticas</li>
            <li>Equipamentos, inventário e baús</li>
            <li>Ouro, gemas, chaves e fragmentos</li>
            <li>Missões, ofertas e recompensas pendentes</li>
            <li>Perfil, aparência da nave e configurações</li>
          </ul>
        </BaseInset>
        <p class="text-base font-bold">
          Tem certeza que quer começar do zero?
        </p>
      </BaseInset>

      <!-- Ações -->
      <div class="flex flex-row gap-2 justify-between">
        <BaseButton
          variant="green"
          size="sm"
          :disabled="resetting"
          @click="close"
        >
          Não
        </BaseButton>
        <BaseButton
          variant="red"
          size="sm"
          :disabled="resetting"
          data-ui-sound="confirm"
          @click="handleConfirm"
        >
          Sim, apagar tudo
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
