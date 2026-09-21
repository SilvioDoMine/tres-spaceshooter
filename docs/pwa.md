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
| `app/components/ui/AppUpdateToast.vue` | Aviso de versão nova: espera a saída da partida, ou reinício obrigatório. |
| `app/components/AppLoadingScreen.vue` | Tela de loading; mostra "Atualizando para vX.Y.Z" quando a troca acontece ali. |

## Como o cache funciona

1. **Build.** O hook `nitro:build:public-assets` varre `.output/public`, gera
   `precache-manifest.json` (`shell` = HTML/JS/CSS/ícones, `assets` = imagens,
   modelos, sons e fontes, cada um com hash de conteúdo) e substitui
   `__BUILD_REVISION__` dentro do `sw.js` publicado.
2. **Primeira visita.** O service worker instala o shell. Os ~26 MB de assets
   entram no cache enquanto a tela de loading (`useAssetPreloader`) os baixa —
   o `fetch` handler é cache-first e guarda o que vem da rede **com o `rev` do
   arquivo carimbado no header `x-precache-rev`**, então nada é baixado duas
   vezes. Quando o preload termina, o app manda `PRECACHE_ALL` e o service worker
   completa o que ficou faltando.
3. **Visitas seguintes.** Tudo sai do cache; o jogo abre sem rede.
4. **Deploy novo.** Como o `sw.js` carrega a revisão do build, o navegador
   reinstala o service worker:
   - no `install`, ele baixa o shell e os arquivos **que ainda não existem** no
     cache (`onlyMissing`). Não sobrescreve nada: a versão antiga ainda está
     servindo a sessão aberta, e trocar um asset ali seria trocá-lo debaixo de
     quem está jogando;
   - no `activate`, já depois da troca, o `dropStale` apaga o que saiu do
     manifesto **e o que continua nele com `rev` diferente**. Sem essa segunda
     parte, cache-first serviria o `/models/x.glb` velho durante a sessão inteira
     — o jogo rodaria código novo com assets antigos.

O `x-precache-rev` substituiu um índice `url -> rev` guardado à parte no cache. O
índice só era escrito pelo precache, nunca pelo fetch handler, então tudo o que a
tela de loading baixava aparecia como ausente e era baixado uma segunda vez.

## Atualização automática

O jogador não precisa fazer nada nem reinstalar. `plugins/pwa.client.ts` aplica a
versão nova sozinho (`SKIP_WAITING` + reload) no primeiro momento em que ela não
custa nada:

1. **Na tela de loading.** É o momento preferido: ali não existe partida para
   perder e a troca não cobra um segundo carregamento. Enquanto uma versão nova
   está baixando, `app.vue` segura a tela de loading (`pwa.updateInstalling`, com
   teto de 5 s em `usePwa`) e mostra "Atualizando para vX.Y.Z". Sem isso o jogador
   baixaria os 26 MB, chegaria ao lobby e levaria um reload imediato — dois
   carregamentos seguidos.
2. **Fora da partida.** Sem modal aberto e fora de `/play`, a troca acontece na
   hora. Recarregar durante uma run perderia a partida, e durante um baú cortaria
   a animação; nesses casos espera, e quem está jogando vê o `AppUpdateToast`.

A busca por versão nova acontece na abertura (registro do service worker), ao voltar
do segundo plano (`visibilitychange`), **ao sair da partida** e a cada 15 minutos.
Nas Configurações há um botão **Procurar atualizações** para conferir na hora.

### Atualização obrigatória

`precache-manifest.json` carrega, junto da `version`, um `minVersion`: a versão mais
antiga que ainda pode jogar. Quando a versão em execução é anterior a ela
(`pwa.updateRequired`), a troca deixa de esperar um momento conveniente — o aviso
aparece em qualquer tela e o jogo reinicia em ~4 s, inclusive no meio de uma run.

O padrão de `minVersion` é o **major da própria versão**: `scripts/next-version.sh`
já promove a major todo commit marcado `feat!:`, `BREAKING CHANGE` ou `[major]`, e é
lá que se declara que um release quebra save ou balanceamento. Para forçar o mesmo
efeito sem um major bump, defina `APP_MIN_VERSION` no build (build arg, igual ao
`APP_VERSION`). Build sem tag (`DEBUG`) nunca obriga nada.

`npm run build` imprime as duas linhas:

```
[pwa] precache-manifest: N do shell + M assets (X MB)
[pwa] versão v2.9.6 — obrigatória a partir de v2.0.0
```

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

## Área segura (Dynamic Island, notch, indicador de home)

Instalado no iPhone, o jogo ocupa a tela inteira e a Dynamic Island engolia a
barra do topo enquanto o indicador de home cobria a TabBar. A correção está em
`app/app.vue`:

- `:root` declara `--safe-top/right/bottom/left` a partir de `env(safe-area-inset-*)`;
- `.game-root` usa essas variáveis em `top/right/bottom/left` (não em `padding`:
  o containing block de um filho `absolute` é o *padding box* do ancestral, então
  padding não afastaria nada) e recebe `transform: translateZ(0)`, o que faz dele
  o containing block também dos filhos `position: fixed` — modais, joystick,
  avisos e HUD da partida passam a respeitar a área visível sem precisar de
  ajuste individual.

As faixas resultantes ficam com o fundo do `body` em `#000814`, a mesma
`clear-color` dos `TresCanvas`, para a emenda não aparecer. Modais que limitavam
altura por `100dvh` descontam as variáveis (`BaseModal`, `shop/Dialog`,
`equipment/ItemModal`).

Para conferir o layout no navegador, sem iPhone, simule as medidas do aparelho:

```js
document.documentElement.style.setProperty('--safe-top', '59px');
document.documentElement.style.setProperty('--safe-bottom', '34px');
```

## Som no iPhone

Instalar o jogo **não** libera o áudio: o WebKit exige um toque do jogador antes
de tocar qualquer som, dentro ou fora do app instalado. O que o jogo faz
(`composables/useAudio.js` + `plugins/audioUnlock.client.ts`):

- a tela de loading decodifica os efeitos num `OfflineAudioContext`, que não
  precisa de gesto — antes o `AudioContext` real nascia ali, travado, e no iOS um
  contexto criado assim frequentemente não volta mais;
- o contexto que toca é criado no primeiro toque, em qualquer tela, com
  `resume()` e um buffer mudo de um quadro (o que o WebKit exige para abrir a saída);
- ao voltar do segundo plano o contexto é retomado (`visibilitychange` e `focus`),
  porque o iOS interrompe o áudio quando o app sai da frente;
- `audioBlocked` fica `true` quando o contexto não roda mesmo depois do toque, e
  as Configurações mostram o aviso correspondente.

O que **não** dá para resolver por código: a chavinha de silencioso na lateral do
iPhone silencia áudio da web, inclusive de PWA instalado — um app nativo escolhe
a categoria de áudio, uma página não. Por isso o aviso cita a chavinha.

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
hashes por conteúdo, exclusão do `sw.js`, revisão estável entre builds iguais, o
carimbo no `sw.js` e a derivação do `minVersion` (major da versão, override por
`APP_MIN_VERSION`, `DEBUG` sem obrigatoriedade).

O comportamento do service worker em si se verifica com dois builds em sequência:
publique `v1.0.0`, deixe o jogo carregar, troque o conteúdo de um asset, publique
`v1.0.1` e recarregue. O asset novo tem de aparecer **nesta** sessão, com um único
carregamento.
