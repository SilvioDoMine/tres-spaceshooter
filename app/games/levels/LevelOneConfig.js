// // Define a estrutura de cada onda de inimigos dentro de uma sala/fase
// export interface Wave {
//   enemyType: 'goblin' | 'orc' | 'boss'; // Tipos de inimigos (será usado pela AI/Renderização)
//   count: number;                       // Quantidade a spawnar
//   delay: number;                       // Atraso antes de spawnar essa onda (em segundos)
// }

// // Define uma Sala/Stage
// export interface Stage {
//   stageId: string;
//   type: 'combat' | 'upgrade' | 'boss'; // Tipos de sala: combate, seleção de upgrade, boss
//   waves?: Wave[];                      // Lista de ondas de inimigos (apenas se type='combat')
//   environmentModel: string;            // Ex: 'dungeon_room_1.gltf' (para o componente GameWorld)
// }

// // Define o Nível (conjunto de salas)
// export interface LevelConfig {
//   levelId: string;
//   stages: Stage[]; // Sequência de salas que o jogador deve completar
// }
// O NCRIPT (Configuração do Nível 1)
export const LEVEL_1 = {
  levelId: 'level_open_space_001',
  width: 10,
  height: 20,
  stages: [
    // {
    //   stageId: 'S1_Intro',
    //   type: 'intro',
    //   waves: [],
    //   devDescription: 'Sala de introdução ao nível, sem inimigos. Basta andar para a próxima sala.',
    //   door: {
    //     position: { x: 0, y: 0, z: -9 },
    //     size: { width: 4, height: 8 },
    //   },
    // },
    {
      stageId: 'S2_Combat_Intro',
      type: 'combat',
      waves: [
        {
          enemies: [
            { enemyType: 'asteroid', count: 4 },
          ]
        },
        {
          enemies: [
            { enemyType: 'asteroid', count: 6 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
    },
    {
      stageId: 'S3_Combat_Intro',
      type: 'combat',
      waves: [
        {
          enemies: [
            { enemyType: 'asteroid', count: 4 },
            { enemyType: 'ufo', count: 2 },
          ]
        },
        {
          enemies: [
            { enemyType: 'asteroid', count: 6 },
            { enemyType: 'ufo', count: 2 },
          ]
        },
      ],
      devDescription: 'Segunda sala lança 4 asteroides + 2 UFOs, depois 6 asteroides + 2 UFOs e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
    },
    {
      stageId: 'S4_Upgrade_Select',
      type: 'upgrade',
      devDescription: 'Sala de seleção de upgrade após a segunda sala de combate.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
    },
    {
      stageId: 'S5_Combat_More',
      type: 'combat',
      waves: [
        { enemies: [ { enemyType: 'ufo', count: 4 }, { enemyType: 'asteroid', count: 6 } ] },
        { enemies: [ { enemyType: 'ufo', count: 6 }, { enemyType: 'asteroid', count: 8 } ] }
      ],
      devDescription: 'Terceira sala lança 4 UFOs + 6 asteroides, depois 6 UFOs + 8 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
    },
    {
      stageId: 'S6_Boss',
      type: 'boss',
      waves: [
        { enemies: [ { enemyType: 'boss', count: 1 } ] }
      ],
      devDescription: 'Sala do chefe final do nível. Após vencer, o nível é concluído após eu sair da portinha.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
    },
  ],
};
