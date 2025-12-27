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
    <div class="flex h-15 relative flex-row bg-yellow-500 rounded-2xl shadow-sm shadow-black/40 items-center snap-start">
        <!-- Progression count -->
        <div class="z-10 rounded-br-2xl h-full flex items-center justify-center relative">
             <!-- Full div -->
            <div class="text-white flex items-center justify-center px-1.5 sm:px-3 rounded-l-2xl rounded-br-2xl h-full font-bold bg-yellow-500 w-full z-2">
                <svg class="w-6 h-6 sm:w-8 sm:h-8" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 20 20"><!-- Icon from Pepicons Print by CyCraft - https://github.com/CyCraft/pepicons/blob/dev/LICENSE --><g fill="currentColor"><g opacity=".2"><path d="M4.62 8.496c-.217-.892.781-1.581 1.538-1.061l1.83 1.256a1 1 0 0 0 1.417-.298l1.244-2.016a1 1 0 0 1 1.702 0l1.244 2.016a1 1 0 0 0 1.417.298l1.83-1.256c.757-.52 1.755.169 1.538 1.06l-1.4 5.742a1 1 0 0 1-.971.763H6.99a1 1 0 0 1-.971-.763z"/><path fill-rule="evenodd" d="M15.825 10.532a3 3 0 0 1-3.931-1.088l-.394-.638l-.394.638a3 3 0 0 1-3.93 1.088l.6 2.468h7.447zM6.158 7.435c-.757-.52-1.755.169-1.538 1.06l1.4 5.742a1 1 0 0 0 .97.763h9.018a1 1 0 0 0 .971-.763l1.4-5.741c.217-.892-.781-1.581-1.538-1.061l-1.83 1.256a1 1 0 0 1-1.417-.298L12.35 6.377a1 1 0 0 0-1.702 0L9.405 8.393a1 1 0 0 1-1.417.298z" clip-rule="evenodd"/><path d="M12.5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0M20 6a1 1 0 1 1-2 0a1 1 0 0 1 2 0"/><path fill-rule="evenodd" d="M6.25 16.5a.75.75 0 0 1 .75-.75h8.737a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75" clip-rule="evenodd"/><path d="M5 6a1 1 0 1 1-2 0a1 1 0 0 1 2 0"/></g><path fill-rule="evenodd" d="m14.896 13.818l1.515-5.766l-2.214 1.41a2 2 0 0 1-2.74-.578L10 6.695l-1.458 2.19a2 2 0 0 1-2.74.577L3.59 8.052l1.515 5.766zm-10.77-6.61c-.767-.489-1.736.218-1.505 1.098l1.516 5.766a1 1 0 0 0 .967.746h9.792a1 1 0 0 0 .967-.746l1.516-5.766c.23-.88-.738-1.586-1.505-1.098l-2.214 1.41a1 1 0 0 1-1.37-.288l-1.458-2.19a1 1 0 0 0-1.664 0L7.71 8.33a1 1 0 0 1-1.37.289z" clip-rule="evenodd"/><path d="M10.944 3.945a.945.945 0 1 1-1.89.002a.945.945 0 0 1 1.89-.002M18.5 5.836a.945.945 0 1 1-1.89.001a.945.945 0 0 1 1.89 0M3.389 5.836a.945.945 0 1 1-1.89.001a.945.945 0 0 1 1.89 0"/><path fill-rule="evenodd" d="M5.25 16a.5.5 0 0 1 .5-.5h8.737a.5.5 0 1 1 0 1H5.75a.5.5 0 0 1-.5-.5" clip-rule="evenodd"/></g></svg>
            </div>

            <!-- Absolute background notch -->
            <div class="absolute inset-0 bg-orange-200 rounded-l-2xl"></div>
        </div>

        <!-- Progress -->
        <div class="bg-orange-200 flex-1 rounded-tl-3xl rounded-r-2xl h-full p-1 px-2 flex flex-row justify-between items-center">

            <!-- Mission Title and Progress -->
            <div class="w-full pr-2">
                <!-- Mission Title -->
                <p class="title-text font-bold text-amber-900! text-[10px] sm:text-xs">{{ title }}</p>
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
