# Sistema de Skills - Critérios de Aceite (Estilo Archero)

## Resumo Executivo

Sistema de progressão onde o jogador escolhe skills a cada level up durante a partida, criando builds únicas através de combinações de habilidades que modificam stats e comportamentos de combate.

---

## 1. Level Up e Seleção de Skills

### Critério 1.1: Trigger de Level Up
- [ ] Quando o jogador acumula XP suficiente, sobe de nível
- [ ] O jogo **pausa automaticamente** ao subir de nível
- [ ] Nenhuma ação pode ser realizada até escolher uma skill
- [ ] Interface de seleção aparece **imediatamente** após level up

### Critério 1.2: Apresentação de Opções
- [ ] Sistema oferece exatamente **3 skills aleatórias** para escolha
- [ ] Cada skill mostra:
  - Nome da habilidade
  - Ícone visual
  - Descrição clara do efeito
  - Nível atual → Próximo nível (se já possuir)
  - Indicador "Novo!" se for primeira vez
- [ ] Skills já no nível máximo **não aparecem** nas opções

### Critério 1.3: Escolha da Skill
- [ ] Jogador clica em **1 das 3 skills** apresentadas
- [ ] Skill é aplicada **imediatamente**
- [ ] Jogo **despausa automaticamente** após escolha
- [ ] Efeito da skill é **visível no próximo tiro/ação**

### Critério 1.4: Sistema de Raridade (Opcional)
- [ ] Skills têm raridade: Common, Rare, Epic, Legendary
- [ ] Skills raras aparecem com **menor frequência**
- [ ] Indicação visual diferente por raridade (cores/bordas)

---

## 2. Tipos de Skills

### 2.1: Skills de Stat (Modificadores Passivos)

#### Critério 2.1.1: Dano Aumentado
- [ ] Aumenta dano base dos projéteis por **porcentagem**
- [ ] Níveis progressivos: +40% → +60% → +80% → +120% → +200%
- [ ] Efeito é **multiplicativo** com outras skills de dano

#### Critério 2.1.2: Vida Aumentada
- [ ] Aumenta vida máxima por **porcentagem**
- [ ] Vida atual aumenta proporcionalmente ao pegar skill
- [ ] Níveis progressivos: +40% → +50% → +60% → +70% → +80%

#### Critério 2.1.3: Velocidade Aumentada
- [ ] Aumenta velocidade de **movimento** e **ataque** (fire rate)
- [ ] Cooldown de tiro reduz proporcionalmente
- [ ] Níveis progressivos: +15% → +30% → +45% → +60% → +90%

#### Critério 2.1.4: Regeneração de Vida
- [ ] Regenera X% da vida máxima **por segundo**
- [ ] Funciona durante combate
- [ ] Não ultrapassa vida máxima
- [ ] Níveis: 1%/s → 2%/s → 3%/s → 4%/s → 5%/s

#### Critério 2.1.5: Alcance Estendido
- [ ] Aumenta distância que projéteis viajam
- [ ] Aumenta range de detecção de inimigos
- [ ] Níveis: +50% → +100% → +150% → +200% → +300%

---

### 2.2: Skills de Comportamento (Modificam Padrão de Tiro)

#### Critério 2.2.1: Tiros Múltiplos (Multishot)
- [ ] Dispara 2-3 projéteis simultaneamente com pequeno spread angular
- [ ] Projéteis adicionais causam **60% do dano base**
- [ ] Nível 1: 2 tiros | Nível 2: 3 tiros
- [ ] **Interação**: Funciona com todas outras skills de padrão

#### Critério 2.2.2: Tiros Diagonais
- [ ] Adiciona projéteis em ângulos de 45° (diagonais)
- [ ] Projéteis diagonais causam **50% do dano base**
- [ ] Nível 1: 2 diagonais (±45°) | Nível 2: 4 diagonais (±45°, ±135°)
- [ ] **Interação**: Se tiver multishot, cada tiro frontal também gera diagonais

