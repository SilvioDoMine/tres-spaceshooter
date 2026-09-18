import { ref, computed } from 'vue';

/**
 * Sistema de gerenciamento de modais reutilizável
 * Suporta múltiplos modais empilhados (stack)
 * Agnóstico de store - cada modal gerencia seu próprio estado
 */

// Stack global de modais abertos (IDs)
// IMPORTANTE: Inicia vazio para garantir que nenhum modal apareça por padrão
export const modalStack = ref([]);

// Debug: Log quando o stack mudar
if (import.meta.client) {
  import('vue').then(({ watch }) => {
    watch(modalStack, (newStack) => {
      console.log('[useModal] Stack atualizado:', newStack);
    }, { deep: true });
  });
}

// Handlers de ESC registrados pelos modais (id -> função de fechar).
// Só quem registra fecha com ESC; modais obrigatórios (game over, pausa) ficam de fora.
const escapeHandlers = new Map();

let escapeListenerAttached = false;

function handleGlobalEscape(event) {
  if (event.key !== 'Escape' || event.repeat || event.defaultPrevented) return;

  const topId = modalStack.value[modalStack.value.length - 1];
  if (!topId) return;

  const handler = escapeHandlers.get(topId);
  if (!handler) return;

  // Consome o ESC para que atalhos de baixo (pausa, telas do lobby) não reajam ao mesmo toque
  event.preventDefault();
  event.stopPropagation();
  handler();
}

function ensureEscapeListener() {
  if (escapeListenerAttached || !import.meta.client) return;
  // Captura: roda antes dos atalhos locais das telas/modais
  window.addEventListener('keydown', handleGlobalEscape, true);
  escapeListenerAttached = true;
}

/**
 * Registra o fechamento por ESC de um modal.
 * O handler só é chamado quando o modal está no topo da pilha.
 */
export function registerEscapeHandler(modalId, handler) {
  ensureEscapeListener();
  escapeHandlers.set(modalId, handler);
}

/**
 * Remove o fechamento por ESC de um modal.
 * Só apaga se o handler ainda for o registrado: na troca de rota a instância nova
 * monta antes da antiga desmontar, e a antiga não pode derrubar o registro da nova.
 */
export function unregisterEscapeHandler(modalId, handler) {
  if (handler && escapeHandlers.get(modalId) !== handler) return;
  escapeHandlers.delete(modalId);
}

export function useModal(modalId) {
  /**
   * Verifica se este modal está aberto
   */
  const isOpen = computed(() => modalStack.value.includes(modalId));

  /**
   * Verifica se este modal é o topo da pilha (mais recente)
   */
  const isTopModal = computed(() => {
    return modalStack.value.length > 0 &&
           modalStack.value[modalStack.value.length - 1] === modalId;
  });

  /**
   * Retorna o z-index baseado na posição na pilha
   * Primeiro modal: z-50, segundo: z-60, etc
   */
  const zIndex = computed(() => {
    const index = modalStack.value.indexOf(modalId);
    return index !== -1 ? 50 + (index * 10) : 50;
  });

  /**
   * Abre o modal (adiciona ao topo da pilha)
   */
  function open() {
    if (!isOpen.value) {
      modalStack.value.push(modalId);
    }
  }

  /**
   * Fecha o modal (remove da pilha)
   */
  function close() {
    const index = modalStack.value.indexOf(modalId);
    if (index !== -1) {
      modalStack.value.splice(index, 1);
    }
  }

  /**
   * Fecha todos os modais
   */
  function closeAll() {
    modalStack.value = [];
  }

  /**
   * Fecha apenas o modal do topo
   */
  function closeTop() {
    if (modalStack.value.length > 0) {
      modalStack.value.pop();
    }
  }

  return {
    isOpen,
    isTopModal,
    zIndex,
    open,
    close,
    closeAll,
    closeTop,
  };
}
