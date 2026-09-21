// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // O service worker vive em public/, que o Nuxt ignora por ser conteúdo estático.
  // Mas ele é código nosso (~320 linhas), então entra no lint com os globals de
  // worker — sem isso `self`, `caches` e `clients` apareceriam como indefinidos.
  // O config do Nuxt ignora o diretório public/ inteiro; estes três padrões,
  // nesta ordem, reabrem só o sw.js (des-ignora o diretório, ignora o conteúdo,
  // reinclui o arquivo).
  { ignores: ['!**/public', '**/public/*', '!**/public/sw.js'] },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        registration: 'readonly',
        skipWaiting: 'readonly',
      },
    },
  },
)
