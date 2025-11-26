import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@tresjs/nuxt', '@nuxt/devtools', '@pinia/nuxt'],
  compatibilityDate: '2025-11-01',
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  devtools: { enabled: true }
})