<script setup lang="js">
import { useLobbyStore } from '~/stores/useLobbyStore';
import BaseModal from '~/components/ui/BaseModal.vue';
import { useModal } from '~/composables/useModal';

// Store apenas para dados de avatar (não mais para controle de modal)
const lobbyStore = useLobbyStore();

// Settings
const volumeGeneral = ref(100);
const volumeBackground = ref(100);
const volumeEffects = ref(100);
const enableParticles = ref(true);
</script>

<template>
    <BaseModal
        modal-id="settings-modal"
        title="Configurações"
    >
        <!-- content box -->
        <div class="flex flex-col gap-4 pointer-events-auto">

                <!-- Settings Controls -->
                <div class="bg-orange-200 flex gap-2 items-center w-full rounded-md drop-shadow-2xl shadow-orange-400 p-2">

                    <!-- Stats -->
                    <div class="bg-white/40 rounded-md p-2 flex flex-col flex-1 text-md sm:text-lg md:text-xl gap-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2 group">
                                <svg class="w-6 sm:w-8 cursor-pointer text-[#cd9664] group-hover:text-amber-700 group-hover:scale-90 group-hover:rotate-360 transition-transform" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Myna UI Icons by Praveen Juge - https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE --><g fill="currentColor"><path d="M17.57 4.47a.75.75 0 0 1 1.06 0c4.16 4.159 4.16 10.901 0 15.06a.75.75 0 1 1-1.06-1.06a9.15 9.15 0 0 0 0-12.94a.75.75 0 0 1 0-1.06"/><path d="M15.47 7.47a.75.75 0 0 1 1.06 0a6.407 6.407 0 0 1 0 9.06a.75.75 0 1 1-1.06-1.06a4.907 4.907 0 0 0 0-6.94a.75.75 0 0 1 0-1.06M6.748 6.369a14 14 0 0 0-.231.337l-.165-.015a11 11 0 0 0-1.442-.03c-.518.028-1.119.11-1.614.337c-.52.24-1.046.713-1.046 1.507v6.914c0 .795.525 1.268 1.046 1.508c.495.227 1.097.309 1.614.337a11 11 0 0 0 1.603-.044q.099.151.231.343c.314.452.772 1.056 1.35 1.663C9.217 20.41 10.93 21.75 13 21.75a.75.75 0 0 0 .75-.75V3a.75.75 0 0 0-.75-.75c-2.065 0-3.776 1.315-4.902 2.482a14 14 0 0 0-1.35 1.637"/></g></svg>
                                <h3 class="cursor-pointer font-bold text-amber-900 group-hover:text-amber-700">Volume Geral</h3>
                            </div>
                            <div class="flex items-center justify-center">
                                <BaseRangeInput 
                                    v-model="volumeGeneral"
                                    :min="0"
                                    :max="100"
                                    :showValue="false"
                                    unit="%"
                                />
                            </div>
                        </div>

                        <!-- Volume background sound -->
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2 group">
                                <svg class="w-6 sm:w-8 cursor-pointer text-[#cd9664] group-hover:text-amber-700 group-hover:scale-90 group-hover:rotate-360 transition-transform" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Myna UI Icons by Praveen Juge - https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE --><g fill="currentColor"><path d="M17.57 4.47a.75.75 0 0 1 1.06 0c4.16 4.159 4.16 10.901 0 15.06a.75.75 0 1 1-1.06-1.06a9.15 9.15 0 0 0 0-12.94a.75.75 0 0 1 0-1.06"/><path d="M15.47 7.47a.75.75 0 0 1 1.06 0a6.407 6.407 0 0 1 0 9.06a.75.75 0 1 1-1.06-1.06a4.907 4.907 0 0 0 0-6.94a.75.75 0 0 1 0-1.06M6.748 6.369a14 14 0 0 0-.231.337l-.165-.015a11 11 0 0 0-1.442-.03c-.518.028-1.119.11-1.614.337c-.52.24-1.046.713-1.046 1.507v6.914c0 .795.525 1.268 1.046 1.508c.495.227 1.097.309 1.614.337a11 11 0 0 0 1.603-.044q.099.151.231.343c.314.452.772 1.056 1.35 1.663C9.217 20.41 10.93 21.75 13 21.75a.75.75 0 0 0 .75-.75V3a.75.75 0 0 0-.75-.75c-2.065 0-3.776 1.315-4.902 2.482a14 14 0 0 0-1.35 1.637"/></g></svg>
                                <h3 class="cursor-pointer font-bold text-amber-900 group-hover:text-amber-700">Volume da Música</h3>
                            </div>
                            <div class="flex items-center justify-center">
                                <BaseRangeInput 
                                    v-model="volumeBackground"
                                    :min="0"
                                    :max="100"
                                    :showValue="false"
                                    unit="%"
                                />
                            </div>
                        </div>

                        <!-- Volume sound effect -->
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2 group">
                                <svg class="w-6 sm:w-8 cursor-pointer text-[#cd9664] group-hover:text-amber-700 group-hover:scale-90 group-hover:rotate-360 transition-transform" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Myna UI Icons by Praveen Juge - https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE --><g fill="currentColor"><path d="M17.57 4.47a.75.75 0 0 1 1.06 0c4.16 4.159 4.16 10.901 0 15.06a.75.75 0 1 1-1.06-1.06a9.15 9.15 0 0 0 0-12.94a.75.75 0 0 1 0-1.06"/><path d="M15.47 7.47a.75.75 0 0 1 1.06 0a6.407 6.407 0 0 1 0 9.06a.75.75 0 1 1-1.06-1.06a4.907 4.907 0 0 0 0-6.94a.75.75 0 0 1 0-1.06M6.748 6.369a14 14 0 0 0-.231.337l-.165-.015a11 11 0 0 0-1.442-.03c-.518.028-1.119.11-1.614.337c-.52.24-1.046.713-1.046 1.507v6.914c0 .795.525 1.268 1.046 1.508c.495.227 1.097.309 1.614.337a11 11 0 0 0 1.603-.044q.099.151.231.343c.314.452.772 1.056 1.35 1.663C9.217 20.41 10.93 21.75 13 21.75a.75.75 0 0 0 .75-.75V3a.75.75 0 0 0-.75-.75c-2.065 0-3.776 1.315-4.902 2.482a14 14 0 0 0-1.35 1.637"/></g></svg>
                                <h3 class="cursor-pointer font-bold text-amber-900 group-hover:text-amber-700">Volume dos Efeitos</h3>
                            </div>
                            <div class="flex items-center justify-center">
                                <BaseRangeInput 
                                    v-model="volumeEffects"
                                    :min="0"
                                    :max="100"
                                    :showValue="false"
                                    unit="%"
                                />
                            </div>
                        </div>

                        <!-- Enable Particles -->
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2 group">
                                <svg class="w-6 sm:w-8 cursor-pointer text-[#cd9664] group-hover:text-amber-700 group-hover:scale-90 group-hover:rotate-360 transition-transform" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Myna UI Icons by Praveen Juge - https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE --><g fill="currentColor"><path d="M17.57 4.47a.75.75 0 0 1 1.06 0c4.16 4.159 4.16 10.901 0 15.06a.75.75 0 1 1-1.06-1.06a9.15 9.15 0 0 0 0-12.94a.75.75 0 0 1 0-1.06"/><path d="M15.47 7.47a.75.75 0 0 1 1.06 0a6.407 6.407 0 0 1 0 9.06a.75.75 0 1 1-1.06-1.06a4.907 4.907 0 0 0 0-6.94a.75.75 0 0 1 0-1.06M6.748 6.369a14 14 0 0 0-.231.337l-.165-.015a11 11 0 0 0-1.442-.03c-.518.028-1.119.11-1.614.337c-.52.24-1.046.713-1.046 1.507v6.914c0 .795.525 1.268 1.046 1.508c.495.227 1.097.309 1.614.337a11 11 0 0 0 1.603-.044q.099.151.231.343c.314.452.772 1.056 1.35 1.663C9.217 20.41 10.93 21.75 13 21.75a.75.75 0 0 0 .75-.75V3a.75.75 0 0 0-.75-.75c-2.065 0-3.776 1.315-4.902 2.482a14 14 0 0 0-1.35 1.637"/></g></svg>
                                <h3 class="cursor-pointer font-bold text-amber-900 group-hover:text-amber-700">Habilitar Particulas</h3>
                            </div>
                            <div class="flex items-center justify-center">
                                <BaseToggleCheckbox
                                    v-model="enableParticles"
                                    activeColor="rgb(74, 222, 128)"
                                    inactiveColor="rgb(209, 213, 219)"
                                />
                            </div>
                        </div>
                    </div>


                </div>

                <!-- Actions -->
                <div class="flex flex-row gap-2 justify-between">
                    <BaseButton
                        variant="red"
                        label="Resetar Progresso"
                        size="sm"
                        @click=""
                    />
                    <BaseButton
                        variant="green"
                        label="Suporte"
                        size="sm"
                        @click=""
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
</style>