#### Critério 2.2.3: Tiro Traseiro
- [ ] Adiciona 1 projétil na direção **oposta** ao tiro principal
- [ ] Projétil traseiro causa **90% do dano base**
- [ ] Apenas 1 nível disponível
- [ ] **Interação**: Se tiver multishot/diagonal, versões traseiras também são criadas

#### Critério 2.2.4: Tiro Perfurante (Piercing)
- [ ] Projéteis **atravessam inimigos** sem desaparecer
- [ ] Níveis: 1 perfuração → 3 → 9 → Infinito (999)
- [ ] Causa dano em **cada inimigo** atingido
- [ ] **Interação**: Funciona com qualquer padrão de tiro (multishot, diagonal, etc.)

#### Critério 2.2.5: Tiro Ricochete
- [ ] Projéteis **ricocheteiam em paredes/bordas**
- [ ] Cada ricochete reduz dano para **70% do anterior**
- [ ] Níveis: 1 ricochete → 2 → 3 → 4 → 5
- [ ] **Interação**: Todos os projéteis podem ricochetear

#### Critério 2.2.6: Tiro de Curta Distância (Short Range)
- [ ] **Reduz alcance para 20%** do original
- [ ] **Aumenta dano em 300%** (4x)
- [ ] **Aumenta fire rate em 200%** (3x)
- [ ] Build "corpo a corpo" - alto risco, alta recompensa
- [ ] Apenas 1 nível (legendary)

---

## 3. Sistema de Interações entre Skills

### Critério 3.1: Empilhamento de Modificadores
- [ ] Skills de stat são **multiplicativas** entre si
  - Exemplo: +40% dano + +60% dano = 1.4 × 1.6 = 2.24x (124% total)
- [ ] Skills de comportamento se **empilham sequencialmente**
  - Exemplo: Multishot (2) + Diagonal (4) = 2 tiros frontais + 8 diagonais = 10 projéteis

### Critério 3.2: Ordem de Aplicação
- [ ] Modificadores de **stat aplicam primeiro** (damage, speed, range)
- [ ] Modificadores de **padrão aplicam depois**, em sequência:
  1. Multishot (duplica tiro base)
  2. Diagonal (adiciona diagonais para cada tiro existente)
  3. Back Shot (adiciona versão traseira de cada tiro existente)
  4. Piercing/Ricochet (modificam propriedades de todos)

### Critério 3.3: Exemplos de Interações Esperadas

#### Multishot + Diagonal
```
Tiro base: 1
→ Multishot (2): 2 projéteis frontais
→ Diagonal (4): Para CADA frontal, adiciona 4 diagonais
= 2 frontais + 8 diagonais = 10 projéteis total
```

#### Diagonal + Back Shot
```
Tiro base: 1
→ Diagonal (2): 1 frontal + 2 diagonais = 3 projéteis
→ Back Shot: Para CADA um, adiciona versão traseira
= 6 projéteis (3 front + 3 back)
```

#### Multishot + Piercing
```
Tiro base: 1
→ Multishot (3): 3 projéteis
→ Piercing (999): Cada um dos 3 pode perfurar infinitamente
```

---

## 4. Progressão e Balanceamento

### Critério 4.1: Níveis de Skills
- [ ] Cada skill tem 1-5 níveis possíveis
- [ ] Skill pode aparecer novamente até atingir nível máximo
- [ ] Ao pegar skill novamente, incrementa nível (ex: Nível 1 → 2)
- [ ] Valores aumentam progressivamente por nível

### Critério 4.2: Sistema de Raridade e Peso
- [ ] **Common** (peso 5): Skills básicas de stat
- [ ] **Rare** (peso 3): Skills de padrão simples (diagonal, piercing)
- [ ] **Epic** (peso 2): Skills de padrão avançado (multishot, range)
- [ ] **Legendary** (peso 1): Skills game-changing (short range)

### Critério 4.3: Pool de Skills
- [ ] Mínimo de **10 skills diferentes** disponíveis
- [ ] Mix balanceado entre stat e comportamento
- [ ] Skills raras aparecem menos frequentemente

