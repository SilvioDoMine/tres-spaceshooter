<script setup lang="js">
const props = defineProps({
  /** Ícone de experiência (EXP) */
  size: {
    type: Number,
    default: 40,
  },
});
</script>

<template>
  <svg class="drop-shadow-sm drop-shadow-black" :width="size" :height="size" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <!-- Gradiente para dar efeito de brilho -->
    <defs>
      <radialGradient id="orbGradient" cx="40%" cy="30%">
        <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#4169E1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1E90FF;stop-opacity:1" />
      </radialGradient>
      
      <radialGradient id="glowGradient" cx="40%" cy="30%">
        <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:#87CEEB;stop-opacity:0" />
      </radialGradient>
    </defs>
    
    <!-- Brilho externo -->
    <circle cx="100" cy="100" r="85" fill="url(#glowGradient)" opacity="0.4"/>
    
    <!-- Orbe principal -->
    <circle cx="100" cy="100" r="70" fill="url(#orbGradient)"/>
    
    <!-- Reflexo de luz -->
    <ellipse cx="80" cy="75" rx="25" ry="30" fill="white" opacity="0.3"/>
    <ellipse cx="75" cy="70" rx="15" ry="18" fill="white" opacity="0.5"/>
    
    <!-- Texto SVG com contorno preto -->
    <text x="100" y="120" font-family="Arial, sans-serif" font-size="65" font-weight="bold" 
          text-anchor="middle" fill="none" stroke="#000000" stroke-width="8">EXP</text>
    <text x="100" y="120" font-family="Arial, sans-serif" font-size="65" font-weight="bold" 
          text-anchor="middle" fill="#FFFFFF">EXP</text>
  </svg>
</template>
