<script setup lang="js">
import BaseButton from '~/components/base/Button.vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    currentProgress: {
        type: Number,
        required: true
    },
    maxProgress: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'in_progress',
        validator: (value) => ['in_progress', 'claimable', 'claimed'].includes(value)
    }
});

const emit = defineEmits(['claim', 'play']);

const progressPercentage = computed(() => {
    return Math.min(Math.round((props.currentProgress / props.maxProgress) * 100), 100);
});

const progressText = computed(() => {
    return `${props.currentProgress}/${props.maxProgress}`;
});
</script>

<template>
    <div class="flex h-svh relative flex-row bg-yellow-500 rounded-2xl shadow-sm shadow-black/40 items-center snap-start">
        <!-- Progression count -->
        <div class="z-10 rounded-br-2xl h-full flex items-center justify-center relative">
             <!-- Full div -->
            <div class="text-white flex items-center justify-center px-1 sm:px-3 rounded-l-2xl rounded-br-2xl h-full font-bold bg-yellow-500 w-full z-2">
                <ImageMissionBadge size="small" description="10" />
            </div>

            <!-- Absolute background notch -->
            <div class="absolute inset-0 bottom-0 bg-orange-200 rounded-l-2xl"></div>
        </div>

        <!-- Progress -->
        <div class="bg-orange-200 flex-1 rounded-tl-3xl rounded-r-2xl h-full py-2 px-3 flex flex-row justify-between items-center">

            <!-- Mission Title and Progress -->
            <div class="w-full pr-2">
                <!-- Mission Title -->
                <p class="title-text font-bold text-amber-900! text-[13px] sm:text-xs">{{ title }}</p>
                <!-- Progress bar glossy full -->
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" :style="{ width: progressPercentage + '%' }">
                        <div class="progress-bar-highlight"></div>
                    </div>
                    <span class="progress-bar-text">{{ progressText }}</span>
                </div>
            </div>

            <!-- Action -->
            <!-- In Progress: Yellow "Jogar" button -->
            <BaseButton
                v-if="status === 'in_progress'"
                variant="yellow"
                size="xs"
                class="h-fit w-20 sm:w-[95px]"
                @click="emit('play')"
            >
                Jogar
            </BaseButton>

            <!-- Claimable: Green "Resgatar" button -->
            <BaseButton
                v-else-if="status === 'claimable'"
                variant="green"
                size="xs"
                class="h-fit w-20 sm:w-[95px]"
                @click="emit('claim')"
            >
                Resgatar
            </BaseButton>

            <!-- Claimed: Check icon -->
            <div
                v-else-if="status === 'claimed'"
                class="h-fit z-30 flex items-center justify-center text-emerald-400"
            >
                <svg class="w-20 sm:w-[95px] drop-shadow-[1px_-1.5px_0px_rgba(34,157,94,1),1.5px_2px_0px_rgba(34,157,94,1),0.5px_0px_1px_rgba(0,0,0,1)]" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
                    <!-- Icon from MingCute Icon by MingCute Design - https://github.com/Richard9394/MingCute/blob/main/LICENSE --><g fill="none" fill-rule="evenodd"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M19.495 3.133a1 1 0 0 1 1.352.309l.99 1.51a1 1 0 0 1-.155 1.279l-.003.004l-.014.013l-.057.053l-.225.215a84 84 0 0 0-3.62 3.736c-2.197 2.416-4.806 5.578-6.562 8.646c-.49.856-1.687 1.04-2.397.301l-6.485-6.738a1 1 0 0 1 .051-1.436l1.96-1.768A1 1 0 0 1 5.6 9.2l3.309 2.481c5.169-5.097 8.1-7.053 10.586-8.548"/></g>
                </svg>
            </div>

        </div>

        <!-- If its claimed, black overlay on the mission-->
        <div
            v-if="status === 'claimed'"
            class="absolute z-20 text-shadow-md text-shadow-black inset-0 bg-black/50 rounded-2xl flex items-center justify-center pointer-events-none"
        >
            <p v-if="false" class="title-text font-bold text-white! text-lg">Concluído</p>
        </div>

    </div>
</template>

<style scoped>
/* Progress Bar Styles */
.progress-bar-container {
    position: relative;
    width: 100%;
    height: 0.75rem; /* 20px */
    background: linear-gradient(to bottom, #6b5d4f 0%, #5a4d3f 50%, #4a3d2f 100%);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    margin-top: 0.2rem;
    overflow: hidden;
    box-shadow:
        inset 0 2px 4px 0 rgba(0, 0, 0, 0.3),
        0 1px 0 0 rgba(255, 255, 255, 0.1);
}

/* If screen >= sm, increase height */
@media (min-width: 640px) {
    .progress-bar-container {
        height: 1.25rem; /* 24px */
    }
}

.progress-bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(to bottom, #7ce85c 0%, #5cd63c 50%, #3cc41c 100%);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    transition: width 0.3s ease;
    box-shadow:
        inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
        0 1px 2px 0 rgba(0, 0, 0, 0.2);
}

.progress-bar-highlight {
    position: absolute;
    left: 10%;
    right: 10%;
    top: 1px;
    height: 40%;
    background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.5) 0%,
        rgba(255, 255, 255, 0.1) 100%
    );
    border-radius: 9999px;
    pointer-events: none;
}

.progress-bar-text {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Lilita One', sans-serif;
    font-size: 0.60rem;
    font-weight: bold;
    color: #ffffff;
    text-shadow:
        1px 1px 0px rgba(0, 0, 0, 0.8),
        0 0 4px rgba(0, 0, 0, 0.5);
    z-index: 10;
    pointer-events: none;
}
</style>
