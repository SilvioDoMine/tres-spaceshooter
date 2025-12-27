<script setup lang="js">
import BaseModal from '~/components/ui/BaseModal.vue';
import MissionItem from '~/components/lobby/MissionItem.vue';
import { useMissions } from '~/composables/useMissions.js';

const { getNextResetTime } = useMissions();

// Refs para o countdown
const countdownHours = ref('00');
const countdownMinutes = ref('00');
const countdownSeconds = ref('00');

// Função que calcula e atualiza o countdown
const updateCountdown = () => {
    const nextReset = getNextResetTime();
    const now = new Date();
    const diffMs = nextReset - now;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    countdownHours.value = String(hours).padStart(2, '0');
    countdownMinutes.value = String(minutes).padStart(2, '0');
    countdownSeconds.value = String(seconds).padStart(2, '0');
};

// Atualiza uma vez ao montar
updateCountdown();

// Atualiza a cada segundo
let intervalId;
onMounted(() => {
    intervalId = setInterval(updateCountdown, 1000);
});

// Limpa o interval ao desmontar
onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});
</script>

<template>
    <BaseModal
        modal-id="missions-modal"
        title="Missões"
    >
        <!-- content box -->
        <div class="flex flex-col gap-4 pointer-events-auto">

                <!-- Meta das missões -->
                <div :class="[
                    'bg-orange-100 w-full rounded-md p-2 title-text',
                    `shadow-[0px_1px_0px_3px_rgba(255,214,168,1),0px_2px_2px_5px_rgba(0,0,0,0.1)]`,
                    'flex flex-col gap-2 items-center',
                ]">

                    <!-- Content card -->
                    <BaseCheckersCard
                        variant="blue"
                        padding="py-6"
                        rounded="rounded-lg"
                        shadow=""
                        class="w-full"
                    >
                        <div class="flex flex-col items-center">

                            <div class="h-full w-42 sm:w-2xs relative flex items-center justify-center">
                                <!-- Progress bar form 0 to 100, with a icon on the middle of the bar each 20%, until 100% -->
                                <div class="relative w-full h-5 bg-linear-to-b from-black/40 via-black/30 to-black/20 border border-black/10 mt-1 overflow-hidden shadow-inner shadow-black/30">
                                    <div 
                                        class="absolute top-0 left-0 h-full bg-linear-to-b from-yellow-500 via-yellow-400 to-yellow-300 border-2 border-black/10 shadow-[inset_0_1px_0px_0px_rgba(255,255,255,0.4),0_1px_2px_0_rgba(255,0,0,1)]"
                                        :style="{ width: 80 + '%' }"
                                    >
                                        <div class="progress-bar-highlight"></div>
                                    </div>
                                </div>

                                <div class="absolute top-1 inset-0 -inset-x-2.5 z-20 flex flex-row items-center justify-between">
                                    <div class="text-2xl">🅰️</div>
                                    <div class="text-2xl">✅</div>
                                    <div class="text-2xl">✅</div>
                                    <div class="text-2xl">✅</div>
                                    <div class="text-2xl">✅</div>
                                    <div class="text-2xl">✅</div>
                                </div>
                            </div>
                            
                        </div>
                    </BaseCheckersCard>

                    <!-- Timer to update missions-->
                    <div class="flex items-center justify-center text-amber-800/70 gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                            <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clip-rule="evenodd" />
                        </svg>
                        <p class="text-xs">Atualiza em: {{ countdownHours }}:{{ countdownMinutes }}:{{ countdownSeconds }}</p>
                    </div>

                </div>

                <!-- Missões em si -->
                <div :class="[
                    'bg-black/20 w-full rounded-xl p-2 flex flex-col gap-2',
                    'max-h-[200px] overflow-y-auto',
                    'snap-y snap-proximity scroll-pt-2',
                    'scrollbar-hide allow-scroll',
                ]">
                    <!-- Mission: Claimable (ready to claim reward) -->
                    <MissionItem
                        title="Aprimore equipamento 1 vez"
                        :current-progress="1"
                        :max-progress="1"
                        status="claimable"
                        @claim="() => console.log('Claimed: Aprimore equipamento')"
                    />

                    <!-- Mission: In Progress -->
                    <MissionItem
                        title="Derrote 100 inimigos"
                        :current-progress="31"
                        :max-progress="100"
                        status="in_progress"
                        @play="() => console.log('Play: Derrote inimigos')"
                    />

                    <MissionItem
                        title="Complete 2 partidas"
                        :current-progress="0"
                        :max-progress="2"
                        status="in_progress"
                        @claim="() => console.log('Claimed: Aprimore equipamento')"
                    />

                    <MissionItem
                        title="Adquira Cash pelo menos 1 vez"
                        :current-progress="0"
                        :max-progress="1"
                        status="in_progress"
                        @claim="() => console.log('Claimed: Aprimore equipamento')"
                    />

                    <MissionItem
                        title="Adquira 1 item da loja"
                        :current-progress="0"
                        :max-progress="1"
                        status="in_progress"
                        @claim="() => console.log('Claimed: Aprimore equipamento')"
                    />

                    <!-- Mission: Claimed (completed and reward claimed) -->
                    <MissionItem
                        title="Entre no Spaceshooter"
                        :current-progress="1"
                        :max-progress="1"
                        status="claimed"
                    />

                </div>
        </div>
    </BaseModal>
</template>

<style scoped>
    /** Style glow for image div */
    .glow {
        box-shadow: 0 0px 10px 5px rgb(79, 74, 240);
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    /* Hide scrollbar for IE, Edge and Firefox */
    .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
</style>

