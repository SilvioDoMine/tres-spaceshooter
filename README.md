# tres-spaceshooter

> A TresJS Nuxt application

## Features

- [Nuxt 3](https://nuxt.com) with [TresJS](https://tresjs.org)
- [TresJS Nuxt Module](https://github.com/tresjs/nuxt) pre-configured 📦
- `@tresjs/cientos` package pre-installed 📦
- TypeScript support 🦄
- ESLint configuration 🔧
- Server-side rendering (SSR) ready 🚀

## Getting Started

### Install dependencies

```bash
npm install
```

### Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

### Build

Build the application for production:

```bash
npm run build
```

### Preview

Locally preview production build:

```bash
npm run preview
```

### Generate

Generate static site:

```bash
npm run generate
```

### Lint

Run ESLint:

```bash
npm run lint
```

Fix ESLint issues:

```bash
npm run lint:fix
```

## Learn More

- [TresJS Documentation](https://tresjs.org)
- [TresJS Nuxt Module](https://github.com/tresjs/nuxt)
- [Nuxt 3 Documentation](https://nuxt.com/docs/getting-started/introduction)
- [Three.js Documentation](https://threejs.org/docs/)

## Versionamento e Deploy

Todo push em `main` roda o workflow **Release & Deploy**
(`.github/workflows/release-and-deploy.yml`), que faz, em ordem:

1. **Versiona** — calcula a próxima tag SemVer com `scripts/next-version.sh` e a
   cria. Se o commit já tiver uma tag, ela é reaproveitada (nada é duplicado).
2. **Grava a versão no Coolify** — escreve `APP_VERSION=<tag>` como variável de
   ambiente *de build* da aplicação, e relê para confirmar.
3. **Dispara o deploy** e aguarda o Coolify terminar. O job falha se o build falhar.

O **Auto Deploy do Coolify fica desligado de propósito**: quem manda buildar é o
workflow, depois de a versão já estar gravada. Se ligar o Auto Deploy de volta, o
Coolify começa a buildar no instante do push e o container sobe com a versão do
deploy anterior.

### Como o bump é decidido

A partir da última tag alcançável, lendo as mensagens dos commits novos:

| Na mensagem do commit                          | Bump    |
| ---------------------------------------------- | ------- |
| `feat!:`, `fix!:`, `BREAKING CHANGE`, `[major]` | major   |
| `feat:`, `feat(escopo):`, `[minor]`             | minor   |
| qualquer outra coisa                            | patch   |
| `[skip tag]` / `[no tag]` (na 1ª linha)         | nenhuma |

Como os commits daqui não seguem conventional commits, o padrão é **patch**.
Para subir minor ou major, escreva `feat:` ou inclua `[minor]` / `[major]` na
mensagem.

Com `[skip tag]` nenhuma tag é criada e o deploy usa a descrição do git
(ex. `v2.0.1-3-gabc1234`) como versão.

### Deploy manual

Actions → **Release & Deploy** → *Run workflow*:

- **version** — tag existente a reimplantar (ex. `v2.0.0`). Vazio versiona o
  `HEAD` de `main`. Uma tag informada aqui nunca é criada nem movida: ela
  precisa já existir.
- **deploy** — desmarque para só gerar a tag, sem implantar.
- **force** — força o rebuild mesmo sem commit novo (já vem ligado quando você
  informa uma tag, porque reimplantar a mesma tag não gera commit novo).

### Configuração necessária

Em *Settings → Secrets and variables → Actions*:

| Nome                | Tipo     | Conteúdo                                             |
| ------------------- | -------- | ---------------------------------------------------- |
| `COOLIFY_URL`       | Variable | URL da instância do Coolify                          |
| `COOLIFY_TOKEN`     | Secret   | API token do Coolify (time correto, `write`+`deploy`)|
| `COOLIFY_APP_UUID`  | Variable | UUID da aplicação no Coolify                         |

No Coolify, a aplicação precisa de *Advanced →* **Inject Build Args to
Dockerfile** ligado, para que `APP_VERSION` chegue ao `ARG` do `Dockerfile`.

### Lendo a versão dentro do jogo

O `Dockerfile` transforma o build arg `APP_VERSION` em `NUXT_PUBLIC_APP_VERSION`,
exposto via `runtimeConfig.public.appVersion`:

```ts
const { appVersion } = useRuntimeConfig().public
```

Fora do deploy (dev local, sem `.env`) o valor é `DEBUG`.

## Deployment

Check out the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.