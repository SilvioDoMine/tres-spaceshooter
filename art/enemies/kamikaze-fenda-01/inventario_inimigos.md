# Space Shooter — inimigos e primeiro modelo

Foram encontrados 19 tipos em `baseStats`, no arquivo app/composables/useEnemyManager.js.
O EnemyManager atual usa EnemyBoss quando existe `model`; nos demais casos usa EnemyRaider. Os componentes geométricos antigos não são selecionados por esse fluxo.

| Tipo | Modelo atual | Escala size |
|---|---|---|
| miniasteroid | Raider | 0.75 |
| asteroid | Raider | 1.25 |
| asteroidBoss | Raider | 2.25 |
| ufo | Raider | 1 |
| ufofast | Raider | 1 |
| kamikaze | Raider | 1 |
| miniboss | Raider | 3 |
| boss | Raider | 3 |
| hiveBoss | hive / Colmeia | 3 |
| miniHive | hive / Colmeia | 1.4 |
| hiveDrone | Raider | 0.7 |
| miniHarpy | harpy / Harpia | 1.3 |
| harpyBoss | harpy / Harpia | 3.2 |
| bastionBoss | bastion / Bastião | 3 |
| colossusBoss | colossus / Colosso | 4.5 |
| kamikazeBoss | Raider | 2 |
| angel | Raider | 1.2 |
| torusEnemy | Raider | 1 |
| compositeEnemy | Raider | 1.5 |

O Raider varia entre quatro cores e três larguras conforme o ID de cada instância; essas variações não constituem modelos específicos por tipo.

## Primeiro modelo: Kamikaze Fenda-01

- Casco novo com duas mandíbulas de impacto, abertura central, reator âmbar e propulsor único sobredimensionado.
- Blindagem vermelha, estrutura grafite e detalhes em titânio/marfim.
- Arquivo editável: kamikaze_fenda_01.blend. Peças separadas e modificadores de acabamento preservados.
- Exportação: kamikaze_fenda_01.glb, sem câmera, luzes ou cenário de apresentação.
- Eixos: +Y é a frente no Blender; no GLB a frente é -Z e o eixo vertical é +Y, como no jogo.
- Escala autoral: cerca de 1.6 unidades de largura e 2.5 de comprimento. Ajustar a escala na integração conforme a hitbox pretendida.
- Esta entrega é o primeiro modelo para avaliação visual; ainda não substitui o Raider no jogo.
- O inventário descreve os tipos cadastrados, incluindo exemplos; não afirma que todos aparecem nas fases atuais.
