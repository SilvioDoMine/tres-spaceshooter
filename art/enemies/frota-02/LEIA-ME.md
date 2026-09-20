# Frota 02 — cinco novas naves orientadas pelos ataques

Criadas no Blender através do Remote Desktop Commander. Os cinco desenhos são novos; a Fenda é uma revisão adicional da nave anterior, destinada ao UFO comum.

| Arquivo / inimigo | Nave | Ataque verificado | Solução visual |
|---|---|---|---|
| ufofast_tridente | Tridente | Leque de 3 tiros, espaçamento angular 0,28 rad; mísseis a cada terceira salva | Casco crescente azul, três bocas divergentes, alimentadores de munição |
| asteroid_nodulo | Nódulo | 5 orbes em anel, orientação muda 0,23 rad por salva; morte cria 2 miniasteroids | Dois módulos destacáveis verdes e distribuidor radial com 5 saídas |
| miniHive_berco | Berço | Dois tiros convergentes; para, lança 2 drones e suspende os tiros durante o lançamento | Porta-drones retangular dourado com dois canhões e duas portas independentes |
| miniHarpy_tesoura | Tesoura | Tiro central ao planar; 4 salvas duplas pelas asas; alterna com investida | Caça magenta de asas em tesoura, canhão central e dois canhões nas asas |
| kamikaze_agulha | Agulha | Investida e colisão; explicitamente excluído de useEnemyAttacks | Dardo laranja sem armas, ponta de impacto e grande motor |
| ufo_fenda | Fenda revisada | Um tiro de plasma frontal mirado | Nave anterior com canhão central explícito; o original foi preservado |

## Entrega

Cada nave tem .blend editável, .glb com materiais e pontos de montagem nomeados, imagem em perspectiva e vista superior. `frota_completa.blend` mostra os seis modelos lado a lado. `manifest.json` contém posições dos pontos, orientação e contagens de triângulos.

Os modelos estão preparados para integração, mas esta entrega não altera o gameplay nem conecta os arquivos ao EnemyManager. O ajuste final de hitbox, efeitos e desempenho deve ser verificado em partida após a integração.

## Evidências no projeto

- app/utils/combatPatterns.js: attackProfile, miniHiveProfile, miniHarpyProfile, HIVE_MUZZLES, HARPY_WING_GUNS e attackDirections.
- app/composables/useEnemyAttacks.js: tiros comuns partem do centro; kamikaze é excluído; ataques com muzzles usam suas coordenadas.
- app/utils/bossBehaviors.js: ciclos miniHive e miniHarpy, dois lançamentos e quatro salvas; HANGAR_RADIUS e HANGAR_LAUNCH_ORDER.
- app/composables/useEnemyManager.js: asteroid se divide em dois miniasteroids.
- app/games/levels/LevelOneConfig.js e LevelThreeConfig.js: os tipos escolhidos aparecem em encontros implementados.

## Validação e desempenho

As bocas de tiro foram verificadas por traçado de raio no Blender para detectar obstáculos imediatos à frente. Também foram conferidos os marcadores, o número de armas e a estrutura GLB. Os GLBs unem geometria por material e por grupo móvel: as fontes .blend continuam com peças separadas para edição. `validation.json` registra os resultados. Essa checagem de asset não substitui o teste em partida.

Novas naves: 3.192 a 9.740 triângulos por modelo. A Fenda revisada tem 12.792. Contagens de malhas: Tridente 7, Nódulo 18 (grupos separáveis e rotor), Berço 10 (portas independentes), Tesoura 7, Agulha 5, Fenda 11.
