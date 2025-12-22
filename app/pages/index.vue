<script setup lang="ts">
import { useLobbyStore } from '~/stores/useLobbyStore';
import { useModal } from '~/composables/useModal';
import { LEVEL_1 } from '~/games/levels/LevelOneConfig';

// Page metadata
useHead({
  title: 'Lobby - Spaceshooter',
  meta: [
    { name: 'description', content: 'Spaceshooter like Archero' }
  ]
})

const lobbyStore = useLobbyStore();
const currentRunStore = useCurrentRunStore();
const router = useRouter();
const isAnimating = ref(false);

// ✅ NOVO SISTEMA DE MODAIS REUTILIZÁVEL
// Exemplo de uso do composable useModal
const profileModal = useModal('profile-modal');

/**
 * Abre o modal de perfil usando o sistema de modais reutilizável
 *
 * FORMAS DE USO:
 *
 * 1. Abrir:
 *    profileModal.open()
 *
 * 2. Fechar:
 *    profileModal.close()
 *
 * 3. Verificar se está aberto:
 *    profileModal.isOpen.value
 *
 * 4. Empilhar modais:
 *    const modal2 = useModal('outro-modal-id')
 *    modal2.open() // Abre por cima do profileModal
 */
function openProfileModal() {
  profileModal.open();
}

function startGame() {
  console.log('Iniciando o jogo...');
  currentRunStore.initializeLevel(LEVEL_1);
}

async function handleButtonClick() {
  if (isAnimating.value) return;

  isAnimating.value = true;

  // Aguarda a animação terminar (300ms)
  await new Promise(resolve => setTimeout(resolve, 300));

  // Navega para a rota
  router.push('/play/1');
}

function formatCurrency(amount: number): string {
  // Transform to be uppercase and with K for thousands, M for millions
  if (amount >= 1_000_000) {
    return (Math.floor(amount / 100) / 10).toFixed(1) + 'M';
  } else if (amount >= 1_000) {
    return (Math.floor(amount / 100) / 10).toFixed(1) + 'K';
  } else {
    return amount.toString();
  }
}
</script>

