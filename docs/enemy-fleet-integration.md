# Frota integrada

Os 17 GLBs das frotas 02 e 03 são servidos por public/models/enemies. Os .blend e os renders permanecem em art/enemies. Para atualizar uma exportação, execute `node scripts/sync-enemy-fleet.mjs`: o script copia os GLBs e gera app/data/enemyFleetCatalog.js a partir dos manifests, verificando os marcadores presentes no arquivo.

EnemyManager prioriza EnemyFleet para os 15 tipos antigos e os dois bosses novos. Colmeia, Harpia, Bastião e Colosso mantêm EnemyBoss e seus builders originais. O lobby mostra Sentinela, Harpia, Colosso, Leviatã e Catedral. Os modelos são carregados uma vez e clonados por instância; geometrias ficam no cache e materiais são isolados para tint, dano e descarte.

## Armas e animação

- Frente -Z e vertical +Y. A escala é aplicada uma vez; o Geodo diminui nas gerações de fragmentos. Leviatã e Catedral usam visualScale 1,5, pois seus arquivos já são maiores, separando escala visual do raio de combate.
- Os disparos nascem nos marcadores de canhão, com altura real, rumo do casco e rotação do anel. Cada boca gera um projétil, sem multiplicar o leque pela quantidade de canhões. Mini-Colmeia e Mini-Harpia mantêm a convergência dos dois canhões.
- Anéis preservam o incremento angular da salva. Leques seguem o eixo físico das bocas. Na geração 1 do Geodo são usados cinco canhões radiais alternados e os três frontais centrais; na geração 2, o canhão central real.
- Motores/núcleos luminosos acompanham carga; portas abrem com o lançamento; flashes marcam as bocas. Mini-Harpia mantém o aviso da investida. Pausa e congelamento interrompem animação.
- Projéteis comuns descem suavemente da altura do canhão ao plano de combate; colisões continuam em XZ como no restante do jogo.

## Bosses novos

Leviatã alterna laser axial, três mísseis paralelos e doze tiros das baterias laterais. Catedral alterna anéis de doze orbes e quatro lasers em cruz; abaixo de 70% de vida começa a lançar drones pelas seis baias, no máximo seis vivos. Os lasers têm 1,4/1,6 segundo de aviso, travam a mira antes do disparo e duram 0,8 segundo. Respeitam a invulnerabilidade global do jogador e são cancelados quando o dono morre, congela ou fica atordoado. Não há laser persistente atravessando a troca de sala.

## Validação

`node --test tests/*.test.mjs` cobre os GLBs reais, transformações de canhões em várias escalas e rumos, contagens de rajadas/fases, fragmentos, lasers, desbloqueio, EXP e o diretor de todas as salas dos capítulos 4 e 5. `npm run build` valida a aplicação. Os capítulos são um esboço jogável: dificuldade final e desempenho em celulares precisam de playtest com equipamentos reais.

Os LEIA-ME de art/enemies documentam a entrega original da arte, anterior à integração. Este documento descreve o comportamento atual em jogo.
