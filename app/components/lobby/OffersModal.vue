<script setup lang="js">
import BaseModal from '~/components/ui/BaseModal.vue';
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

                    <BaseCheckersCard
                        class="w-full"
                        variant="blue"
                        header="Oferta diária"
                        padding="p-0"
                    >
                        <div class="flex justify-between items-center w-full p-2">
                            <!-- Rewards -->
                            <div>
                                <BaseAbilityIcon
                                    rarity="purple"
                                    size="sm"
                                    :clickable="true"
                                    :quantity="`10`"
                                >
                                    <p class="text-2xl">
                                        <SvgCashIcon :size="35" />
                                    </p>
                                </BaseAbilityIcon>
                            </div>
                            <!-- Actions -->
                            <div>
                                <BaseButton
                                    variant="green"
                                    size="xs"
                                    @click=""
                                >
                                    <BaseNotification />
                                    Resgatar
                                </BaseButton>
                            </div>
                        </div>
                    </BaseCheckersCard>

                    <BaseCheckersCard
                        class="w-full"
                        variant="blue"
                        padding="p-0"
                    >
                        <!--  -->
                        <div class="p-2 flex flex-row justify-between w-full gap-4">
                            <div class="flex flex-col gap-3">
                                <!-- Titulo -->
                                <div>
                                    <p class="title-text title-text-blue">Cartão Permanente</p>
                                    <p class="title-text title-text-blue text-sm">Sem anúncios</p>
                                </div>

                                <div class="flex-row -ml-2 flex p-2 gap-2 bg-cyan-400 items-center rounded-r-md shadow-[inset_-2px_2px_2px_0px_rgba(0,0,0,0.2)] ring-1 ring-cyan-300">
                                    <p class="text-xs text-black/60 font-bold italic">Compre para obter agora</p>
                                    <div class="flex items-center justify-center gap-1">
                                        <SvgCashIcon :size="25" />
                                        <p class="title-text text-md drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">1200</p>
                                    </div>
                                </div>

                                <!-- Benefits List -->
                                <div class="flex flex-col gap-2 bg-black/20 p-2 rounded-md text-xs sm:text-sm title-text title-text">
                                    <div
                                        class="flex items-center gap-2"
                                    >
                                        <svg class="w-4 h-4 text-yellow-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span class="text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                            Sem anúncios permanente
                                        </span>
                                    </div>

                                    <div
                                        class="flex items-center gap-2"
                                    >
                                        <svg class="w-4 h-4 text-yellow-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span class="text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                            Gemas diárias aumentam
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col items-center justify-center gap-4">
                                <!-- Placeholder - substitua pela sua imagem -->
                                <div class="w-26 h-26 bg-cyan-400/20 rounded-xl flex items-center justify-center">
                                    <svg class="w-20 h-20 text-cyan-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 4v8h16V8H4m2 6h4v2H6v-2z"/>
                                    </svg>
                                </div>
                                <BaseButton
                                    variant="green"
                                    size="xs"
                                    class=""
                                    @click=""
                                >
                                R$ 4,99
                                </BaseButton>
                            </div>
                        </div>
                    </BaseCheckersCard>

                    <BaseCheckersCard
                        class="w-full"
                        variant="red"
                        padding="p-0"
                    >
                        <!--  -->
                        <div class="p-2 flex flex-row justify-between w-full gap-4">
                            <div class="flex flex-col gap-3">
                                <!-- Titulo -->
                                <div>
                                    <p class="title-text title-text-red">Cartão de Suprimento</p>
                                    <p class="title-text title-text-red text-sm">Permanente</p>
                                </div>

                                <div class="flex-row -ml-2 flex p-2 gap-2 bg-cyan-400 items-center rounded-r-md shadow-[inset_-2px_2px_2px_0px_rgba(0,0,0,0.2)] ring-1 ring-cyan-300">
                                    <p class="text-xs text-black/60 font-bold italic">Compre para obter agora</p>
                                    <div class="flex items-center justify-center gap-1">
                                        <SvgCashIcon :size="25" />
                                        <p class="title-text text-md drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">3900</p>
                                    </div>
                                </div>

                                <!-- Benefits List -->
                                <div class="flex flex-col gap-2 bg-black/20 p-2 rounded-md text-xs sm:text-sm title-text title-text">
                                    <div
                                        class="flex items-center gap-2"
                                    >
                                        <svg class="w-4 h-4 text-yellow-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                        <span class="text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                            Ganhe gemas massivas diariamente
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col items-center justify-center gap-4">
                                <!-- Placeholder - substitua pela sua imagem -->
                                <div class="w-26 h-26 bg-pink-400/20 rounded-xl flex items-center justify-center">
                                    <svg class="w-20 h-20 text-pink-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 4v8h16V8H4m2 6h4v2H6v-2z"/>
                                    </svg>
                                </div>
                                <BaseButton
                                    variant="green"
                                    size="xs"
                                    class=""
                                    @click=""
                                >
                                R$ 29,90
                                </BaseButton>
                            </div>
                        </div>
                        <div class="flex title-text title-text-red flex-col p-2 gap-2">
                            <p>Resgate adicionalmente todos os dias</p>
                            <div class="flex flex-row gap-2">
                                <BaseAbilityIcon
                                    rarity="purple"
                                    size="sm"
                                    :quantity="`800`"
                                >
                                    <p class="text-2xl">
                                        <SvgCashIcon :size="35" />
                                    </p>
                                </BaseAbilityIcon>
                                <BaseAbilityIcon
                                    rarity="gray"
                                    size="sm"
                                    :quantity="`5000`"
                                >
                                    <p class="text-2xl">
                                        <SvgCoinIcon :size="30" />
                                    </p>
                                </BaseAbilityIcon>
                            </div>
                        </div>
                    </BaseCheckersCard>

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
    /** Style glow for image div */
    .glow {
        box-shadow: 0 0px 10px 5px rgb(79, 74, 240);
    }
</style>
