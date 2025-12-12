<script setup lang="ts">
import { LEVEL_1 } from '~/games/levels/LevelOneConfig';

// Page metadata
useHead({
  title: 'Home',
  meta: [
    { name: 'description', content: 'A TresJS Nuxt application' }
  ]
})

const currentRunStore = useCurrentRunStore();
const router = useRouter();
const isAnimating = ref(false);

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
</script>

<template>
  <TresCanvas
    clear-color="#420420"
    window-size
  >
    <TheExperience />
  </TresCanvas>
  
  <div id="lobby-stuff" class="w-full h-full absolute top-0 left-0 right-0 bottom-0">
    <!-- Relative full content -->
    <div class="relative w-full h-full">

      <!-- Topbar -->
      <div class="w-full h-17 absolute top-0">
        <!-- Icon absolute 64x64 -->
        <div class="absolute top-2 left-2 w-16 h-16 bg-gray-700 rounded flex items-center justify-center">
          <span class="text-white font-bold">ICON</span>
        </div>

        <!-- Half top -->
        <div class="bg-white/10 w-full h-10 flex justify-between items-center pl-20 pr-6 text-sm">
          <!-- User Name & Level Bar -->
          <div class="text-white text-md font-bold flex flex-col">
            <!-- Level & User -->
            <div class="flex gap-2 items-center h-full">
              <p class="text-blue-400 w-6 font-bold text-center">99</p>
              <div>
                <p>Unknown</p>
                <!-- Mini level bar -->
                <div class="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-400 rounded-full" style="width: 100%;"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- Right side -->
          <div>
            <!-- Gold Count -->
            <!-- Notch Direito -->
            <div class="bg-white/10 px-2 pr-3 py-0.5 flex items-center justify-between gap-2 rounded-full cursor-pointer">
              <!-- Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-amber-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>

              <!-- Text -->
              <span class="font-bold text-white">{{ currentRunStore.totalGold }}</span>
            </div>
          </div>
        </div>
        <!-- Half bottom -->
        <div class="w-full h-7 flex">
          <div class="bg-white/10 pb-2 rounded-br-full h-full pl-20 pr-10 flex items-center justify-center text-xl gap-2 text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 256 256"><!-- Icon from Phosphor by Phosphor Icons - https://github.com/phosphor-icons/core/blob/main/LICENSE --><g fill="currentColor"><path d="M240 56v128a16 16 0 0 1-16 16H72v-48h56v-48h56V56Z" opacity=".2"/><path d="M248 56a8 8 0 0 1-8 8h-48v40a8 8 0 0 1-8 8h-48v40a8 8 0 0 1-8 8H80v40a8 8 0 0 1-8 8H16a8 8 0 0 1 0-16h48v-40a8 8 0 0 1 8-8h48v-40a8 8 0 0 1 8-8h48V56a8 8 0 0 1 8-8h56a8 8 0 0 1 8 8"/></g></svg>
            <h1 class="
              relative text-xl font-extrabold tracking-tight
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


      <!-- Tailwind shine golden button with shimmer effect on the bottom middle of the page -->
      <div class="absolute bottom-30 left-1/2 -translate-x-1/2 w-full px-4 flex justify-center">
        <div class="w-full max-w-md">
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

                <div class="mt-2 flex items-center justify-center gap-0 font-extrabold text-[#6b3a08] text-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 1024 1024"><!-- Icon from Ant Design Icons by HeskeyBaozi - https://github.com/ant-design/ant-design-icons/blob/master/LICENSE --><path fill="currentColor" fill-opacity=".15" d="M695.4 164.1H470.8L281.2 491.5h157.4l-60.3 241l319.8-305.1h-211z"/><path fill="currentColor" d="M848.1 359.3H627.8L825.9 109c4.1-5.3.4-13-6.3-13H436.1c-2.8 0-5.5 1.5-6.9 4L170.1 547.5c-3.1 5.3.7 12 6.9 12h174.4L262 917.1c-1.9 7.8 7.5 13.3 13.3 7.7L853.6 373c5.2-4.9 1.7-13.7-5.5-13.7M378.3 732.5l60.3-241H281.2l189.6-327.4h224.6L487.1 427.4h211z"/></svg>
                  x5
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
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

.animate-shine {
  animation: shine 2.2s linear infinite;
}

.animate-click-bounce {
  animation: click-bounce 0.3s ease-in-out;
}
</style>
