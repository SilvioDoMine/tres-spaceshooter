# Integração dos visuais complementares

Preservar os quatro BOSS_BUILDERS existentes: hive, harpy, bastion e colossus. Este pacote não fornece substitutos para eles. Manter também seus ciclos e animações atuais.

## Coordenadas e marcadores

GLB: frente -Z, vertical +Y. Procurar marcadores por userData.role; nomes podem ganhar sufixos numéricos do Blender. manifest.json contém as posições e direções locais. Converter a posição de cada marcador para coordenadas mundiais após aplicar a escala e a rotação do inimigo.

## Origem dos tiros sem alterar o balanceamento

useEnemyAttacks atualmente cria tiros no centro para todos estes tipos. Ao usar os marcadores, emparelhar UMA boca com CADA direção. Não colocar todos os marcadores em profile.muzzles: o código atual multiplica cada direção por cada muzzle, aumentando indevidamente a quantidade de projéteis.

- Estilhaço: muzzle_front, um tiro mirado.
- Geodo: ring_0..9 para anel inicial e fan_0..4 para leque. Na geração 1, usar cinco bocas radiais alternadas e três frontais; na geração 2, usar terminal_fragment_muzzle. Reorientar emissores conforme o perfil de cada geração e preservar os spawns 1→2→4. Os grupos fracture_quadrant são peças para separação visual, não novas invocações.
- Martelo e Sentinela: alternar dez saídas radiais e cinco frontais, nunca ambas na mesma salva.
- Vespa: sem muzzle; manter holdFire. impact_tip é somente referência visual de colisão.
- Aríete: um tiro em muzzle_front fora da investida. Diferente do kamikaze comum, kamikazeBoss não é excluído de useEnemyAttacks; ele recebe o perfil aim comum no código atual.
- Farol: sem tiros. upgrade_pickup é a posição sugerida para um efeito de melhoria; manter a interação de proximidade existente.
- Órbita: cinco bocas no grupo ring_rotor; alinhar rotação com a mira travada e o incremento de 0,23 rad por salva.
- Tríade: fan_0, fan_1, fan_2 na ordem -0,28, 0, +0,28 rad. Direções vêm do ataque atual; três bocas não significam nove tiros.

Para os anéis de N tiros, a rotação local do rotor em torno de +Y no GLB é -(pi/N + volley*0.23), relativa à mira travada. Compensar a rotação do casco quando ele não estiver voltado para essa mira. Alguns emissores ficam elevados para não atravessar o casco; preservar a colisão XZ e decidir a altura de representação do projétil na integração.

## Animação e desempenho

Fontes Blender preservam partes. GLBs agrupam por material dentro de cada grupo móvel. Congelamento deve pausar portas, rotores e pulsação. Os arquivos não contêm clipes de animação de combate prontos. Variantes elementais podem reutilizar o sistema de tint atual, mantendo a identificação do casco.

Validar no tamanho real: alcance da hitbox, largura da barra de vida, origens de tiro, colisões e contagem de objetos. Nenhuma alteração de dano, vida, EXP, waves, recompensas ou ataque foi aplicada. Os dois bosses futuros exigem implementação e balanceamento próprios; ver BOSSES_FUTUROS.md.
