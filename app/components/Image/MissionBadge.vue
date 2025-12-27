<script setup lang="js">
const props = defineProps({
    size: {
        type: String,
        default: 'medium',
        validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    shake: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ''
    }
});
</script>

<template>
    <div
        :class="[
            'badge-image relative',
            size === 'small' ? 'w-8 h-8' :
            size === 'medium' ? 'w-12 h-12' :
            size === 'large' ? 'w-16 h-16' : '',
            shake ? 'animation-shake' : ''
        ]"
    >
        <img
            src="/images/icons/badges/mission-badge.png"
            alt="Mission Badge"
            class="w-full h-full object-contain drop-shadow-[1px_1px_0px_rgba(0,0,0,0.8),-0.5px_-0.5px_0px_rgba(0,0,0,0.8)]"
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
    </div>
</template>
