// Reset de conta: apaga tudo que o jogo guarda no navegador (progresso dos capítulos, equipamentos,
// talentos, loja, moedas, missões, ofertas, estatísticas, perfil e preferências) e recarrega o jogo
// do zero. Como todo o save vive no localStorage, limpar o armazenamento é o reset completo.

/** Limpa um Storage inteiro. Navegadores em modo restrito podem recusar, e o erro não pode derrubar o reset */
export function clearStorage(storage) {
  if (!storage) return false;
  try {
    storage.clear();
    return true;
  } catch (error) {
    console.error('Falha ao limpar o armazenamento do navegador:', error);
    return false;
  }
}

/**
 * Apaga todo o progresso salvo e recarrega o jogo no lobby.
 * O reload é o que garante stores e composables recriados vazios; `replace` evita voltar,
 * pelo histórico, para uma partida que não existe mais.
 */
export function resetAllProgress(win = globalThis) {
  const local = clearStorage(win.localStorage);
  const session = clearStorage(win.sessionStorage);
  win.location?.replace?.('/');
  return local && session;
}
