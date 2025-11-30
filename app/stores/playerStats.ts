/**
 * Atributos permanentes (Dano, Vida)
*/
export function usePlayerCombat() {
  // const currentRun = useCurrentRunStore();
  // const playerStats = usePlayerStatsStore();

  const update = (delta: number) => {
    // // 1. Lógica de Cooldown de Ataque
    // currentRun.timeToNextAttack -= delta; // timeToNextAttack é um valor reativo em Pinia

    // if (currentRun.timeToNextAttack <= 0) {
    //   // 2. Executa Ataque
    //   performAttack();
      
    //   // 3. Reseta Cooldown (com base em stats de playerStats/currentRun)
    //   currentRun.timeToNextAttack = playerStats.baseAttackRate / (1 + currentRun.attackSpeedBonus);
    // }
  };
  
  const performAttack = () => {
    // Lógica completa de tiro (Passo 1-3 do seu Fluxo de Lógica)
    
    // ... Calcular dano final, aplicar upgrades
    
    // Exemplo: Criar um projétil no sistema de Renderização
    // useProjectileSystem().spawnProjectile(finalConfig); 
  };
  
  return {
    update, // Essencial para ser chamado pelo useGameLoop
    performAttack,
  };
}
