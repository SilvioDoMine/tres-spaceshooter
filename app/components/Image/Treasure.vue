<script setup lang="js">
const props = defineProps({
    size: {
        type: String,
        default: 'medium',
        validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    opened: {
        type: Boolean,
        default: false
    },
    shake: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ''
    },
    notification: {
        type: Boolean,
        default: false
    }
});
</script>

<template>
    <div
        :class="[
            'treasure-image relative',
            size === 'small' ? 'w-8 h-8' :
            size === 'medium' ? 'w-12 h-12' :
            size === 'large' ? 'w-16 h-16' : '',
            opened ? 'treasure-opened' : 'treasure-closed',
            shake ? 'animation-shake cursor-pointer' : ''
        ]"
    >
        <img
            v-if="opened"
            src="/images/icons/treasure/chest-1-2.png"
            alt="Treasure Opened"
            class="w-full h-full object-contain drop-shadow-[1px_1px_0px_rgba(0,0,0,1),-1px_-1px_0px_rgba(0,0,0,1)]"
        />
        <img
            v-else
            src="/images/icons/treasure/chest-1-1.png"
            alt="Treasure Closed"
            class="w-full h-full object-contain drop-shadow-[1px_1px_0px_rgba(0,0,0,1),-1px_-1px_0px_rgba(0,0,0,1)]"
        />

        <div
            v-if="description"
            :class="[
                'absolute -bottom-2 left-1/2 transform text-shadow-sm text-shadow-black -translate-x-1/2 title-text text-xs rounded px-2 py-1 whitespace-nowrap',
                size === 'small' ? 'text-xs' :
                size === 'medium' ? 'text-sm' :
                size === 'large' ? 'text-base' : '',
            ]"
        >
            {{ description }}
        </div>

        <BaseNotification v-if="notification" />
    </div>
</template>
