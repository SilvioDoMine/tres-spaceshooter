<script setup lang="js">
import { useLobbyStore } from '~/stores/useLobbyStore';
import BaseModal from '~/components/ui/BaseModal.vue';
import { useModal } from '~/composables/useModal';
import { useAudio } from '~/composables/useAudio';

// Store apenas para dados de avatar (não mais para controle de modal)
const lobbyStore = useLobbyStore();

// Settings
const useAudioPlayer = useAudio();
const enableParticles = ref(true);
const shipAppearance = useShipAppearance();

// Reset de conta: o botão só abre a confirmação, quem apaga é o ResetProgressModal
const resetProgressModal = useModal('reset-progress-modal');
</script>

<template>
    <BaseModal
        modal-id="settings-modal"
        title="Configurações"
    >
        <!-- content box -->
        <div class="flex flex-col gap-4 pointer-events-auto">

                <BaseInset variant="dark" class="text-cyan-100 p-4 flex flex-col gap-3"><h3 class="title-text">Kestrel-07 · Hangar</h3><label class="flex justify-between">Cor dos painéis<input aria-label="Cor dos painéis" type="color" v-model="shipAppearance.color" /></label><label class="flex justify-between">Propulsores animados<input type="checkbox" v-model="shipAppearance.thrusters" /></label></BaseInset><!-- Settings Controls -->
                <BaseInset class="flex gap-2 items-center w-full p-2">

                    <!-- Stats -->
                    <BaseInset variant="sunken" class="p-2 flex flex-col flex-1 text-md sm:text-lg md:text-xl gap-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2 group">
                                <svg class="w-6 sm:w-8 cursor-pointer text-[#cd9664] group-hover:text-amber-700 group-hover:scale-90 group-hover:rotate-360 transition-transform" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Myna UI Icons by Praveen Juge - https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE --><g fill="currentColor"><path d="M17.57 4.47a.75.75 0 0 1 1.06 0c4.16 4.159 4.16 10.901 0 15.06a.75.75 0 1 1-1.06-1.06a9.15 9.15 0 0 0 0-12.94a.75.75 0 0 1 0-1.06"/><path d="M15.47 7.47a.75.75 0 0 1 1.06 0a6.407 6.407 0 0 1 0 9.06a.75.75 0 1 1-1.06-1.06a4.907 4.907 0 0 0 0-6.94a.75.75 0 0 1 0-1.06M6.748 6.369a14 14 0 0 0-.231.337l-.165-.015a11 11 0 0 0-1.442-.03c-.518.028-1.119.11-1.614.337c-.52.24-1.046.713-1.046 1.507v6.914c0 .795.525 1.268 1.046 1.508c.495.227 1.097.309 1.614.337a11 11 0 0 0 1.603-.044q.099.151.231.343c.314.452.772 1.056 1.35 1.663C9.217 20.41 10.93 21.75 13 21.75a.75.75 0 0 0 .75-.75V3a.75.75 0 0 0-.75-.75c-2.065 0-3.776 1.315-4.902 2.482a14 14 0 0 0-1.35 1.637"/></g></svg>
                                <h3 class="cursor-pointer font-bold text-amber-900 group-hover:text-amber-700">Volume Geral</h3>
                            </div>
                            <div class="flex items-center justify-center">
                                <BaseRangeInput 
                                    v-model="useAudioPlayer.audioSettings.value.volumeGeneral"
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
                                    v-model="useAudioPlayer.audioSettings.value.volumeBackground"
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
                                    v-model="useAudioPlayer.audioSettings.value.volumeEffects"
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

                        <!-- Microinterações da interface -->
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-amber-900 pl-8 sm:pl-10">Sons da Interface</h3>
                            <BaseToggleCheckbox v-model="useAudioPlayer.audioSettings.value.uiSoundsEnabled" />
                        </div>

                        <div
                            class="flex justify-between items-center transition-opacity"
                            :class="{ 'opacity-40 pointer-events-none': !useAudioPlayer.audioSettings.value.uiSoundsEnabled }"
                        >
                            <h3 class="font-bold text-amber-900 pl-8 sm:pl-10">Volume da Interface</h3>
                            <div class="flex items-center justify-center">
                                <BaseRangeInput
                                    v-model="useAudioPlayer.audioSettings.value.volumeUi"
                                    :min="0"
                                    :max="100"
                                    :showValue="false"
                                    unit="%"
                                />
                            </div>
                        </div>

                        <div v-if="useAudioPlayer.supportsVibration" class="flex justify-between items-center">
                            <h3 class="font-bold text-amber-900 pl-8 sm:pl-10">Vibração</h3>
                            <BaseToggleCheckbox v-model="useAudioPlayer.audioSettings.value.hapticsEnabled" />
                        </div>
                    </BaseInset>


                </BaseInset>

                <!-- Instalação, tela acesa, tela cheia e notificações -->
                <LobbyAppSettings />

                <!-- Actions -->
                <div class="flex flex-row gap-2 justify-between">
                    <BaseButton
                        variant="red"
                        size="sm"
                        @click="resetProgressModal.open()"
                    >
                        Resetar Progresso
                    </BaseButton>
                    <BaseButton
                        variant="blue"
                        size="sm"
                        @click=""
                    >
                        Suporte
                    </BaseButton>
                </div>
        </div>
    </BaseModal>

    <LobbyResetProgressModal />
</template>

<style scoped>
    /** Style glow for image div */
    .glow {
        box-shadow: 0 0px 10px 5px rgb(79, 74, 240);
    }
</style>

