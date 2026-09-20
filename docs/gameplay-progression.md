# Progressão de capítulos e EXP

Os capítulos 1–4 usam uma wave por sala: 35, 38, 40 e 38 salas respectivamente. O capítulo 5 tem 20 salas: duas waves por combate na primeira metade e três na segunda; os dois encontros de boss têm uma wave. A intro fica fora da contagem. Os capítulos 4 e 5 são versões iniciais jogáveis, com balanceamento sujeito a playtest.

## Estruturas

chapterStages(stages, chapter, structure) em app/games/levels/helpers.js aceita:
- quick: cada wave vira uma sala. Padrão dos capítulos 1–4; planejar 30–40 salas.
- waves: preserva todas as waves na mesma sala. Padrão a partir do capítulo 5; planejar cerca de 20 salas.
- boss-rush: aceita somente encontros de boss, por exemplo cinco salas.

Capítulo 4: Aríete no tier 10 e Leviatã no tier 20. Capítulo 5: Bastião no tier 10 e Catedral no tier 20. Os capítulos são desbloqueados em sequência; saves com o capítulo 3 concluído passam a liberar o 4. combatTier continua entre 1 e 20, independente do número exibido da sala. structure na configuração é passado explicitamente ao helper. O portal do capítulo 5 só abre depois da última wave e de todos os inimigos, incluindo invocações e fragmentos.

As curvas de vida e dano agora têm patamares próprios para capítulos 4 e 5. Bosses novos usam vida exata (16.000/19.500) e recompensas fixas de 1.400/1.800 EXP. Drones invocados continuam sem EXP e desaparecem com a nave-mãe. O Aríete concede 650 EXP base. Não são concedidos níveis por entrar numa sala.

## EXP

runExperience.js calcula os custos por nível a partir da EXP dos inimigos e fragmentos configurados no capítulo. targetPlayerLevel define o alvo normal (23 atualmente). A distribuição considera o avanço entre salas, sem conceder níveis gratuitos ao entrar no portal. O jogador precisa receber a EXP dos abates.

A simulação sem bônus chega ao nível 23. Aprendizado II desde a terceira sala resulta aproximadamente em nível 28–29. O resultado real depende das cartas, equipamentos, inimigos extras e EXP coletada; não é um limite de nível. Além do alvo, os custos crescem progressivamente. Alterar inimigos ou recompensas recalcula a curva no início da próxima partida. Boss-rush precisa de bosses com recompensa de EXP; encontros com recompensa zero não geram evolução por si só.

## Marcos de conclusão de sala

app/utils/chapterMilestones.js deriva os marcos de LEVELS: um a cada MILESTONE_EVERY (5) salas limpas, mais a última sala do capítulo. Nada é escrito à mão, então mudar o número de salas de um capítulo reposiciona os marcos sozinho. Com 35, 38, 40, 38 e 20 salas, os capítulos têm 7, 8, 8, 8 e 4 marcos (35 no total). Os marcos usam o número exibido da sala, não combatTier.

Cada marco entrega { gold, exp, cash, keys, equipmentRarities } — o mesmo formato das missões diárias e do LobbyRewardsModal. Os intermediários ciclam quatro formatos (ouro+EXP, gemas, ouro+chave de prata, gemas+EXP) e escalam com o capítulo. O marco final de cada capítulo dá ouro alto, 100 gemas, uma chave de obsidiana e um equipamento, com raridade subindo por capítulo. Ao criar um capítulo novo, conferir se a escala das recompensas continua coerente com a economia da loja.

O progresso vem de clearedRooms em app/utils/chapterProgress.js: gameVictoryRewards() registra as salas limpas no fim de cada partida, vitória ou derrota. Morrer numa sala não a conta, então perder na sala 8 grava 7. O valor só sobe. Os campos clearedRooms e claimedMilestones foram adicionados sem mudar CHAPTER_PROGRESS_VERSION, porque bumpar a versão descarta o save inteiro: saves antigos entram com os marcos zerados e mantêm os capítulos já liberados.

O resgate é sequencial e um marco por vez, na tela LobbyMilestonesScreen (baú "A Ser Resgatado" acima do INICIAR, no espaço onde ficava a faixa do chefe). A tela ocupa a mesma caixa das outras telas do lobby: topbar e barra de abas continuam visíveis e usáveis, e trocar de aba fecha os marcos. O jogador só interage com o marco atual; os vizinhos aparecem cortados e servem apenas para mostrar que a fila continua — em telas largas aparecem mais deles, sem navegação. Em dev, window.setChapterRooms(capitulo, salas) libera marcos sem jogar as salas.

## Câmera

rangeCamera.js enquadra o alcance completo na menor dimensão da viewport, com margem para movimento, casco e tremor. A câmera abre quando o alcance aumenta ou a tela estreita; fechar é gradual. O alcance do combate não é reduzido. A seleção automática ignora alvos fora do enquadramento. As regras de ataque dos inimigos permanecem independentes. Durante a pausa, movimentação não desloca a câmera; mudanças reais de viewport ou alcance ainda podem ajustar o enquadramento.

Validação: node --test tests/*.test.mjs. runPacing.test.mjs simula EXP por sala e verifica o círculo de alcance em retrato, paisagem e desktop. chapterMilestones.test.mjs cobre as posições e os pacotes dos marcos; chapters.test.mjs cobre a contagem de salas e o progresso salvo.
