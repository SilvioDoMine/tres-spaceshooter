# Instruções para agentes de IA

Estas regras valem para todo o repositório.

## Naves e equipamentos do jogador

Antes de criar, gerar, remodelar, importar ou alterar uma nave de jogador, um equipamento visual, hardpoints, propulsores ou efeitos ligados à nave:

1. Leia integralmente [`docs/SHIP_DESIGN_GUIDE.md`](docs/SHIP_DESIGN_GUIDE.md).
2. Trate esse documento como a especificação visual canônica do projeto.
   O guia prevalece sobre blueprints, imagens e modelos de referência; adapte a referência aos slots e regras do guia e registre as diferenças.
3. Preserve os seis slots modulares: arma, asas, cockpit, gerador, campo de força e propulsores.
4. Modele bases, molduras, fixadores e conduítes como parte do casco. Equipamentos não podem parecer objetos colados nem atravessar outras peças.
5. Preserve hardpoints para tiro frontal, dois canhões diagonais pequenos e arma traseira.
6. Modele três estados de arma distintos: Canhão Integrado Padrão no slot vazio, Canhão de Plasma equipado e Lança Iônica equipada. Uma arma equipada substitui completamente a anterior.
7. Considere também todas as cartas temporárias descritas em “Melhorias escolhidas durante a partida”. Os hardpoints máximos devem coexistir sem interseções; Tiros Múltiplos repete disparos e não adiciona canhões.
8. Valide a nave nas vistas superior, inferior, lateral, traseira, hangar e no tamanho real da partida.
9. Confira visualmente combinações de equipamentos e melhorias temporárias antes de considerar o trabalho concluído.

Se uma solicitação de modelagem contrariar o guia, siga a solicitação explícita do usuário e registre no resultado qual regra visual foi excepcionalmente alterada.

## Novos capítulos, salas e progressão

Antes de criar ou alterar capítulos, encontros, waves ou a curva de EXP, leia [docs/gameplay-progression.md](docs/gameplay-progression.md) e confira as configurações atuais em app/games/levels/.

Os capítulos 4 e 5 possuem versões iniciais jogáveis em LevelFourConfig.js e LevelFiveConfig.js. Preserve os encontros e a estrutura descritos em docs/gameplay-progression.md; não registre capítulos vazios no lobby.

- **Capítulo 4:** seguir o formato quick dos capítulos iniciais, com 30–40 salas jogáveis e uma única wave por sala. Matou todos os inimigos do encontro, libera o portal; não iniciar outra wave nessa sala.
- **Capítulo 5:** introduzir o formato waves, com aproximadamente 20 salas e múltiplas waves por sala. Liberar o portal somente após concluir todas as waves.
- **Capítulos especiais futuros:** o formato boss-rush permite sequências curtas, por exemplo cinco bosses. Isso é uma opção de estrutura, não conteúdo já criado nem uma exigência para o capítulo 5.
- Reutilize chapterStages(stages, chapter, structure) de app/games/levels/helpers.js. Mantenha o campo structure da configuração coerente com o argumento passado ao helper. O padrão é quick até o capítulo 4 e waves a partir do 5.
- A intro com portal fica fora da contagem. A primeira sala de combate deve aparecer como 1/total. Não fixe o total de salas em 20 na HUD, no resumo ou no desbloqueio.
- Preserve combatTier como referência da dificuldade dos inimigos, separada do número exibido da sala. Ao criar um capítulo novo, confira as curvas de atributos e ataques existentes: não presuma que adicionar salas cria automaticamente novos patamares de dificuldade.
- Ajuste estrutura e elenco antes da EXP. Use targetPlayerLevel e app/utils/runExperience.js, buscando nível 20–25 numa run normal e aproximadamente 25–30 com bônus de EXP. O alvo atual é 23; não é um limite rígido nem uma recompensa automática por sala. Evite longos intervalos sem evolução e não imponha exatamente um level up por sala.
- Inclua no catálogo a EXP dos novos inimigos e confira recompensas de fragmentos e invocações. Um boss com recompensa zero não concede EXP; um boss-rush exige recompensas adequadas para sustentar a progressão.
- Ao disponibilizar um capítulo completo, registre sua configuração e os textos correspondentes em app/games/levels/index.js (LEVELS e CHAPTER_INFO). Verifique também desbloqueio, vitória, resumo da partida e ambientação específica.
- Valide contagem de salas, liberação do portal após a última wave, ordem dos bosses e progressão de EXP. Atualize os testes pertinentes em tests/runPacing.test.mjs e tests/chapters.test.mjs e execute os testes do projeto.

Preserve também o enquadramento dinâmico do alcance: upgrades devem afastar a câmera sem reduzir o range. Em retrato, o círculo deve ficar próximo às bordas, com pequena margem, e continuar inteiro na tela.
