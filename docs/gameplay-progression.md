# Progressão de capítulos e EXP

Os capítulos atuais usam uma wave por sala: capítulo 1 tem 35 salas, capítulo 2 tem 38 e capítulo 3 tem 40. A intro fica fora da contagem. As waves antigas viraram salas independentes, mantendo o elenco e os tiers de dificuldade. No capítulo 3, os dois grupos pequenos do primeiro encontro foram reunidos numa única wave.

## Estruturas

chapterStages(stages, chapter, structure) em app/games/levels/helpers.js aceita:
- quick: cada wave vira uma sala. Padrão dos capítulos 1–4; planejar 30–40 salas.
- waves: preserva todas as waves na mesma sala. Padrão a partir do capítulo 5; planejar cerca de 20 salas.
- boss-rush: aceita somente encontros de boss, por exemplo cinco salas.

Os capítulos 4 e 5 ainda não possuem conteúdo jogável. O suporte à estrutura está pronto, sem desbloquear capítulos vazios. combatTier controla a dificuldade independentemente do número exibido da sala. structure na configuração documenta o formato; passe o mesmo formato ao helper quando substituir o padrão.

## EXP

runExperience.js calcula os custos por nível a partir da EXP dos inimigos e fragmentos configurados no capítulo. targetPlayerLevel define o alvo normal (23 atualmente). A distribuição considera o avanço entre salas, sem conceder níveis gratuitos ao entrar no portal. O jogador precisa receber a EXP dos abates.

A simulação sem bônus chega ao nível 23. Aprendizado II desde a terceira sala resulta aproximadamente em nível 28–29. O resultado real depende das cartas, equipamentos, inimigos extras e EXP coletada; não é um limite de nível. Além do alvo, os custos crescem progressivamente. Alterar inimigos ou recompensas recalcula a curva no início da próxima partida. Boss-rush precisa de bosses com recompensa de EXP; encontros com recompensa zero não geram evolução por si só.

## Câmera

rangeCamera.js enquadra o alcance completo na menor dimensão da viewport, com margem para movimento, casco e tremor. A câmera abre quando o alcance aumenta ou a tela estreita; fechar é gradual. O alcance do combate não é reduzido. A seleção automática ignora alvos fora do enquadramento. As regras de ataque dos inimigos permanecem independentes. Durante a pausa, movimentação não desloca a câmera; mudanças reais de viewport ou alcance ainda podem ajustar o enquadramento.

Validação: node --test tests/*.test.mjs. runPacing.test.mjs simula EXP por sala e verifica o círculo de alcance em retrato, paisagem e desktop.
