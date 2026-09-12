/**
 * Versão do build em execução.
 *
 * Em produção vem da tag criada pelo workflow Release & Deploy, que a grava
 * como APP_VERSION no Coolify antes do build. Em dev, sem `.env`, vale 'DEBUG'.
 */
export function useAppVersion(): string {
  return useRuntimeConfig().public.appVersion as string
}

/** true quando não estamos rodando um build versionado. */
export function useIsDebugBuild(): boolean {
  return useAppVersion() === 'DEBUG'
}
