<script setup lang="js">
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useSkillStore } from '~/stores/SkillStore';

const currentRunStore = useCurrentRunStore();
const skillStore = useSkillStore();

const getSkillColorClass = (rarity) => {
    switch (rarity) {
        case 'common':
            return 'bg-gray-400 text-black hover:bg-gray-300 group-hover:bg-gray-300';
        case 'uncommon':
            return 'bg-green-400 text-black hover:bg-green-300 group-hover:bg-green-300';
        case 'rare':
            return 'bg-blue-400 text-black hover:bg-blue-300 group-hover:bg-blue-300';
        case 'epic':
            return 'bg-purple-400 text-black hover:bg-purple-300 group-hover:bg-purple-300';
        case 'legendary':
            return 'bg-yellow-400 text-black hover:bg-yellow-300 group-hover:bg-yellow-300';
        default:
            return 'bg-white text-black hover:bg-gray-200 group-hover:bg-gray-200';
    }
};

// When modal is closed and opens up, we should throw confetti
watch(
    () => skillStore.isModalOpen,
    (newVal, oldVal) => {
        if (newVal && !oldVal) {
            confettiOnPageSides(200);
            confettiOnBottom(200);
        }
    }
);
</script>

<template>
    <div 
        :class="
            currentRunStore.isPaused 
                && skillStore.isModalOpen
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
        "
        class="absolute z-50 translate-all flex duration-500 inset-0 p-4 text-white bg-black/50 allow-scroll"
        >
        <!-- Cards -->
        <div class="flex sm:flex-row transition-all flex-col gap-4 items-center justify-center w-full sm:px-4 sm:h-full">
            <div 
                v-for="skill in skillStore.skillOptions"
                :key="skill.id"
                class="relative flex cursor-pointer gap-4 sm:flex-col sm:items-center sm:w-1/3 md:w-72 md:h-full md:justify-center"
            >

                <!-- Card -->
                <div 
                    class="w-64 sm:w-full md:w-72 p-3 group transition-transform hover:scale-101 active:scale-110 flex flex-col gap-4 rounded-lg grow-0 md:grow md:max-h-96"
                    :class="getSkillColorClass(skill.rarity)"
                    @click="skillStore.selectSkill(skill); currentRunStore.gameResume(currentRunStore.levelConfig);"
                >
                    <div class="bg-gray-800 hover:bg-gray-700 text-white rounded-md flex gap-4 md:gap-10 flex-col p-4 grow-0 md:grow justify-center">
                        <div class="flex gap-2 lg:gap-8 items-center md:flex-col">
                            <!-- Image Icon Big -->
                            <div class="text-4xl md:text-6xl lg:text-7xl aspect-square">{{ skill.icon }}</div>
                            <!-- Title & Tag -->
                            <div class="font-bold flex flex-col gap-2 md:items-center">
                                <h2 class="text-md lg:text-lg">{{ skill.name }}</h2>
                                <div 
                                    class="text-xs italic px-1 bg-gray-400 rounded w-fit"
                                    :class="getSkillColorClass(skill.rarity)"
                                >
                                    Nível {{ skill.currentLevel + 1 }}
                                </div>
                            </div>
                        </div>
                        <!-- Description -->
                        <div class="text-xs flex flex-col gap-2">
                            <p class="text-md font-bold">Efeito: {{ skill.levels[skill.currentLevel + 1].description ?? skill.levels[skill.currentLevel].description }}</p>
                            <p>{{ skill.description }}</p>
                        </div>
                    </div>
                </div>

                <!-- Refresh Button League of Legends style -->
                 <button
                    @click="skillStore.refreshSkill(skill)"
                    :disabled="skill.reRolls < currentRunStore.skillRerollCount"
                    class="bg-gray-500 disabled:opacity-0 cursor-pointer rounded-full p-2 hover:bg-gray-400 hover:scale-95 active:scale-120 transition sm:w-fit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </button>  
            </div>
        </div>
        <!-- <div class="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <h2 class="text-2xl font-bold mb-4">Skill level rapaz</h2>
            <p class="mb-6">The game is currently paused. You can resume or quit the game.</p>
            <ul>
                <li v-for="skill in skillStore.skillOptions" :key="skill.id" class="mb-2 p-2 bg-gray-700 rounded">
                    <h3 class="font-semibold">{{ skill.name }} ({{ skill.rarity }})</h3>
                    <p class="text-sm">{{ skill.description }}</p>
                </li>
            </ul>
            <div class="flex justify-between">
                <button
                    class="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition"
                    @click="currentRunStore.gameResume(currentRunStore.levelConfig)"
                >
                    Resume
                </button>
                <NuxtLink to="/">
                    <button
                        class="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
                    >
                        Quit
                    </button>
                </NuxtLink>
            </div>
        </div> -->
    </div>
</template>