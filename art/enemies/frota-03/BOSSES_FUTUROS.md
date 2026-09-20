# Propostas de bosses — capítulos 4 e 5

Estas são propostas de comportamento apoiadas pelos modelos, não mecânicas já implementadas. Os tempos abaixo são valores iniciais para prototipação; vida, dano e recompensas devem ser definidos durante o balanceamento.

## Capítulo 4 — Leviatã, couraçado de cerco

Casco alongado, trilhos magnéticos visíveis, um canhão axial de grande calibre, três lançadores de mísseis e seis baterias em cada lateral. Silhueta e escala próprias, sem reaproveitar o casco do Colosso.

- Fase 1: carrega o feixe axial por 1,5 s, mostra a faixa de perigo, trava a mira antes de disparar e abre uma janela de recuperação de 2 s. Alterna com uma salva de três mísseis.
- Fase 2: intercala bordadas de seis tiros de apenas um lado por vez. A lateral iluminada indica de onde virá a salva.
- Fase 3: encurta a recuperação, expõe o núcleo e alterna feixe e mísseis. Evitar combinar ataques de modo que todas as rotas fiquem bloqueadas.
- Marcadores: muzzle_siege_beam, muzzle_missile_0..2, muzzle_broadside_-1_0..5 e muzzle_broadside_1_0..5; beam_telegraph guia o aviso.
- Escala inicial sugerida: 3,2. Sem valores de vida/dano arbitrariamente registrados no jogo.
- O capítulo 4 deve seguir a estrutura quick existente, com 30–40 salas e uma wave por sala. Esta entrega fornece o boss, não o capítulo completo.

## Capítulo 5 — Catedral, nave-mãe de assalto

Seis pétalas blindadas com hangares independentes, núcleo elevado em uma estrutura de contenção, anel externo de doze emissores e torre de quatro feixes. Geometria maior que a dos inimigos comuns e distinta da Colmeia.

- Fase 1: duas ou três rajadas radiais de doze pulsos, girando o padrão entre salvas; pausas claras para reposicionamento.
- Fase 2: abre hangares em pares e lança drones limitados por um teto de escoltas. O portal da sala continua bloqueado enquanto houver ondas pendentes.
- Fase 3: expõe o núcleo e gira os quatro feixes após uma antecipação de 1,5 s. Suspender o lançamento de drones durante o ataque de feixe para evitar sobreposição excessiva.
- Marcadores: muzzle_ring_0..11, muzzle_beam_0..3, drone_launch_0..5 e reactor_weakpoint. Grupos: radial_rotor, beam_rotor e hangar_door_0..5.
- Escala inicial sugerida: 3,4. Danos, recompensas e limites de drones pendentes de playtest.
- O capítulo 5 deve usar estrutura waves, aproximadamente 20 salas e múltiplas waves por sala; liberar portal somente após a última wave. Nenhuma sala ou progressão foi implementada nesta entrega.
