/**
 * Liga o desbloqueio de áudio assim que o jogo sobe.
 *
 * Precisa valer em qualquer tela (lobby, partida, laboratórios), não só onde a
 * música começa: no iPhone o primeiro toque do jogador é a única chance de
 * abrir a saída de áudio, e o iOS interrompe o contexto toda vez que o jogo vai
 * para segundo plano.
 */

import { setupAudioUnlock } from '~/composables/useAudio';

export default defineNuxtPlugin(() => {
  setupAudioUnlock();
});
