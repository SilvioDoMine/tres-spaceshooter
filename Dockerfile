FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .

# Versão do release. O Coolify injeta APP_VERSION como build arg (Advanced ->
# "Inject Build Args to Dockerfile"); o workflow Release & Deploy grava o valor
# antes de disparar o build. Como a app roda em SPA (ssr: false), o runtimeConfig
# publico e resolvido no build, entao a versao precisa entrar aqui e nao so em runtime.
ARG APP_VERSION=dev
ENV NUXT_PUBLIC_APP_VERSION=$APP_VERSION

ENV NUXT_TELEMETRY_DISABLED=1
ENV NITRO_PRESET=node-server
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
ENV NUXT_PUBLIC_APP_VERSION=$APP_VERSION

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --chown=node:node --from=builder /app/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
