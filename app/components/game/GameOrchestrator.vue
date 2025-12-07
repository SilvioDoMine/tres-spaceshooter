<script setup lang="ts">
import { useLoop } from '@tresjs/core';
import { usePlayerControls } from '~/composables/usePlayerControls';
import { useGameDirector } from '~/composables/useGameDirector';
import { useEnemyManager } from '~/composables/useEnemyManager';
import { useEnemyAI } from '~/composables/useEnemyAI';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useProjectileStore } from '~/stores/projectileStore';

/**
 * Funções para controlar o loop de renderização.
 * onRender: Executa APÓS a renderização da cena 3D.
 * onBeforeRender: Executa ANTES da renderização da cena 3D.
 */
const { onRender, onBeforeRender } = useLoop();
  
// 1. Inicializa Subsistemas
// Os subsistemas são instâncias de composables que expõem uma função `update`
const playerControls = usePlayerControls();
const gameDirector = useGameDirector();
const enemyManager = useEnemyManager();
const enemyAI = useEnemyAI();
const currentRunStore = useCurrentRunStore();
const projectileStore = useProjectileStore();
const skillStore = useSkillStore();

/**
 * Função central de atualização do jogo.
 * Chamada automaticamente em cada frame.
 * @param {number} delta - Tempo decorrido em segundos desde o último frame.
 */
const gameTick = ({ delta }: { delta: number }) => {
// Evita cálculos excessivos se o delta for muito grande (e.g., aba inativa)
const safeDelta = Math.min(delta, 0.1); 

skillStore.update(safeDelta);

if (! currentRunStore.isPlaying ) {
    return;
}

// 2. Atualiza todos os Subsistemas
// Processamento de Input e Movimento
playerControls.update(safeDelta);
// usePhysics().update(safeDelta); 

// Lógica de Combate e AI
enemyManager.update(safeDelta);
enemyAI.update(safeDelta);
projectileStore.update(safeDelta);
// playerCombat.update(safeDelta);

// Gerenciamento de Partida
gameDirector.update(safeDelta);

// 3. Atualiza o Estado Global (Pinia) se necessário, mas idealmente 
// os subsistemas já fazem isso (ex: usePlayerCombat atualiza currentRun.currentHealth)
};

// 4. Conecta a função de Tick ao Loop de Renderização do TresJS
// O onLoop garante que sua lógica rode ANTES da renderização da cena 3D.
onBeforeRender(gameTick);

// O TresJS por padrão inicia o loop.
</script>

<template>
    <slot />
</template>
