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
                        <div class="flex justify-betwee items-center">
                            <h3 @click="changeNameModal.open()" class="cursor-pointer text-lg font-semibold text-amber-900">{{ lobbyStore.getCurrentProfileName }}</h3>
                            <svg @click="changeNameModal.open()" class="cursor-pointer text-amber-900 hover:text-amber-700 hover:scale-90 hover:rotate-360 transition-transform" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6.525q.5 0 .75.313t.25.687t-.262.688T11.5 5H5v14h14v-6.525q0-.5.313-.75t.687-.25t.688.25t.312.75V19q0 .825-.587 1.413T19 21zm4-7v-2.425q0-.4.15-.763t.425-.637l8.6-8.6q.3-.3.675-.45t.75-.15q.4 0 .763.15t.662.45L22.425 3q.275.3.425.663T23 4.4t-.137.738t-.438.662l-8.6 8.6q-.275.275-.637.438t-.763.162H10q-.425 0-.712-.288T9 14m12.025-9.6l-1.4-1.4zM11 13h1.4l5.8-5.8l-.7-.7l-.725-.7L11 11.575zm6.5-6.5l-.725-.7zl.7.7z"/></svg>
                        </div>
                        <p class="text-sm text-amber-800">Level: 1</p>
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
