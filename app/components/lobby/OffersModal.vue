<script setup lang="js">
import BaseModal from '~/components/ui/BaseModal.vue';
import OfferCard from '~/components/lobby/OfferCard.vue';
import { useOffers } from '~/composables/useOffers';

const { getOffers } = useOffers();

const handleClaim = (offerId) => {
    console.log('Resgatar oferta:', offerId);
    // TODO: Implementar lógica de resgate
};

const handlePurchase = (offerId) => {
    console.log('Comprar oferta:', offerId);
    // TODO: Implementar lógica de compra
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
                <div class="bg-orange-200 flex flex-col gap-2 items-center w-full rounded-md drop-shadow-2xl shadow-orange-400 p-2">

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
                <div v-if="true" class="flex flex-row gap-2 justify-center">
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
