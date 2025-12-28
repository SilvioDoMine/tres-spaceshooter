<script setup lang="js">
</script>

<template>
    <div :class="[
        `absolute right-0 top-0`,
        `bg-black rounded-full bg-linear-to-br from-red-100 from-10% via-red-600 via-30% to-red-800`,
        `animation-float`,
    ]">
        <div :class="[
            `rounded-full w-4 h-4 flex items-center justify-center bg-red-600`,
            `shadow-[inset_0px_0.5px_0px_0px_rgba(255,255,255,0.4),inset_0px_-1px_0px_0px_rgba(0,0,0,0.4)]`,
            `border-[0.75px] border-red-900`,
            `font-extrabold font-sans text-[11px] text-white`,
            `relative`,
            `drop-shadow-[0px_1px_0px_rgba(0,0,0,0.5)]`,
        ]">
            <p class="mx-auto">!</p>
        </div>
    </div>
</template>