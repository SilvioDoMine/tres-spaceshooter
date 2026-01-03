<script setup lang="js">
import BaseModal from '~/components/ui/BaseModal.vue';
import OfferCard from '~/components/lobby/OfferCard.vue';
import { useOffers } from '~/composables/useOffers';

const { getOffers, getNextResetTime, claimOfferReward, purchaseOffer } = useOffers();

// Define emits
const emit = defineEmits(['openRewards']);

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

const handleClaim = (offerId) => {
    console.log('Resgatar oferta:', offerId);
    const rewards = claimOfferReward(offerId);

    // Se o claim foi bem-sucedido, emite evento para abrir o modal de recompensas
    if (rewards) {
        confettiOnPageSides(100);
        confettiOnBottom(100);

        // Emite um evento para a página principal abrir o modal de recompensas
        emit('openRewards', rewards);
    }
};

const handlePurchase = (offerId) => {
    console.log('Comprar oferta:', offerId);
    // TODO: Implementar lógica de compra
    purchaseOffer(offerId);
};
</script>

<template>
    <BaseModal
        modal-id="offers-modal"
        title="Ofertas"
    >
        <!-- content box -->
        <div class="flex flex-col gap-4 pointer-events-auto">

                <!-- Offers Cards -->
                <div class="bg-orange-200 title-text flex flex-col gap-2 items-center w-full rounded-md drop-shadow-2xl shadow-orange-400 p-2">

                    <!-- Timer to reset offers-->
                    <div class="flex items-center justify-center text-amber-800/70 gap-1 -mt-1 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                            <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clip-rule="evenodd" />
                        </svg>
                        <p class="text-xs  text-amber-800/70">Atualiza em: {{ countdownHours }}:{{ countdownMinutes }}:{{ countdownSeconds }}</p>
                    </div>

                    <!-- Renderiza cada oferta dinamicamente -->
                    <OfferCard
                        v-for="offer in getOffers"
                        :key="offer.id"
                        :offer="offer"
                        @claim="handleClaim"
                        @purchase="handlePurchase"
                    />

                </div>

                <!-- Actions -->
                <div v-if="false" class="flex flex-row gap-2 justify-center">
                    <BaseButton
                        variant="green"
                        size="sm"
                        @click=""
                    >
                        <BaseNotification />
                        Resgatar Tudo
                    </BaseButton>
                </div>
        </div>
    </BaseModal>
</template>

<style scoped>
</style>
