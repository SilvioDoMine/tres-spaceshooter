<script setup lang="js">
const props = defineProps({
  /** Ícone de dinheiro (Gold) */
  size: {
    type: Number,
    default: 40,
  },
});
</script>

<template>

<svg class="text-green-500 drop-shadow-[0_0_12px_rgba(59,130,0,0.8)]" xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 36 36">
    <!-- Icon from Twitter Emoji by Twitter - https://creativecommons.org/licenses/by/4.0/ -->
    <circle cx="18" cy="19" r="17" fill="#1B5E20"/>
    <circle cx="18" cy="17" r="17" fill="#4CAF50"/>
    <circle cx="18" cy="18" r="14" fill="#A5D6A7"/>
    <circle cx="18" cy="17" r="14" fill="#2E7D32"/>
    
    <!-- Cifrão ($) -->
    <!-- Linha vertical -->
    <rect x="17" y="8" width="2" height="18" fill="#A5D6A7" rx="1"/>
    
    <!-- Parte superior do S -->
    <path d="M 22 13 C 22 11.5 20.5 10.5 18 10.5 C 15.5 10.5 14 11.5 14 13 C 14 14.3 15 15 16.5 15.5 L 19.5 16.5" 
          fill="none" stroke="#A5D6A7" stroke-width="2.5" stroke-linecap="round"/>
    
    <!-- Parte inferior do S -->
    <path d="M 16.5 16.5 L 19.5 17.5 C 21 18 22 18.7 22 20 C 22 21.5 20.5 22.5 18 22.5 C 15.5 22.5 14 21.5 14 20" 
          fill="none" stroke="#A5D6A7" stroke-width="2.5" stroke-linecap="round"/>
</svg>
</template>
