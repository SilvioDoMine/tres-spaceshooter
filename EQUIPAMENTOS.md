# Equipamentos, Mecânico e notificações

Regras da aba **Equipamento** (inspirada no Archero 2), da fusão no **Mecânico** e dos avisos **"!"** do lobby.

Tudo funciona só no lobby por enquanto; os valores finais já ficam prontos para o gameplay usar (ver [Integração com o gameplay](#integração-com-o-gameplay)).

| O quê | Onde |
|---|---|
| Catálogo, raridades, slots e números | `app/data/equipment.ts` |
| Regras puras (stats, fusão, ordenação, setas) | `app/utils/equipment.ts` |
| Estado persistente (inventário, equipar, fundir) | `app/stores/useEquipmentStore.ts` |
| Telas | `app/components/lobby/EquipmentScreen.vue`, `app/components/lobby/equipment/*` |
| Testes | `tests/equipment.test.mjs` (`node --test 'tests/*.test.mjs'`) |

---

## Raridades

Da pior para a melhor. A fusão sobe uma posição.

| Chave | Nome | Multiplicador do atributo base | Peças para fundir |
|---|---|---|---|
| `gray` | Comum | ×1 | 3 |
| `green` | Incomum | ×1.6 | 3 |
| `blue` | Raro | ×2.6 | 3 |
| `purple` | Épico | ×4.2 | 2 |
| `orange` | Lendário | ×6.8 | 2 |
| `red` | Mítico | ×11 | — (máxima) |

## Slots

Esquerda dá **ATQ**, direita dá **HP** (mesmo layout do Archero).

| Lado | Slot | Atributo principal | Base (Comum) |
|---|---|---|---|
| Esquerda | Arma | ATQ | 12 |
| Esquerda | Asas | ATQ | 6 |
| Esquerda | Cockpit | ATQ | 6 |
| Direita | Gerador | HP | 40 |
| Direita | Campo de Força | HP | 70 |
| Direita | Propulsores | HP | 40 |

**Atributo principal do item** = `base do slot × multiplicador da raridade` (arredondado).
Ex.: Arma Rara = 12 × 2.6 = **31 ATQ**.

## Itens

2 itens por slot, cada um com nome, descrição e ícone próprios.

| Slot | Itens |
|---|---|
| Arma | Canhão de Plasma (`canhao-plasma`), Lança Iônica (`lanca-ionica`) |
| Asas | Asas Falcão (`asas-falcao`), Asas Nébula (`asas-nebula`) |
| Cockpit | Cockpit Mira Tática (`cockpit-mira`), Cockpit Quântico (`cockpit-quantico`) |
| Gerador | Gerador de Fusão (`gerador-fusao`), Núcleo Solar (`gerador-solar`) |
| Campo de Força | Campo Égide (`campo-egide`), Campo Prisma (`campo-prisma`) |
| Propulsores | Propulsor Cometa (`propulsor-cometa`), Propulsor Vórtice (`propulsor-vortice`) |

### Habilidades por raridade

Cada item libera uma habilidade nova ao chegar em cada raridade. As bloqueadas aparecem acinzentadas no modal ("Libera em …").

| Raridade | O que libera | Soma nos atributos? |
|---|---|---|
| Incomum | Atributo secundário (ex.: Taxa Crít. +3%) | Sim |
| Raro | Outro atributo secundário (ex.: VEL ATQ +5%) | Sim |
| Épico | Efeito principal do item (ex.: rajada de plasma) | Não — só texto + `effectId` |
| Lendário | +% de ATQ (itens de ATQ) ou +% de HP Máx. (itens de HP) | Sim |
| Mítico | Versão reforçada do efeito principal | Não — só texto + `effectId` |

## Atributos do jogador

Somam **base + talentos + equipamentos equipados**:

```
ATQ fixo dos equipamentos = soma dos atributos de ATQ × (1 + "Atributos base dos equipamentos" %)
ATQ Total = (ATQ base + ATQ fixo dos talentos + ATQ fixo dos equipamentos) × (1 + bônus de ATQ %)
```

HP segue a mesma fórmula. O bônus "Atributos base dos equipamentos" vem do talento **Refinamento**.
Base atual do jogador: **50 ATQ** e **250 HP** (`PlayerBaseStats`).

O botão **(i)** mostra todos os atributos: ATQ/HP total, base, dos equipamentos, dos talentos, bônus %, Taxa/Dano Crít., VEL ATQ, VEL MOV, Desvio, Redução de dano de colisão, Cura dos corações e Atributos base dos equipamentos.

Ao equipar/desequipar (ou fundir) e o ATQ/HP mudar, o número anima até o novo valor:
- **Subiu:** verde, ▲, "+N" flutuando, som `statUp`.
- **Desceu:** vermelho, ▼, tremida, "−N", som `statDown`.

## Inventário

- Os slots ao redor da nave mostram o que está equipado; a grade embaixo mostra **só os itens não equipados**.
- Ordenação (fica salva): **Por Qualidade** (raridade ↓, depois slot) ou **Por Tipo** (slot, depois raridade ↓).
- Equipar num slot ocupado **troca** os itens (o modal mostra a comparação antes → depois).

### Seta verde de melhoria

Aparece **no item da grade** (não no slot) quando:

- o atributo principal dele é **maior** que o do item equipado no mesmo slot; ou
- o slot dele está **vazio**.

Item com atributo **igual** ao equipado não ganha seta.

## Fusão no Mecânico

1. Toque num item para ser a **peça principal**.
2. Complete com **materiais**: o **mesmo item** (mesmo id) na **mesma raridade**.
3. Toque em **Fundir**.

| Regra | Detalhe |
|---|---|
| Peças necessárias | Comum/Incomum/Raro: **3** (principal + 2). Épico/Lendário: **2** (principal + 1). Mítico: não funde. |
| Resultado | A principal sobe **1 raridade**; os materiais são consumidos. |
| Item equipado | Pode ser a **principal** (continua equipado após fundir). **Nunca** pode ser material. |
| Filtro | "Filtrar" mostra só um slot (é filtro, não ordenação). |
| Ordem do armazém | Itens que podem ser fundidos ficam **no topo**, com **"!"**. |
| Itens equipados | Aparecem com o selo **"E"**. |

Um grupo (mesmo item + raridade) é fundível quando:
- **sem** item equipado no grupo: há pelo menos N peças;
- **com** item equipado no grupo: há pelo menos N − 1 peças livres (a equipada vira a principal).

## Como o jogador ganha equipamentos

| Fonte | O quê |
|---|---|
| Início do jogo | Só o **Canhão de Plasma Comum**, já equipado. |
| Missões diárias | Marco de **100 pontos**: 1 item **Comum** aleatório. |
| Fim de partida | Toda partida terminada (**vitória ou derrota**): 1 item **Comum** aleatório (aparece no modal de fim de jogo). |

Configurável em `app/data/equipment.ts`: `MILESTONE_EQUIPMENT` e `MATCH_END_EQUIPMENT_RARITY`.

---

## Notificações "!"

### Abas do lobby (barra de baixo)

| Aba | Mostra "!" quando | Some quando |
|---|---|---|
| **Equipamento** | Existe item guardado que melhora o slot dele (inclui slot vazio), **ou** existe algo para fundir no Mecânico. | O item é equipado / a fusão é feita. |
| **Talentos** | O sorteio está liberado: ainda há talentos, o **nível** permite e há **ouro** suficiente. | Falta ouro, falta nível ou todos os talentos estão completos. |

Calculado em `app/pages/index.vue` (`tabBadges`) e exibido pela `app/components/lobby/TabBar.vue`.

### Dentro da aba Equipamento

| Onde | Mostra quando |
|---|---|
| Botão **Mecânico** | Há algo para fundir. |
| Item da grade (seta verde) | O item melhora o slot dele. |
| Item no armazém do Mecânico ("!") | O item faz parte de um grupo fundível. |

---

## Comandos de debug (console)

Disponíveis em qualquer página, sem abrir a aba (`app/plugins/equipmentDebug.client.ts`).

```js
giveItem()                              // 1 item aleatório, raridade aleatória (abre o modal "Item obtido!")
giveItem(5)                             // 5 itens aleatórios
giveItem('purple')                      // item aleatório Épico
giveItem('purple', 3)                   // 3 itens aleatórios Épicos
giveItem('canhao-plasma', 'gray', 3)    // 3 Canhões de Plasma Comuns (bom para testar fusão)
grantEquipment('lanca-ionica', 'blue')  // mesmo que giveItem, mas sem modal
resetEquipment()                        // volta ao kit inicial
```

Argumentos do `giveItem` em qualquer ordem. Sem raridade, o sorteio usa: Comum 40%, Incomum 25%, Raro 17%, Épico 10%, Lendário 6%, Mítico 2%.

> Os comandos também existem no build de produção (como o `resetTalents`).

## Persistência

| Chave do `localStorage` | Conteúdo |
|---|---|
| `equipmentInventory` | `{ version, nextUid, items: [{ uid, defId, rarity }], equipped: { slot: uid \| null } }` |
| `equipmentSort` | `quality` ou `type` |

Dados inválidos são limpos ao carregar (itens desconhecidos, uids repetidos, item equipado no slot errado).

## Integração com o gameplay

Ainda **não** ligado na partida. Pontos prontos para usar:

- `useEquipmentStore().stats` — atributos finais (base + talentos + equipamentos): `damage`, `maxHealth`, `moveSpeed`, `shotCooldown`, `bonuses` (crit, desvio, etc.).
- `useEquipmentStore().gearBonuses` — só os equipamentos, no mesmo formato dos talentos.
- Habilidades de efeito (Épico/Mítico) têm um `effectId` (ex.: `plasma-burst`, `aegis-shield`) para o jogo implementar.

## Fora do escopo (por enquanto)

Pergaminhos e nível de item, abas Personagens e Runas, Fusão Avançada, drops durante a partida, efeitos de habilidade no gameplay e itens "S".

## Loja

A aba **Loja** (primeira do rodapé) vende e sorteia equipamentos. Configuração em `app/data/shop.ts`, regras puras em `app/utils/shop.ts` e estado em `useShopStore` (`localStorage` `shopState`).

- **Loja Diária**: 3 itens Comuns por 35 gemas, 1 compra cada (preço, moeda e estoque por posição em `DAILY_SHOP_SLOTS`). Renova às 04:00 (GMT-3); a seleção é determinística pela semente do jogador + dia.
- **Baús**: Prata (66,67% Comum / 33,33% Incomum, 80 gemas) e Obsidiana (96% Raro / 4% Épico, 300 gemas). Garantido: a cada 10 aberturas sem a raridade alta, a próxima é forçada; o contador zera quando ela sai. Grátis: Prata 24h e Obsidiana 72h após resgatar, liberados só depois da 1ª partida terminada (`CHEST_FREE_UNLOCK_MATCHES`, contado em `useStatisticsStore` / `localStorage` `playerStatistics`). Chaves abrem até 10 por vez.
- **Gemas**: pacotes em R$ via PIX (provider simulado em `usePix.ts`); bônus só na 1ª compra de cada pacote, ou sempre com `GEM_PROMO_BONUS_ACTIVE`.
- **Ouro**: 2.000 grátis (2 por dia), 20.000 por 200 gemas e 200.000 por 2.000 gemas.
- Animação de abertura em `/chest-lab` (só em dev).

Comandos de debug: `giveKeys('silver', 22)`, `giveGems(1000)`, `giveGold(50000)`, `resetFreeChests()`, `forceShopReset()`, `simulatePixPayment()`, `resetShop()`.
