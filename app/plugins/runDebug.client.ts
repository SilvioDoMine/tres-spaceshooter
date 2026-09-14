import { useCurrentRunStore } from '~/stores/currentRunStore';
import { useEnemyManagerStore } from '~/stores/enemyManagerStore';
import { useHeartStore } from '~/stores/useHeartStore';
import { useCoinStore } from '~/stores/useCoinStore';
import { useProjectileStore } from '~/stores/projectileStore';
import { playableRoomCount } from '~/utils/progression';

// Comandos de debug no console para testar partidas (só em dev, com a partida rodando):
//   skipRoom()       -> limpa os inimigos e vai para a próxima sala (na última, conclui o capítulo)
//   goToRoom(10)     -> pula direto para a sala 10 do capítulo atual (ex.: boss intermediário)
//   finishChapter()  -> conclui o capítulo agora (vitória, recompensas e libera o próximo)
//   killAll()        -> só limpa inimigos e tiros da sala (a próxima onda entra normalmente)
//   levelUp()        -> sobe 1 nível da nave e abre a escolha de habilidades
//   levelUp(3)       -> sobe 3 níveis; as escolhas abrem uma depois da outra
//   dropHearts(3)    -> solta 3 corações em volta da nave
//   dropCoins(8)     -> solta 8 moedas em volta da nave (voam para ela quando a sala for limpa)
export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return;

  function activeRun() {
    const run = useCurrentRunStore();
    if (!run.levelConfig || !run.isPlaying) {
      console.warn('[debug] Nenhuma partida rodando (abra /play/:id e feche pausa/escolha de habilidade).');
      return null;
    }
    return run;
  }

  // Remove sem matar: não gera fragmentos, ouro, XP nem progresso de missão
  function clearCombat() {
    useEnemyManagerStore().activeEnemies = [];
    const store = useProjectileStore();
    store.projectiles = store.projectiles.filter((projectile: any) => projectile.ownerType !== 'enemy');
  }

  function roomLabel(run: ReturnType<typeof useCurrentRunStore>) {
    if (run.isVictory) return `Capítulo ${run.levelConfig?.chapter ?? '?'} concluído`;
    return `Sala ${playableRoomCount(run.levelConfig, run.currentStageIndex)}/${playableRoomCount(run.levelConfig)}`;
  }

  // nextStage() é o mesmo caminho da porta: carrega a sala seguinte ou, na última, dá a vitória
  function jumpAfter(run: ReturnType<typeof useCurrentRunStore>, stageIndex: number) {
    clearCombat();
    run.currentStageIndex = stageIndex;
    run.nextStage();
    return roomLabel(run);
  }

  function skipRoom() {
    const run = activeRun();
    return run ? jumpAfter(run, run.currentStageIndex) : undefined;
  }

  function goToRoom(room: number) {
    const run = activeRun();
    if (!run) return;
    const stages = run.levelConfig.stages;
    const index = stages.findIndex((stage: any, i: number) => stage.type !== 'intro' && playableRoomCount(run.levelConfig, i) === room);
    if (index < 1) return console.warn(`[goToRoom] Sala inválida. Use 1 a ${playableRoomCount(run.levelConfig)}.`);
    return jumpAfter(run, index - 1);
  }

  function finishChapter() {
    const run = activeRun();
    return run ? jumpAfter(run, run.levelConfig.stages.length - 1) : undefined;
  }

  function killAll() {
    if (!activeRun()) return;
    clearCombat();
    return 'Inimigos e tiros removidos';
  }

  // Soma exatamente o XP que falta: o addExp da partida sobe os níveis e enfileira uma escolha por nível
  function levelUp(levels = 1) {
    const run = useCurrentRunStore();
    if (!run.levelConfig || run.isGameOver || run.isVictory) {
      return console.warn('[levelUp] Nenhuma partida em andamento (abra /play/:id).');
    }
    const count = Math.max(1, Math.min(20, Math.floor(Number(levels) || 1)));
    let needed = run.expToNextLevel - run.currentExp;
    for (let level = run.currentLevel + 1; level < run.currentLevel + count; level++) needed += run.getExpForLevel(level);
    run.addExp(needed);
    return `Nível ${run.currentLevel} (${count} ${count === 1 ? 'escolha' : 'escolhas'} de habilidade)`;
  }

  // Solta corações em volta da nave (rng 0 garante o drop), para conferir o visual
  function dropHearts(count = 3) {
    const run = activeRun();
    if (!run) return;
    const player = run.getPlayerPosition();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      useHeartStore().tryDrop({ x: player.x + Math.cos(angle) * 3, z: player.z + Math.sin(angle) * 3 }, () => 0);
    }
    return `${useHeartStore().hearts.length} corações no chão`;
  }

  // Solta moedas de 1 de ouro em volta da nave; elas só voam quando a sala for limpa (killAll + fim da onda)
  function dropCoins(count = 8) {
    const run = activeRun();
    if (!run) return;
    const player = run.getPlayerPosition();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      useCoinStore().drop({ x: player.x + Math.cos(angle) * 3, z: player.z + Math.sin(angle) * 3 }, 1);
    }
    return `${useCoinStore().coins.length} moedas no chão`;
  }

  Object.assign(window, { skipRoom, goToRoom, finishChapter, killAll, levelUp, dropHearts, dropCoins });

  console.info('[debug] skipRoom() • goToRoom(10) • finishChapter() • killAll() • levelUp(3) • dropHearts(3) • dropCoins(8)');
});
