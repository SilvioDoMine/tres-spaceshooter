<script setup lang="js">
import { useLobbyStore } from '~/stores/useLobbyStore';

const lobbyStore = useLobbyStore();
</script>

<template>
    <div v-if="lobbyStore.modalOpened && lobbyStore.currentModal === 'profile'" class="bg-black/80 absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
        
        <!-- Full box -->
        <div class="w-full max-w-md bg-orange-300 relative rounded-md shadow-orange-400 shadow-md">
            <!-- Close button -->
            <button
                @click="lobbyStore.closeModal()"
                class="absolute top-2 cursor-pointer right-2 w-7 h-7 text-amber-900 rounded-full flex items-center justify-center hover:rotate-90 hover:scale-90 transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m12 13.4l2.9 2.9q.275.275.7.275t.7-.275t.275-.7t-.275-.7L13.4 12l2.9-2.9q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275L12 10.6L9.1 7.7q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7l2.9 2.9l-2.9 2.9q-.275.275-.275.7t.275.7t.7.275t.7-.275zm0 8.6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
            </button>

            <!-- Title box background effect -->
            <div class="absolute bg-blue-500 shadow-md shadow-blue-600 px-4 flex top-3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md items-center">
                <!-- Screw -->
                <div class="w-3 h-3 bg-gray-400 rounded-sm rotate-45"></div>
                <h2 class="text-2xl font-bold px-10 py-2 text-white text-shadow-md text-shadow-gray-800">Perfil</h2>
                <!-- Screw with effect -->
                <div class="w-3 h-3 rounded-sm rotate-45 bg-gray-400 "></div>
            </div>

            <!-- content box -->
            <div class="mt-10 p-4 flex flex-col gap-4">

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
                        <h3 class="text-lg font-semibold text-amber-900">Unknown</h3>
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
                            :disabled="lobbyStore.selectedProfileIcon.locked"
                            class="bg-green-600 cursor-pointer disabled:cursor-default hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md shadow-md shadow-green-800 disabled:shadow-gray-800 transition"
                        >
                            {{ lobbyStore.selectedProfileIcon.locked ? 'Ícone bloqueado' : 'Confirmar seleção' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>  
    /** Style glow for image div */
    .glow {
        box-shadow: 0 0px 10px 5px rgb(79, 74, 240);
    }
</style>
