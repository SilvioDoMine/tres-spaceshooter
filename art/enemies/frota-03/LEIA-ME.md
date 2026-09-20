# Frota complementar — somente visuais ausentes e bosses futuros

Escopo corrigido conforme a orientação do usuário: preservar todos os modelos próprios existentes. Nenhum código de renderização, boss, encontro ou progressão do jogo foi alterado.

## Modelos preservados

- hiveBoss / Colmeia: buildHive, com quatro hangares e dois canhões.
- harpyBoss / Harpia: buildHarpy, com canhões nas asas e peças móveis.
- bastionBoss / Bastião: buildBastion, com anel de quatro escudos rotativos.
- colossusBoss / Colosso: buildColossus, com baterias, reator e escotilhas.

Esses quatro modelos NÃO foram refeitos nem incluídos como substituições. Rascunhos da seleção anterior foram separados na pasta de trabalho e não fazem parte da entrega.

## Tipos que ainda usavam o Raider e recebem arte própria nesta leva

| Tipo | Modelo | Ataque / função |
|---|---|---|
| miniasteroid | Estilhaço | Um orbe mirado, deriva e colisão |
| asteroidBoss | Geodo | Anel de 10 / leque de 5 e fragmentação |
| miniboss | Martelo | Anel de 10 / leque de 5 |
| boss | Sentinela | Anel de 10 / leque de 5, três fases |
| hiveDrone | Vespa | Drone de colisão, sem disparos |
| kamikazeBoss | Aríete | Investida e tiro único entre cargas |
| angel | Farol | Entrega melhoria, sem armamento |
| torusEnemy | Órbita | Cinco tiros radiais |
| compositeEnemy | Tríade | Três tiros em leque |

A escolha foi validada em EnemyManager.vue, EnemyRaider.vue, EnemyBoss.vue, baseStats e BOSS_BUILDERS. Apesar do nome, o tipo `boss` do capítulo 1 ainda passa pelo Raider no projeto indicado. Os ataques foram verificados em combatPatterns.js, useEnemyAttacks.js e useEnemyAI.js.

## Bosses futuros

- Leviatã: proposta para capítulo 4, couraçado de cerco com canhão axial, mísseis e baterias laterais.
- Catedral: proposta para capítulo 5, nave-mãe com seis hangares, emissores radiais e núcleo exposto.

Os identificadores chapter4Boss e chapter5Boss existem apenas nos assets propostos. Não foram registrados em LEVELS nem criados capítulos vazios. Mecânicas e balanceamento futuros estão descritos em BOSSES_FUTUROS.md.

## Continuidade visual

Perfis angulares com bordas chanfradas, cascos metálicos, painéis sobre estrutura grafite, poucas cores e energia emissiva. Os detalhes mecânicos seguem a linguagem dos builders atuais. Nenhuma nave depende de texturas externas. A leitura superior e a posição das armas foram priorizadas para a câmera do jogo.

## Entrega e integração

Fontes .blend editáveis, GLBs com grupos móveis e marcadores nomeados, renders individuais, atlas e manifest.json. A Frota 02 anterior foi concluída e copiada ao projeto. Com seus seis modelos, estes nove e os quatro modelos preservados, todos os 19 tipos cadastrados têm uma solução visual definida; os dois bosses futuros são adicionais.

A arte está preparada, mas não foi conectada ao EnemyManager. A integração ainda exige conectar carregamento, animações, origem visual dos tiros, colisões e escala em partida. As portas e rotores têm grupos independentes; não há animações de combate prontas embutidas.

Escala: para os tipos atuais, aplicar baseStats.size uma vez. Os futuros bosses já têm geometria maior (Leviatã cerca de 5 unidades de comprimento; Catedral cerca de 5,7 de largura); fatores sugeridos 3,2 e 3,4, sujeitos a playtest. Os GLBs são agrupados por material preservando grupos móveis; os .blend mantêm peças separadas.