<template>
  <!-- Dark Blue color-->
  <TresCanvas
    clear-color="#000814"
    window-size
  >
    <Stars />
    <Stars :size="2" :count="1500" :depth="600" />
  </TresCanvas>
  
  <div id="lobby-stuff" class="w-full h-full absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
    <!-- Relative full content -->
    <div class="relative w-full h-full">

      <!-- Topbar -->
      <div class="w-full h-17 absolute top-0 pointer-events-auto">
        <!-- Icon absolute 64x64 -->
        <div @click="openProfileModal" class="absolute cursor-pointer top-2 left-2 w-16 h-16 bg-linear-to-b from-gray-400 to-gray-600 rounded flex items-center justify-center">
          <img 
            :src="`/images/icons/${lobbyStore.getCurrentProfilePicture.iconPath}`" 
            alt="user-icon" 
            class="w-13 h-13 rounded-sm"
          />
        </div>

        <!-- Half top -->
        <div class="bg-white/10 w-full h-10 flex justify-between items-center pl-20 pr-2 text-sm">
          <!-- User Name & Level Bar -->
          <div @click="openProfileModal" class="text-white text-md font-bold flex flex-col cursor-pointer">
            <!-- Level & User -->
            <div class="flex gap-2 items-center h-full">
              <p class="text-blue-400 w-6 font-bold text-center">99</p>
              <div>
                <p>{{ lobbyStore.getCurrentProfileName }}</p>
                <!-- Mini level bar -->
                <div class="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-400 rounded-full" style="width: 100%;"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- Right side -->
          <div class="flex gap-2">
            <!-- Energy Count -->
            <div class="bg-white/10 px-2 pr-3 py-0.5 flex items-center justify-between gap-2 rounded-full cursor-pointer">
              <!-- Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="text-emerald-600"><!-- Icon from Remix Icon by Remix Design - https://github.com/Remix-Design/RemixIcon/blob/master/License --><path fill="currentColor" d="M14.005 2.003a8 8 0 0 1 3.292 15.293A8 8 0 1 1 6.711 6.71a8 8 0 0 1 7.294-4.707m-3 7h-2v1a2.5 2.5 0 0 0-.164 4.995l.164.005h2l.09.008a.5.5 0 0 1 0 .984l-.09.008h-4v2h2v1h2v-1a2.5 2.5 0 0 0 .164-4.995l-.164-.005h-2l-.09-.008a.5.5 0 0 1 0-.984l.09-.008h4v-2h-2zm3-5A6 6 0 0 0 9.52 6.016a8 8 0 0 1 8.47 8.471a6 6 0 0 0-3.986-10.484"/></svg>

              <!-- Text -->
              <span class="font-bold text-white">{{ formatCurrency(0) }}</span>
            </div>

            <!-- Gold Count -->
            <div class="bg-white/10 px-2 pr-3 py-0.5 flex items-center justify-between gap-2 rounded-full cursor-pointer">
              <!-- Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-amber-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>

              <!-- Text -->
              <span class="font-bold text-white">{{ formatCurrency(currentRunStore.totalGold) }}</span>
            </div>
          </div>
        </div>
        <!-- Half bottom -->
        <div class="w-full h-7 flex">
          <div class="bg-white/10 pb-2 rounded-br-full h-full pl-20 pr-10 flex items-center justify-center text-xl gap-2 text-yellow-400">
            <svg @click="openProfileModal" class="cursor-pointer" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><!-- Icon from Phosphor by Phosphor Icons - https://github.com/phosphor-icons/core/blob/main/LICENSE --><g fill="currentColor"><path d="M240 56v128a16 16 0 0 1-16 16H72v-48h56v-48h56V56Z" opacity=".2"/><path d="M248 56a8 8 0 0 1-8 8h-48v40a8 8 0 0 1-8 8h-48v40a8 8 0 0 1-8 8H80v40a8 8 0 0 1-8 8H16a8 8 0 0 1 0-16h48v-40a8 8 0 0 1 8-8h48v-40a8 8 0 0 1 8-8h48V56a8 8 0 0 1 8-8h56a8 8 0 0 1 8 8"/></g></svg>
            <h1 @click="openProfileModal" class="
              cursor-pointer
              relative text-base lg:text-xl font-extrabold tracking-tight
              text-transparent bg-clip-text
              bg-[linear-gradient(180deg,#FFF9C9_0%,#FFE27A_18%,#FFCC33_40%,#F6A800_58%,#7A4A00_100%)]
              drop-shadow-[0_3px_0_rgba(90,55,0,0.75)]
            ">
              <span class="
                absolute inset-0 -z-10
                text-yellow-300
                [text-shadow:
                  0_1px_0_rgba(255,255,255,0.35),
                  0_3px_0_rgba(90,55,0,0.85),
                  0_6px_10px_rgba(0,0,0,0.35)
                ]
              ">10917º</span>
              10917º
            </h1>
          </div>
        </div>
      </div>

      <!-- Hud Middle -->
      <div class="absolute top-24 w-full flex px-2 flex-row justify-between pointer-events-none">
        <!-- Left -->
        <div class="flex flex-col gap-2">
          <!-- Settings -->
          <div class="p-2 bg-white/20 rounded-lg inline-flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-white/20 transition hud-button-shake active:translate-y-1 active:shadow-inner active:bg-white/30">
            <svg class="text-white/80" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M10 20q-.825 0-1.412-.587T8 18t.588-1.412T10 16h10q.825 0 1.413.588T22 18t-.587 1.413T20 20zm0-6q-.825 0-1.412-.587T8 12t.588-1.412T10 10h10q.825 0 1.413.588T22 12t-.587 1.413T20 14zm0-6q-.825 0-1.412-.587T8 6t.588-1.412T10 4h10q.825 0 1.413.588T22 6t-.587 1.413T20 8zM4 8q-.825 0-1.412-.587T2 6t.588-1.412T4 4t1.413.588T6 6t-.587 1.413T4 8m0 6q-.825 0-1.412-.587T2 12t.588-1.412T4 10t1.413.588T6 12t-.587 1.413T4 14m0 6q-.825 0-1.412-.587T2 18t.588-1.412T4 16t1.413.588T6 18t-.587 1.413T4 20"/></svg>
          </div>

          <div class="aspect-square relative bg-white/20 rounded-lg flex-col flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-white/20 transition hud-button-shake active:translate-y-1 active:shadow-inner active:bg-white/30">
            <svg class="mx-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64"><!-- Icon from Emoji One (v1) by Emoji One - https://creativecommons.org/licenses/by-sa/4.0/ --><path fill="#d07929" d="M57.3 16L29.81 2.442c-.624-.307-1.282-.733-2.01-.514c-.449.137-.89.464-1.292.692l-6.334 3.611q-8.393 4.791-16.794 9.582c-.722.414-1.447.823-2.171 1.237a1.5 1.5 0 0 0-.57.333c-.796.527-.798 1.424-.384 2.078c.117.232.302.445.558.621l26.09 17.615q.914.616 1.826 1.235c.435.291 1.198.271 1.619-.039q12.619-9.402 25.24-18.809q.89-.659 1.771-1.317c.907-.673 1.1-2.191-.061-2.767"/><path fill="#f6921e" d="M30.935 37.29c-.201-.667-.888-1.03-1.43-1.401c-8.868-6.05-17.736-12.09-26.604-18.15a1.22 1.22 0 0 0-.851-.534c-.841-.351-1.59.218-1.861.987a1.65 1.65 0 0 0-.128 1.046c.901 4.859 1.808 9.722 2.711 14.582l1.611 8.66c.222 1.179.23 2.224 1.225 3l23.26 18.15c1.056.823 2.741.308 2.706-1.194l-.351-15.12c-.064-2.777-.131-5.552-.191-8.33c-.013-.538.057-1.186-.097-1.706"/><path fill="#9a5524" d="M.946 23.839c.32-.175.701-.23 1.104-.062c.335.055.644.225.851.535l26.604 18.15c.542.371 1.229.733 1.43 1.4c.154.523.084 1.167.098 1.705q.093 4.167.191 8.334l.208 9.05c.088-.199.148-.418.143-.68l-.351-15.12c-.064-2.777-.131-5.556-.191-8.334c-.014-.535.057-1.183-.098-1.705c-.201-.665-.888-1.03-1.43-1.4c-8.868-6.05-17.736-12.09-26.604-18.15a1.24 1.24 0 0 0-.851-.535c-.841-.349-1.59.221-1.861.989a1.64 1.64 0 0 0-.128 1.045Q.5 21.45.946 23.839"/><path fill="#d07929" d="M55.75 16.14L31.011 34.457c-.552.406-1.104.817-1.652 1.224c-.057.041-.1.08-.146.119c-.363.263-.609.69-.597 1.285c.199 8.469.394 16.943.591 25.413c.035 1.502 1.699 1.939 2.686 1.069q10.877-9.564 21.763-19.12c.815-.718.761-2.657.911-3.641c.462-2.995.918-5.989 1.377-8.984c.714-4.645 1.426-9.282 2.136-13.924c.194-1.258-1.114-2.654-2.33-1.753"/><path fill="#9a5524" d="M29.21 41.979c.046-.035.091-.074.146-.113c.546-.391 1.1-.788 1.652-1.175q12.369-8.82 24.741-17.631c.526-.378 1.069-.322 1.5-.055c.275-1.726.552-3.457.825-5.185c.197-1.209-1.111-2.553-2.325-1.689L31.008 33.762c-.552.393-1.106.786-1.652 1.177c-.055.039-.1.078-.146.115c-.361.253-.607.665-.595 1.236q.076 3.11.15 6.224c.106-.22.256-.403.445-.535"/><g fill="#be202e"><path d="M37.507 6.244L9.576 22.12l9 6.14l26.08-18.488z"/><path d="m19.427 6.663l28.19 15.265l-10.18 7.252l-24.706-18.693z"/></g><g fill="#cc2f42"><path d="m18.581 28.26l1.225 28.31l-8.108-6.33l-2.122-28.12m27.857 7.06V58.7l9.242-8.119l.938-28.653"/><path d="M26.06 6.03c-3.531 2.928-5.442 8.232-5.879 12.176c-.468 4.208-.554 8.615-3.191 12.188c-.378.513-.043.829.488.507c1.531-.938 2.848-2.062 4.067-3.339c.778 1.58.521 3.451.345 5.177c-.082.784 1.086-.185 1.258-.364c3.58-3.919 2.405-8.749 3.365-13.616C29.056 5.876 28.557 3.962 26.06 6.03"/><path d="M31.1 18.654c2.255 4.417 2.435 9.385 6.954 12.177c.207.125 1.6.739 1.308.008c-.635-1.613-1.399-3.342-1.079-5.072c1.518.899 3.092 1.621 4.826 2.103c.601.164.827-.226.323-.62c-3.507-2.72-4.795-6.933-6.391-10.854c-1.502-3.677-4.783-8.263-8.981-10.11c-2.967-1.309-2.92.667 3.04 12.367"/><path d="M14.12 3.485c3.798-.53 12.446 1.024 12.91 4.354c.462 3.328-7.434 7.179-11.229 7.709c-3.796.527-6.081-1.912-6.544-5.24c-.468-3.333 1.069-6.296 4.863-6.823M38.27.126c-3.8.532-11.695 4.383-11.23 7.713c.462 3.328 9.114 4.879 12.902 4.354c3.804-.53 5.333-3.496 4.869-6.826C44.35 2.03 42.067-.4 38.27.126"/></g><path fill="#ef556c" d="M33.935 6.175a4.71 4.71 0 0 1-4.02 5.312l-4.655.649a4.71 4.71 0 0 1-5.317-4.01a4.717 4.717 0 0 1 4.02-5.316l4.662-.649a4.72 4.72 0 0 1 5.315 4.02"/></svg>
            <span class="bottom-0 text-xs text-white font-semibold">Grátis</span>
          </div>
        </div>

        <!-- Center -->
        <div></div>

        <!-- Right -->
        <div class="flex flex-col gap-2">
           <!-- Ranking -->
          <div class="aspect-square relative bg-white/20 rounded-lg flex-col flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-white/20 transition hud-button-shake active:translate-y-1 active:shadow-inner active:bg-white/30">
            <svg class="mx-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Ultimate color icons by Streamline - https://creativecommons.org/licenses/by/4.0/ --><g fill="none"><path fill="#ffbc44" stroke="#191919" stroke-linecap="round" stroke-linejoin="round" d="M22.522 17.032h-7.174v-4.783a.48.48 0 0 0-.478-.478H9.13a.48.48 0 0 0-.478.478v4.783H1.478A.48.48 0 0 0 1 17.51v4.783a.48.48 0 0 0 .478.478h21.044a.48.48 0 0 0 .478-.478V17.51a.48.48 0 0 0-.478-.478"/><path fill="#e3e3e3" d="M7.696 9.38a3.8 3.8 0 0 1 .373-1.518c.264-.528 1.366-.894 2.75-1.406c.374-.14.314-1.012.148-1.194a2.76 2.76 0 0 1-.718-2.14a1.757 1.757 0 1 1 3.502 0a2.77 2.77 0 0 1-.717 2.14c-.166.183-.227 1.052.147 1.194c1.384.512 2.487.878 2.75 1.406c.23.474.356.992.374 1.518"/><path stroke="#191919" stroke-linecap="round" stroke-linejoin="round" d="M7.696 9.38a3.8 3.8 0 0 1 .373-1.518c.264-.528 1.366-.894 2.75-1.406c.374-.14.314-1.012.148-1.194a2.76 2.76 0 0 1-.718-2.14a1.757 1.757 0 1 1 3.502 0a2.77 2.77 0 0 1-.717 2.14c-.166.183-.227 1.052.147 1.194c1.384.512 2.487.878 2.75 1.406c.23.474.356.992.374 1.518"/><path fill="#e3e3e3" d="M5.985 14.162c-.41-.168-.894-.34-1.414-.534c-.374-.138-.314-1.012-.148-1.193a2.76 2.76 0 0 0 .718-2.141a1.712 1.712 0 0 0-1.75-1.872a1.712 1.712 0 0 0-1.751 1.872a2.76 2.76 0 0 0 .717 2.14c.166.183.227 1.053-.147 1.194c-.438.162-.847.31-1.21.453"/><path stroke="#191919" stroke-linecap="round" stroke-linejoin="round" d="M5.985 14.162c-.41-.168-.894-.34-1.414-.534c-.374-.138-.314-1.012-.148-1.193a2.76 2.76 0 0 0 .718-2.141a1.712 1.712 0 0 0-1.75-1.872a1.712 1.712 0 0 0-1.751 1.872a2.76 2.76 0 0 0 .717 2.14c.166.183.227 1.053-.147 1.194c-.438.162-.847.31-1.21.453"/><path fill="#e3e3e3" d="M18.013 14.162c.411-.168.894-.34 1.414-.534c.374-.138.314-1.011.148-1.193a2.76 2.76 0 0 1-.718-2.14a1.757 1.757 0 1 1 3.502 0a2.76 2.76 0 0 1-.717 2.14c-.166.183-.227 1.052.147 1.194c.438.161.847.31 1.211.452"/><path stroke="#191919" stroke-linecap="round" stroke-linejoin="round" d="M18.013 14.162c.411-.168.894-.34 1.414-.534c.374-.138.314-1.011.148-1.193a2.76 2.76 0 0 1-.718-2.14a1.757 1.757 0 1 1 3.502 0a2.76 2.76 0 0 1-.717 2.14c-.166.183-.227 1.052.147 1.194c.438.161.847.31 1.211.452"/></g></svg>
            <span class="bottom-0 text-xs text-white font-semibold">Ranking</span>
          </div>

           <!-- Missões -->
          <div class="bg-white/20 rounded-lg flex-col flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-white/20 transition hud-button-shake active:translate-y-1 active:shadow-inner active:bg-white/30">
            <svg class="mx-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 128 128"><!-- Icon from Noto Emoji (v1) by Google Inc - https://github.com/googlefonts/noto-emoji/blob/main/svg/LICENSE --><path fill="#855c52" d="M97.38 85.78c10.86-13.89 27.03-38.64 27.03-38.64s3.33-4.27 2.79-6.85c-.68-3.23-4.6-5.01-6.91-6.91c-1.22-1.01-2.45-1.86-3.74-2.75c-2.84-1.96-5.66-3.91-8.47-5.84c-5.97-4.1-11.91-8.12-17.87-11.99c-5.88-3.83-11.91-7.2-17.9-10.65c-3.01-1.74-5.53-2.72-8.54-.58c-3.65 2.6-6.71 6.28-9.89 9.63c-3.49 3.67-21.26 22.66-25.07 26.52c-5.01 5.08-10.08 10.23-15.24 15.46c-2.27 2.3-4.59 4.58-6.84 6.96c-2.78 2.93-7.61 7.26-5.45 11.32c2.25 4.23 6.65 7.52 10.06 10.83c9.14 8.86 18.43 17.96 28 27.13c4 3.83 8.06 7.69 12.06 11.68c2.81 2.81 7.51 7.11 11.71 6.49c2.46-.37 6.36-4.73 6.36-4.73s17.05-23.18 27.91-37.08"/><path fill="#fff" d="M89.25 77.87c6.34-8.53 12.58-17.14 18.46-25.99c1.29-1.94 4.85-5.99 4.77-8.49c-.05-1.37-2.16-2.33-3.08-3.12c-1.69-1.46-3.87-2.64-5.74-3.93c-2.13-1.47-4.25-2.94-6.37-4.39c-5.27-3.62-10.63-7.15-15.94-10.72c-2.74-1.84-5.46-3.69-8.17-5.58c-1.65-1.15-4.19-3.78-6.28-3.92c-.47-.03-.38-.11-.89.19c-1.57.91-3.02 2.66-4.24 4c-1.76 1.93-3.47 3.9-5.27 5.8c-2.63 2.76-16.01 17.05-18.88 19.96c-3.76 3.81-7.71 7.44-11.5 11.23c-3.5 3.5-6.47 7.37-9.78 11.02c-1.39 1.52-.98 2.22.08 3.69c2.68 3.73 7.25 6.51 10.79 9.46c6.84 5.71 13.26 11.76 19.56 18.04c4.69 4.67 10.03 8.61 14.96 13c.75.66 1.41 1.45 2.54 1.1c.4-.12.75-.56 1.03-.82c4.63-4.31 8.36-9.85 12.15-14.87c3.94-5.21 7.89-10.42 11.8-15.66"/><path fill="#78a3ad" d="M112.7 15.6c-.24-.88-.65-1.75-1.21-2.58c-1.47-2.21-3.53-3.88-5.6-5.48c-3.03-2.34-7.09-4.31-10.95-4.46c-1.96-.07-3.41 1.11-4.7 2.43c-.58.59-1.08 1.15-1.96 1.12c-.83-.03-1.59-.51-2.39-.64c-2.43-.4-4.49 1.22-6.02 2.91c-1.67 1.83-3.31 3.79-4.75 5.77c-1.03 1.41-1.97 2.94-2.53 4.6c-.88 2.63-.56 5.08 1.6 6.89c2.25 1.89 4.23 4.14 6.5 5.99c3.11 2.53 6.67 4.4 10.03 6.56c4.78 3.07 8.66 4.26 13.28.12c.17-.15.33-.31.5-.47c1.93-1.86 3.64-4 4.9-6.37c.35-.67.53-1.4.78-2.1c.18-.5.53-.96.68-1.44c.4-1.24.05-3.01.04-4.3c-.02-1.47.94-2.49 1.47-3.79c.67-1.64.75-3.24.33-4.76"/><path fill="#2f2f2f" d="M114.62 14.96q-.405-1.455-1.32-2.82c-1.61-2.42-3.87-4.25-6.15-6c-3.32-2.57-7.77-4.72-11.98-4.88c-2.15-.08-3.74 1.21-5.16 2.66c-.62.64-1.18 1.26-2.15 1.23c-.9-.04-1.73-.56-2.62-.7c-2.66-.44-4.91 1.34-6.59 3.18c-1.82 2-3.62 4.15-5.2 6.32c-1.13 1.55-2.16 3.22-2.77 5.04c-.97 2.88-.62 5.56 1.75 7.54c2.46 2.07 4.63 4.53 7.12 6.56c3.41 2.77 7.31 4.82 10.99 7.18c5.24 3.36 9.49 4.67 14.54.13c.19-.17.38-.34.56-.52c2.11-2.03 3.99-4.38 5.37-6.98c.39-.73.58-1.53.85-2.3c.19-.54.57-1.05.75-1.58c.44-1.36.05-3.29.04-4.71c-.01-1.61 1.03-2.73 1.6-4.15c.75-1.78.83-3.53.37-5.2M97.33 6.24c2.21.45 4.28 1.53 6.17 2.74c2.06 1.32 6.63 4.66 3.6 7.4c-1.3 1.18-1.85-.32-2.79-1.04c-1.88-1.45-3.81-2.87-5.73-4.27c-.92-.67-5.01-2.27-4.72-3.68c.25-1.26 1.65-1.52 3.47-1.15m3.33 29.7c-2.66 1.72-5.16.63-7.75-.97c-2.47-1.52-5.09-2.8-7.43-4.51c-2.83-2.05-5.65-4.41-8.34-6.64c-2.81-2.33-.11-7.14 1.73-9.16c1.11-1.22 2.8-2.99 4.28-3.76c2.16-1.12 4.27.29 6.24 1.31c4.82 2.47 9.46 5.37 13.57 8.92c1.4 1.21 4.12 3.41 3.79 5.55c-.12.77-.62 1.83-.91 2.54c-1.01 2.45-2.74 5.01-4.92 6.56c-.1.06-.18.11-.26.16"/><path fill="#fff" d="M81.31 14.07s2.35-3.31 4.34-2.34c1.6.77 10.06 5.83 11.65 7.02s.07 1.11-1.72.63s-7.43-3.42-9.42-3.02s-6.9 3.43-8.1 3.43c-1.19 0 1.94-4 3.25-5.72"/></svg>
            <span class="bottom-0 text-xs text-white font-semibold">Missões</span>
          </div>
        </div>
      </div>


      <!-- Tailwind shine golden button with shimmer effect on the bottom middle of the page -->
      <div class="absolute bottom-30 left-1/2 -translate-x-1/2 w-full px-4 flex justify-center">
        <div class="w-full max-w-md pointer-events-auto">
          <button
            @click="handleButtonClick"
            :class="[
              'relative isolate overflow-hidden',
              'cursor-pointer',
              'w-full h-23',
              'rounded-2xl',
              'border-[5px] border-[#c97813]',
              'shadow-[0_10px_0_#9b5c0f,0_14px_26px_rgba(0,0,0,.25)]',
              'bg-linear-to-b from-[#ffe59a] via-[#ffd058] to-[#ffb321]',
              'transition-all duration-150',
              'active:translate-y-2 active:shadow-[0_6px_0_#9b5c0f,0_8px_16px_rgba(0,0,0,.25)]',
              { 'animate-click-bounce': isAnimating }
            ]"
          >
            <!-- gloss (faixa clara no topo) -->
            <span
              class="pointer-events-none absolute inset-x-2 top-2 h-[36%] rounded-xl
                    bg-linear-to-b from-white/55 to-white/0"
            ></span>

            <!-- stripes diagonais (textura) -->
            <span
              class="pointer-events-none absolute inset-0 opacity-[0.18]
                    bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.55)_0_22px,rgba(255,255,255,0)_22px_44px)]"
            ></span>

            <!-- shine animado (o “fundo mexendo”) -->
            <span
              class="pointer-events-none absolute -inset-y-10 -inset-x-24
                    bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,.0)_35%,rgba(255,255,255,.55)_50%,rgba(255,255,255,.0)_65%,transparent_100%)]
                    blur-[1px] opacity-70
                    animate-shine"
            ></span>

            <!-- conteúdo -->
            <div class="relative h-full w-full grid place-items-center">
              <div class="text-center leading-none">
                <div class="font-extrabold tracking-wide text-[#6b3a08] text-3xl drop-shadow-[0_2px_0_rgba(255,255,255,.35)]">
                  INICIAR
                </div>

                <div v-if="false" class="mt-2 flex items-center justify-center gap-0 font-extrabold text-[#6b3a08] text-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 1024 1024" class="text-lime-600"><!-- Icon from Ant Design Icons by HeskeyBaozi - https://github.com/ant-design/ant-design-icons/blob/master/LICENSE --><path fill="currentColor" fill-opacity=".15" d="M695.4 164.1H470.8L281.2 491.5h157.4l-60.3 241l319.8-305.1h-211z"/><path fill="currentColor" d="M848.1 359.3H627.8L825.9 109c4.1-5.3.4-13-6.3-13H436.1c-2.8 0-5.5 1.5-6.9 4L170.1 547.5c-3.1 5.3.7 12 6.9 12h174.4L262 917.1c-1.9 7.8 7.5 13.3 13.3 7.7L853.6 373c5.2-4.9 1.7-13.7-5.5-13.7M378.3 732.5l60.3-241H281.2l189.6-327.4h224.6L487.1 427.4h211z"/></svg>
                  x5
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Modals -->
      <ClientOnly>
        <LobbyProfileModal />
        <LobbyChangeNameModal />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
@keyframes shine {
  0%   { transform: translateX(-40%) rotate(0deg); }
  100% { transform: translateX(40%) rotate(0deg); }
}

@keyframes click-bounce {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(8px) scale(0.96); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

.animate-shine {
  animation: shine 2.2s linear infinite;
}

.animate-click-bounce {
  animation: click-bounce 0.3s ease-in-out;
}

/* Aplicar shake apenas em dispositivos com hover (desktop) */
@media (hover: hover) {
  .hud-button-shake:hover {
    animation: shake 0.4s ease-in-out;
  }
}
</style>
