/**
 * Preferências simples (ligado/desligado) guardadas no localStorage.
 * Usado pelas opções de dispositivo do jogo: tela acesa, tela cheia, notificações.
 */

export function readFlag(key: string, fallback = false): boolean {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : saved === 'true';
  } catch {
    return fallback;
  }
}

export function writeFlag(key: string, value: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Modo privado / cota cheia: a preferência vale só nesta sessão.
  }
}
