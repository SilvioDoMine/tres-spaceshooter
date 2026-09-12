import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@tresjs/nuxt', '@nuxt/devtools', '@pinia/nuxt'],
  compatibilityDate: '2025-11-01',
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  devtools: { enabled: false },
  ssr: false,
  runtimeConfig: {
    public: {
      // Preenchido no build pelo Dockerfile a partir do build arg APP_VERSION,
      // que o workflow Release & Deploy grava no Coolify antes de cada deploy.
      // Sem nenhuma das duas (dev local sem .env), vira 'DEBUG'.
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || process.env.APP_VERSION || 'DEBUG',
    },
  },
  extends: [
    'nuxt-unified-confetti',
  ],
})

