# Hyfight Spaceshooter como aplicativo (PWA)

O jogo pode ser salvo na tela de início, abre em tela cheia, roda offline e
guarda o progresso sem depender da limpeza automática do navegador.

## Peças

| Arquivo | Papel |
| --- | --- |
| `public/manifest.webmanifest` | Nome, ícones, cor de fundo, `display: standalone` e `orientation: portrait`. |
| `public/icons/` | Ícones 192/512 (`any` e `maskable`) e `apple-touch-icon` 180, gerados de `public/images/icons/icon-01.png`. |
| `public/sw.js` | Service worker: precache, cache-first, atualização entre deploys e Web Push. |
| `scripts/precache-manifest.mjs` | Gera o `precache-manifest.json` no build e carimba a revisão no `sw.js`. |
| `app/plugins/pwa.client.ts` | Liga tudo no boot do jogo. |
| `app/composables/usePwa.ts` | Instalação, atualização e armazenamento persistente. |
| `app/composables/useWakeLock.ts` | Tela acesa durante o jogo. |
| `app/composables/useFullscreen.ts` | Tela cheia e trava de orientação. |
| `app/composables/usePushNotifications.ts` | Permissão de notificação e inscrição Web Push. |
| `app/composables/useOrientationGuard.ts` | Aviso de girar o aparelho (retrato obrigatório). |
| `app/components/lobby/AppSettings.vue` | Bloco "Aplicativo" nas Configurações. |
| `app/components/lobby/InstallAppButton.vue` | Botão "Instalar" no HUD do lobby. |
| `app/components/ui/AppUpdateToast.vue` | Aviso "Nova versão disponível". |

## Como o cache funciona

1. **Build.** O hook `nitro:build:public-assets` varre `.output/public`, gera
   `precache-manifest.json` (`shell` = HTML/JS/CSS/ícones, `assets` = imagens,
   modelos, sons e fontes, cada um com hash de conteúdo) e substitui
   `__BUILD_REVISION__` dentro do `sw.js` publicado.
2. **Primeira visita.** O service worker instala o shell. Os ~26 MB de assets
   entram no cache enquanto a tela de loading (`useAssetPreloader`) os baixa —
   o `fetch` handler é cache-first e guarda o que vem da rede, então nada é
   baixado duas vezes. Quando o preload termina, o app manda `PRECACHE_ALL` e o
   service worker completa o que ficou faltando.
3. **Visitas seguintes.** Tudo sai do cache; o jogo abre sem rede.
4. **Deploy novo.** Como o `sw.js` carrega a revisão do build, o navegador
   reinstala o service worker. O precache rebaixa **apenas** os arquivos cujo
   hash mudou e o `activate` apaga do cache o que saiu do manifesto. O jogador
   vê "Nova versão disponível"; a troca só acontece no toque dele, para não
   recarregar no meio de uma partida.

`npm run build` imprime `[pwa] precache-manifest: N do shell + M assets (X MB)`.

Em desenvolvimento o service worker não é registrado (e qualquer registro
antigo na mesma origem é removido), para não atrapalhar o HMR.

## Permissões e comportamento por plataforma

| Recurso | Android/Chrome | iPhone/Safari |
| --- | --- | --- |
| Instalar | Diálogo nativo pelo botão "Instalar" (`beforeinstallprompt`) | Manual: Compartilhar → Adicionar à Tela de Início (o modal explica) |
| Tela cheia | Fullscreen API + `display_override: fullscreen` | Só instalado na tela de início |
| Retrato | `screen.orientation.lock('portrait')` | Aviso de girar o aparelho |
| Tela acesa | Wake Lock API | Wake Lock API (iOS 16.4+) |
| Notificações | Permissão + Web Push | Só com o jogo instalado (iOS 16.4+) |
| Save protegido | `navigator.storage.persist()` | Concedido ao app instalado; no Safari comum o dado pode ser apagado |

O aviso de girar o aparelho vale para celular e tablet, instalado ou não
(`(orientation: landscape) and (pointer: coarse) and (hover: none)`), e não
atinge desktop nem notebook com touch.

## Web Push

O cliente está pronto, mas **não há servidor de push**. Sem configuração, a
permissão de notificação serve para avisos locais do próprio jogo
(`usePushNotifications().notify(...)`). Para ligar o push de verdade:

1. Gere um par de chaves VAPID no servidor que vai enviar as notificações.
2. Defina no build:
   - `NUXT_PUBLIC_PUSH_PUBLIC_KEY` — chave pública VAPID;
   - `NUXT_PUBLIC_PUSH_SUBSCRIBE_URL` — endpoint que recebe a inscrição (POST JSON).
3. O envio (payload `{ title, body, url, tag }`) fica a cargo desse servidor; o
   `sw.js` já trata `push` e `notificationclick`.

Como o jogo roda no Coolify (`hyfight.com.br`), as duas variáveis precisam
existir como build args, igual ao `APP_VERSION` — o `runtimeConfig` público é
resolvido no build por causa do `ssr: false`.

## Testes

`tests/precache.test.mjs` cobre o gerador do manifesto: separação shell/assets,
hashes por conteúdo, exclusão do `sw.js`, revisão estável entre builds iguais e
o carimbo no `sw.js`.