---

## 5. Interface e Feedback Visual

### Critério 5.1: Modal de Seleção
- [ ] Fundo escuro semi-transparente (pausa visual)
- [ ] Título claro "LEVEL UP!"
- [ ] 3 cards lado a lado com skills
- [ ] Hover effect em cada card
- [ ] Click seleciona e fecha modal automaticamente

### Critério 5.2: Feedback de Skill Ativa
- [ ] Efeito **imediatamente visível** após escolha
- [ ] Multishot: Projéteis aparecem com spread
- [ ] Diagonal: Projéteis saem em ângulos
- [ ] Piercing: Projéteis não desaparecem ao acertar
- [ ] Damage: Números de dano aumentam

### Critério 5.3: Persistência Visual (Opcional)
- [ ] HUD mostra skills ativas (ícones pequenos)
- [ ] Contador de nível de cada skill
- [ ] Efeitos visuais especiais (partículas, cores)

---

## 6. Lógica de Jogo

### Critério 6.1: Durante Partida
- [ ] Skills são **temporárias** - resetam ao fim da partida
- [ ] Não há limite de skills totais
- [ ] Builds podem ter 10-15 skills em late game
- [ ] Skills se acumulam conforme jogo progride

### Critério 6.2: Reset de Partida
- [ ] Ao morrer/vencer, **todas skills são resetadas**
- [ ] Próxima partida começa do zero
- [ ] Progressão entre partidas é **separada** (gold, upgrades permanentes)

### Critério 6.3: Pause/Resume
- [ ] Jogo **não pode ser pausado manualmente** durante seleção de skill
- [ ] Após escolha, jogo retoma **exatamente do ponto anterior**
- [ ] Inimigos/projéteis não se movem durante seleção

---

## 7. Implementação Técnica (Requisitos)

### Critério 7.1: Modularidade
- [ ] Adicionar nova skill **não requer modificar** código de outras skills
- [ ] Skills são **independentes** umas das outras
- [ ] Sistema central apenas **orquestra** aplicação

### Critério 7.2: Performance
- [ ] Cálculo de modificadores é **cached** (computed)
- [ ] Aplicação de skills não impacta framerate (60 FPS)
- [ ] Máximo de 50 projéteis simultâneos na tela

### Critério 7.3: Extensibilidade
- [ ] Sistema suporta **novos tipos de skills** sem refactor
- [ ] Fácil balancear valores (mudança de configuração)
- [ ] Debug facilitado (logs claros de skills aplicadas)

---

## 8. Casos de Uso Principais

### Caso de Uso 8.1: Primeira Skill da Partida
```
DADO que o jogador está em uma partida nova
QUANDO mata inimigos suficientes para level 2
ENTÃO o jogo pausa e oferece 3 skills novas
E todas as 3 mostram "Novo!"
E ao escolher, o efeito é aplicado imediatamente
```

### Caso de Uso 8.2: Upgrade de Skill Existente
```
DADO que o jogador já possui "Dano +40%" (nível 1)
QUANDO sobe de nível novamente
ENTÃO "Dano Aumentado" pode aparecer nas 3 opções
E mostra "Nível 1 → 2"
E ao escolher, dano passa para +60%
```

### Caso de Uso 8.3: Skill no Nível Máximo
```
DADO que o jogador possui "Tiro Traseiro" (nível 1/1)
QUANDO sobe de nível novamente
ENTÃO "Tiro Traseiro" NÃO aparece nas opções
E apenas skills disponíveis são oferecidas
```

### Caso de Uso 8.4: Build Complexa
```
DADO que o jogador possui:
  - Multishot (nível 2 - 3 tiros)
  - Diagonal (nível 2 - 4 diagonais)
  - Piercing (nível 3 - 9 perfurações)
  - Dano +120%
QUANDO atira
ENTÃO cria 3 tiros frontais
E cada frontal gera 4 diagonais = 12 diagonais
= 15 projéteis total
E cada projétil perfura 9 inimigos
E cada projétil causa 2.2x dano base
```

---

