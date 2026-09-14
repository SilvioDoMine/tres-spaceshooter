<script setup lang="js">
import BaseModal from '~/components/ui/BaseModal.vue';
import OfferCard from '~/components/lobby/OfferCard.vue';
import { useOffers } from '~/composables/useOffers';

const { getOffers, getNextResetTime, claimOfferReward, completeOfferPurchase } = useOffers();

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

// Compra paga: abre o PIX (simulado) e só ativa a oferta quando o pagamento confirma
const pixOfferId = ref(null);

const pixProduct = computed(() => {
    const offer = getOffers.value.find(o => o.id === pixOfferId.value);
    if (!offer) return null;
    return {
        id: `offer:${offer.id}`,
        title: offer.title,
        subtitle: offer.onPurchase?.cash > 0 ? `+ ${offer.onPurchase.cash.toLocaleString('pt-BR')} gemas na hora` : offer.subtitle,
        priceBRL: offer.price,
        icon: 'card',
        onPaid: () => {
            const rewards = completeOfferPurchase(offer.id);
            const parts = [];
            if (rewards?.cash) parts.push(`+${rewards.cash.toLocaleString('pt-BR')} gemas`);
            if (rewards?.gold) parts.push(`+${rewards.gold.toLocaleString('pt-BR')} ouro`);
            return parts.length ? `${offer.title} ativado! ${parts.join(' • ')}` : `${offer.title} ativado!`;
        },
    };
});

const handlePurchase = (offerId) => {
    const offer = getOffers.value.find(o => o.id === offerId);
    if (!offer || offer.state !== 'pre-purchase') return;
    pixOfferId.value = offerId;
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
                <BaseInset class="title-text flex flex-col gap-3 items-center w-full p-2 pb-3">

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

                </BaseInset>

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

        <LobbyShopPixModal :product="pixProduct" @close="pixOfferId = null" />
    </BaseModal>
</template>

<style scoped>
</style>
