<script setup lang="js">
const props = defineProps({
    offer: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['claim', 'purchase']);

const handleClaim = () => {
    emit('claim', props.offer.id);
};

const handlePurchase = () => {
    emit('purchase', props.offer.id);
};
</script>

<template>
    <!-- ESTADO: PRÉ-COMPRA - Mostra informações de venda -->
    <BaseCheckersCard
        v-if="offer.state === 'pre-purchase'"
        class="w-full"
        :variant="offer.color"
        padding="p-0"
    >
        <div class="p-2 flex flex-row justify-between w-full gap-4">
            <div class="flex flex-col gap-3 flex-1">
                <!-- Titulo -->
                <div>
                    <p :class="['title-text', `title-text-${offer.color}`]">{{ offer.title }}</p>
                    <p v-if="offer.subtitle" :class="['title-text text-sm', `title-text-${offer.color}`]">{{ offer.subtitle }}</p>
                </div>

                <!-- Recompensa ao comprar -->
                <div
                    v-if="offer.onPurchase && offer.onPurchase.cash > 0"
                    class="flex-row -ml-2 flex p-2 gap-2 bg-cyan-400 items-center rounded-r-md shadow-[inset_-2px_2px_2px_0px_rgba(0,0,0,0.2)] ring-1 ring-cyan-300"
                >
                    <p class="text-xs text-black/60 font-bold italic">Compre para obter agora</p>
                    <div class="flex items-center justify-center gap-1">
                        <SvgCashIcon :size="25" />
                        <p class="title-text text-md drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{{ offer.onPurchase.cash }}</p>
                    </div>
                </div>

                <!-- Benefits List -->
                <div v-if="offer.descriptions && offer.descriptions.length" class="flex flex-col gap-2 bg-black/20 p-2 rounded-md text-xs sm:text-sm title-text">
                    <div
                        v-for="(benefit, index) in offer.descriptions"
                        :key="index"
                        class="flex items-center gap-2"
                    >
                        <svg class="w-4 h-4 text-yellow-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span class="text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {{ benefit }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex flex-col items-center justify-center gap-4">
                <!-- Placeholder - substitua pela sua imagem -->
                <div :class="[
                    'w-26 h-26 rounded-xl flex items-center justify-center',
                    offer.color === 'blue' ? 'bg-cyan-400/20' : '',
                    offer.color === 'red' ? 'bg-white/20' : '',
                    offer.color === 'green' ? 'bg-white/20' : '',
                    offer.color === 'yellow' ? 'bg-white/20' : '',
                ]">
                    <svg :class="[
                        'w-20 h-20',
                        offer.color === 'blue' ? 'text-cyan-300' : '',
                        offer.color === 'red' ? 'text-pink-200' : '',
                        offer.color === 'green' ? 'text-green-900/20' : '',
                        offer.color === 'yellow' ? 'text-orange-300' : '',
                    ]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 4v8h16V8H4m2 6h4v2H6v-2z"/>
                    </svg>
                </div>

                <!-- Botão de compra -->
                <BaseButton
                    variant="green"
                    size="xs"
                    @click="handlePurchase"
                >
                    {{ offer.currency }} {{ offer.price.toFixed(2).replace('.', ',') }}
                </BaseButton>
            </div>
        </div>

        <!-- Preview das Daily Rewards -->
        <div
            v-if="offer.dailyRewards"
            class="flex title-text flex-col p-2 gap-2 border-t-2 border-black/10"
            :class="`title-text-${offer.color}`"
        >
            <p class="text-sm">Resgate adicionalmente todos os dias ao comprar:</p>
            <div class="flex flex-row gap-2">
                <BaseAbilityIcon
                    v-if="offer.dailyRewards.cash"
                    rarity="purple"
                    size="sm"
                    :quantity="`${offer.dailyRewards.cash}`"
                >
                    <p class="text-2xl">
                        <SvgCashIcon :size="35" />
                    </p>
                </BaseAbilityIcon>
                <BaseAbilityIcon
                    v-if="offer.dailyRewards.gold"
                    rarity="gray"
                    size="sm"
                    :quantity="`${offer.dailyRewards.gold}`"
                >
                    <p class="text-2xl">
                        <SvgCoinIcon :size="30" />
                    </p>
                </BaseAbilityIcon>
            </div>
        </div>
    </BaseCheckersCard>

    <!-- ESTADOS: COMPRADO, RESGATÁVEL, RESGATADO - Mostra apenas daily rewards -->
    <BaseCheckersCard
        v-else
        class="w-full"
        :variant="offer.color"
        :header="offer.title"
        padding="p-0"
    >
        <div class="flex justify-between items-center w-full p-2">
            <!-- Daily Rewards -->
            <div class="flex flex-row gap-2">
                <BaseAbilityIcon
                    v-if="offer.dailyRewards?.cash"
                    rarity="purple"
                    size="sm"
                    :clickable="offer.state === 'claimable'"
                    :quantity="`${offer.dailyRewards.cash}`"
                >
                    <p class="text-2xl">
                        <SvgCashIcon :size="35" />
                    </p>
                </BaseAbilityIcon>
                <BaseAbilityIcon
                    v-if="offer.dailyRewards?.gold"
                    rarity="gray"
                    size="sm"
                    :clickable="offer.state === 'claimable'"
                    :quantity="`${offer.dailyRewards.gold}`"
                >
                    <p class="text-2xl">
                        <SvgCoinIcon :size="30" />
                    </p>
                </BaseAbilityIcon>
            </div>

            <!-- Actions -->
            <div>
                <!-- Estado: Claimable - Botão de resgatar -->
                <BaseButton
                    v-if="offer.state === 'claimable'"
                    variant="green"
                    size="xs"
                    @click="handleClaim"
                >
                    <BaseNotification />
                    Resgatar
                </BaseButton>

                <!-- Estado: Claimed - Badge resgatado -->
                <div
                    v-else-if="offer.state === 'claimed'"
                    class="text-white/60 text-xs font-bold px-3 py-2 bg-black/20 rounded-lg"
                >
                    Já Resgatado Hoje
                </div>

                <!-- Estado: Purchased (sem daily rewards ou não chegou hora) -->
                <div
                    v-else
                    class="px-4 py-2 bg-green-500 rounded-lg text-white font-bold text-xs shadow-md"
                >
                    Ativo
                </div>
            </div>
        </div>
    </BaseCheckersCard>
</template>

<style scoped>
</style>
