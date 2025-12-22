<script setup lang="js">
import { useLobbyStore } from '~/stores/useLobbyStore';
import BaseModal from '~/components/ui/BaseModal.vue';
import { useModal } from '~/composables/useModal';

// Store apenas para dados de avatar (não mais para controle de modal)
const lobbyStore = useLobbyStore();
const changeNameModal = useModal('change-name-modal');
</script>

<template>
    <BaseModal
        modal-id="profile-modal"
        title="Perfil"
    >
        <!-- content box -->
        <div class="flex flex-col gap-4">

                <!-- Profile -->
                <div class="bg-orange-200 flex gap-2 items-center w-full rounded-md drop-shadow-2xl shadow-orange-400 p-2">
                    <!-- Image -->
                    <div class="top-2 left-2 w-20 h-20 bg-linear-to-b from-gray-400 to-gray-600 rounded flex items-center justify-center">
                        <img 
                            :src="`/images/icons/${lobbyStore.getCurrentProfilePicture.iconPath}`" 
                            alt="user-icon" 
                            class="w-17 h-17 rounded-sm"
                        />
                    </div>

                    <!-- Stats -->
                    <!-- Tailwind for each child add a border b between them -->
                    <div class="bg-white/40 rounded-md p-2 flex flex-col flex-1">
                        <h3 @click="changeNameModal.open()" class="text-lg font-semibold text-amber-900">{{ lobbyStore.getCurrentProfileName }}</h3>
                        <p class="text-sm text-amber-800">Level: 99</p>
                        <p class="text-sm text-amber-800">Partidas jogadas: 45</p>
                    </div>
                </div>

                <!-- Carousel Content -->
                <div class="flex flex-col gap-2">
                   <!-- Box-->
                    <div class="bg-black/30 rounded-md grid p-2 gap-2 grid-cols-4 items-center justify-items-center">
                        <!-- Image -->
                        <div 
                            v-for="(image, key) in lobbyStore.availableProfileIcons"
                            :key="key"
                            class="cursor-pointer hover:scale-90 transition-transform top-2 left-2 w-13 h-13 sm:w-20 sm:h-20 bg-linear-to-b from-black/20 to-black/60 rounded flex items-center justify-center"
                            :class="[
                                image.id === lobbyStore.selectedProfileIcon.id ? 'glow' : '',
                                image.locked ? 'opacity-50 cursor-default' : ''
                            ]"
                            @click="lobbyStore.selectProfileIcon(image)"
                        >
                            <img 
                                :src="`/images/icons/${image.iconPath}`" 
                                alt="user-icon" 
                                class="w-11 h-11 sm:w-17 sm:h-17 rounded-sm"
                            />
                        </div>
                   </div>

                   <!-- Unlock description -->
                   <div class="bg-black/30 rounded-md p-2">
                        <p class="text-sm font-bold space-x-3 tracking-wide text-white text-shadow-md text-shadow-gray-800 text-center">
                            {{ lobbyStore.selectedProfileIcon.unlockText }}
                        </p>
                   </div>

                    <!-- Confirmation button -->
                     <div class="flex justify-center">
                        <button
                            @click="lobbyStore.confirmProfileIconSelection()"
                            :disabled="lobbyStore.selectedProfileIcon.locked || lobbyStore.selectedProfileIcon.id === lobbyStore.getCurrentProfilePicture.id"
                            class="bg-green-600 cursor-pointer disabled:cursor-default hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md shadow-md shadow-green-800 disabled:shadow-gray-800 transition"
                        >
                            {{ 
                            
                                lobbyStore.selectedProfileIcon.locked ? 'Ícone bloqueado' : 
                                (lobbyStore.selectedProfileIcon.id === lobbyStore.getCurrentProfilePicture.id ? 'Em uso' : 'Confirmar seleção') 
                            }}
                        </button>
                    </div>
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