## 9. Checklist de Entrega Final

### Funcionalidades Core
- [ ] Sistema de level up pausa o jogo
- [ ] Modal apresenta 3 skills aleatórias
- [ ] Escolha aplica skill e despausa
- [ ] Skills de stat modificam damage/health/speed/range/regen
- [ ] Skills de comportamento modificam padrão de tiro
- [ ] Multishot, Diagonal, Back Shot, Piercing implementados
- [ ] Interações funcionam (multishot + diagonal = multiplicação)

### Sistema Completo
- [ ] Mínimo 8 skills diferentes funcionais
- [ ] Sistema de raridade implementado
- [ ] Skills no máximo não aparecem
- [ ] Reset ao fim da partida
- [ ] Performance mantém 60 FPS com 15+ skills ativas

### Qualidade de Código
- [ ] Código modular (fácil adicionar skills)
- [ ] Sem dependências entre skills
- [ ] Configurações centralizadas (fácil balancear)
- [ ] Comentários em pontos críticos

### Polish (Opcional)
- [ ] Animações no modal
- [ ] Efeitos sonoros
- [ ] Feedback visual de skills ativas
- [ ] Tooltips detalhados

---

## 10. Métricas de Sucesso

- **Variedade**: Jogador consegue criar 10+ builds diferentes viáveis
- **Balance**: Nenhuma skill é "obrigatória" ou "inútil"
- **Clareza**: Jogador entende efeito de skill sem ler documentação
- **Performance**: Jogo mantém 60 FPS mesmo com 20 skills ativas
- **Fun**: Jogador sente progressão clara a cada level up

---

## Priorização (MVP)

### Must Have (P0)
1. Sistema de level up com pausa
2. Modal de seleção de 3 skills
3. 5 skills básicas: Damage, Health, Speed, Multishot, Piercing
4. Interações básicas funcionando
5. Reset ao fim da partida

### Should Have (P1)
6. Sistema de raridade
7. 10+ skills totais
8. Regeneração de vida
9. Skills de padrão avançadas (diagonal, back)
10. Visual polish no modal

### Nice to Have (P2)
11. HUD de skills ativas
12. Animações especiais
13. Efeitos de partículas por skill
14. Sistema de synergies (combos especiais)
15. Achievements por builds específicas

---

## Exemplo de Fluxo Completo

```
Partida começa
↓
Player mata inimigos (ganha XP)
↓
XP >= 100 → Level 2
↓
Jogo PAUSA
↓
Modal aparece com 3 skills:
  [Dano +40%] [Multishot] [Vida +40%]
↓
Player escolhe "Multishot"
↓
Modal fecha, jogo DESPAUSA
↓
Próximo tiro: 2 projéteis saem
↓
Player continua matando (XP++)
↓
XP >= 180 → Level 3
↓
Jogo PAUSA novamente
↓
Modal aparece:
  [Diagonal] [Multishot Nv2] [Dano +40%]
↓
Player escolhe "Diagonal"
↓
Próximo tiro: 2 frontais + 8 diagonais = 10 projéteis!
↓
Game over
↓
Skills resetam (próxima partida recomeça do zero)
```

---

## Definição de Pronto (DoD)

Uma skill está "pronta" quando:

1. ✅ Aparece no pool de seleção aleatória
2. ✅ Mostra nome, ícone, descrição correta
3. ✅ Efeito é aplicado imediatamente ao escolher
4. ✅ Efeito é visível/perceptível no gameplay
5. ✅ Funciona com todas outras skills existentes (sem bugs)
6. ✅ Reseta corretamente ao fim da partida
7. ✅ Código está documentado
8. ✅ Valores estão balanceados (playtesting)

---

## Conclusão

Sistema de skills estilo Archero é centrado em:
- **Escolhas significativas** a cada level up
- **Builds emergentes** através de combinações
- **Feedback imediato** do poder adquirido
- **Rejogabilidade** através de RNG e variedade

O core loop é: `Matar → Level Up → Escolher Skill → Ficar Mais Forte → Matar Mais`
