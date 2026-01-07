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
// O SCRIPT (Configuração do Nível 1)
export const LEVEL_1 = {
  levelId: 'level_open_space_001',
  chapter: 1,
  width: 10,
  height: 20,
  rewardExperience: 80, // Experiência concedida ao completar finalizar o nível
  stages: [
    {
      stageId: '1_Combat_Intro',
      type: 'intro',
      width: 10,
      height: 20,
      waves: [],
      devDescription: 'Sala de introdução ao nível, sem inimigos. Basta andar para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '2_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 3, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '3_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 4, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '4_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 4, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      width: 10,
      height: 20,
      stageId: '5_Upgrade_Select',
      type: 'upgrade',
      devDescription: 'Sala de seleção de upgrade após a segunda sala de combate.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 8 },
    },
    {
      stageId: '6_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 5, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '7_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 5, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '8_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 6, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '9_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 7, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '10_Miniboss_Asteroid',
      type: 'boss',
      width: 30,
      height: 30,
      waves: [
        { enemies: [{ enemyType: 'asteroidBoss', count: 1, delay: 3 }] }
      ],
      devDescription: 'Sala do chefe intermediário do nível. Após vencer, o nível é concluído e novo inimigo introduzido.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '11_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 4, delay: 0.5 },
            { enemyType: 'asteroid', count: 2, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Segunda sala lança 4 asteroides + 2 UFOs, depois 6 asteroides + 2 UFOs e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '12_Combat_More',
      type: 'combat',
      width: 20,
      height: 30,
      waves: [
        {
          enemies: [
            { enemyType: 'asteroid', count: 4, delay: 1.5 },
            { enemyType: 'miniasteroid', count: 4, delay: 1.5 }
          ]
        },
      ],
      devDescription: 'Terceira sala lança 4 UFOs + 6 asteroides, depois 6 UFOs + 8 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '13_Combat_More',
      type: 'combat',
      width: 30,
      height: 40,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 6, delay: 1.5 },
            { enemyType: 'asteroid', count: 5, delay: 1.5 },
          ]
        },
      ],
      devDescription: 'Após o chefe boss, agora teremos um novo inimigo que é o ufofast.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '14_Combat_More',
      type: 'combat',
      width: 30,
      height: 40,
      waves: [
        {
          enemies: [
            { enemyType: 'miniasteroid', count: 8, delay: 1.5 },
            { enemyType: 'asteroid', count: 6, delay: 1.5 },
          ]
        },
      ],
      devDescription: 'Após o chefe boss, agora teremos um novo inimigo que é o ufofast.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      width: 10,
      height: 20,
      stageId: '15_Upgrade_Select',
      type: 'upgrade',
      devDescription: 'Sala de seleção de upgrade após a segunda sala de combate.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 8 },
    },
    {
      stageId: '16_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'asteroid', count: 6, delay: 0.5 },
          ]
        },
        {
          enemies: [
            { enemyType: 'asteroid', count: 8, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '17_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'asteroid', count: 6, delay: 0.5 },
          ]
        },
        {
          enemies: [
            { enemyType: 'asteroid', count: 8, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '18_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'asteroid', count: 6, delay: 0.5 },
          ]
        },
        {
          enemies: [
            { enemyType: 'asteroid', count: 8, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '19_Combat_Intro',
      type: 'combat',
      width: 30,
      height: 20,
      waves: [
        {
          enemies: [
            { enemyType: 'asteroid', count: 6, delay: 0.5 },
          ]
        },
        {
          enemies: [
            { enemyType: 'asteroid', count: 8, delay: 0.5 },
          ]
        },
      ],
      devDescription: 'Primeira sala lança 4 asteroides, depois 6 asteroides e então é liberado para a próxima sala.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    {
      stageId: '20_Boss',
      type: 'boss',
      width: 30,
      height: 30,
      waves: [
        { enemies: [{ enemyType: 'boss', count: 1, delay: 3 }] }
      ],
      devDescription: 'Sala do chefe final do nível. Após vencer, o nível é concluído após eu sair da portinha.',
      door: {
        position: { x: 0, y: 0, z: -9 },
        size: { width: 4, height: 8 },
      },
      playerStartPosition: { x: 0, y: 0, z: 0 },
    },
    // {
    //   stageId: 'S8_KamikazeBoss',
    //   type: 'boss',
    //   width: 30,
    //   height: 30,
    //   waves: [
    //     { enemies: [{ enemyType: 'kamikazeBoss', count: 1, delay: 3 }] }
    //   ],
    //   devDescription: 'Chefe final do nível que utiliza ataques kamikaze.',
    //   door: {
    //     position: { x: 0, y: 0, z: -9 },
    //     size: { width: 4, height: 8 },
    //   },
    //   playerStartPosition: { x: 0, y: 0, z: 0 },
    // },
    // {
    //   stageId: 'S9_Combat_More',
    //   type: 'combat',
    //   width: 30,
    //   height: 40,
    //   waves: [
    //     {
    //       enemies: [
    //         { enemyType: 'kamikaze', count: 2, delay: 1.5 },
    //         { enemyType: 'ufofast', count: 2, delay: 1.5 },
    //         { enemyType: 'asteroid', count: 4, delay: 1.5 },
    //       ]
    //     },
    //     {
    //       enemies: [
    //         { enemyType: 'kamikaze', count: 3, delay: 1.5 },
    //         { enemyType: 'ufofast', count: 3, delay: 1.5 },
    //         { enemyType: 'asteroid', count: 6, delay: 1.5 },
    //       ]
    //     },
    //     {
    //       enemies: [
    //         { enemyType: 'kamikaze', count: 4, delay: 1.5 },
    //         { enemyType: 'ufofast', count: 4, delay: 1.5 },
    //         { enemyType: 'asteroid', count: 8, delay: 1.5 },
    //       ],
    //     },
    //   ],
    //   devDescription: 'Sala final com todos os inimigos do nível para testar as mecânicas aprendidas.',
    //   door: {
    //     position: { x: 0, y: 0, z: -9 },
    //     size: { width: 4, height: 8 },
    //   },
    //   playerStartPosition: { x: 0, y: 0, z: 0 },
    // }
  ],
};
