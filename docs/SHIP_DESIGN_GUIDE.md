# Guia visual e modular das naves do jogador

Este é o documento canônico para concept art, modelagem 3D e geração de naves por IA. Toda nave nova deve ser desenhada como uma plataforma modular compatível com os equipamentos existentes.

## Corpos como personagens

O produto trata cada **corpo** de nave como um personagem vendável. O corpo é o núcleo: fuselagem, raízes de encaixe e nada mais. Asas, cockpit, gerador, campo de força, propulsores e arma são módulos acoplados, e é a soma deles que forma a nave completa na tela.

Consequências obrigatórias:

- Um corpo novo não redesenha os equipamentos. Ele respeita o contrato de encaixe e passa a funcionar com todo o catálogo existente e futuro.
- Um equipamento novo não é ajustado corpo a corpo. Ele é modelado uma vez, em espaço local do encaixe.
- Sem esse contrato, cada corpo somado ao catálogo exigiria revisar todas as peças — o custo cresceria por multiplicação, não por soma.

### Contrato de encaixe

As âncoras vivem em `app/utils/shipSockets.js` e são a especificação canônica de posição. Regras:

- Módulos são modelados em espaço **local**, com a origem no próprio encaixe; o lado é obtido espelhando X.
- O corpo entrega a interface: base integrada à armadura, moldura escura, fixadores e conduíte. O módulo entrega apenas a peça funcional.
- Os módulos usam as **instâncias de material do corpo** (`buildKestrelHull().materials`). Material próprio, ainda que de cor idêntica, denuncia a emenda sob a luz da partida.
- As coordenadas de disparo em `weaponMounts` são compartilhadas com o combate e **não variam por módulo**. Toda asa preserva o envelope dos canhões diagonais; a silhueta é livre, a canhoneira não.
- Um corpo deve respeitar `WING_ENVELOPE`: fora dessa faixa, a mesma asa lê desproporcional de um personagem para outro.

## Prioridade sobre referências visuais

Este guia prevalece sobre blueprints, imagens de concept art e modelos de referência. Use essas imagens para silhueta, proporções e acabamento; adapte qualquer detalhe que contradiga os slots, os três estados de arma ou as regras de compatibilidade. Uma arma ou acessório desenhado no blueprint não deve ficar permanentemente no casco se depender de um equipamento ou carta. Registre as adaptações realizadas. Uma instrução explícita do usuário pode revisar o próprio guia.

## Direção visual

### Kestrel-07 — adaptação do blueprint

O Kestrel-07 é o primeiro personagem da plataforma. Seu corpo é construído em `app/utils/kestrelModel.js`: armadura branca facetada, painéis turquesa personalizáveis, canopy escuro e duas naceles com anéis de cobre. Os detalhes estáticos são agrupados por material.

**As asas não pertencem mais ao corpo.** Elas saíram do casco e viraram módulo em `app/utils/wingModels.js`, montado por `ShipWings.vue` na âncora do contrato. O corpo conserva apenas a raiz: superfície de encaixe, moldura e fixadores. A asa varrida original continua sendo a do slot vazio, agora como um modelo entre outros — equipar Falcão ou Nébula **substitui o modelo inteiro**, e não sobrepõe painel sobre a asa anterior, como acontecia antes.

Referência visual aprovada: [blueprint Kestrel-07](kestrel-07-blueprint.png). O objetivo é reproduzir o desenho, incluindo silhueta, perfil inclinado da fuselagem e canopy, contorno das asas, carenagens e detalhes mecânicos. Não substituir esses volumes por blocos genéricos apenas semelhantes. As únicas adaptações deliberadas são as necessárias para compatibilidade com este guia e com os hardpoints do jogo.

O canhão grande desenhado na referência não faz parte permanente do casco: o slot vazio usa o emissor integrado simples; Plasma e Lança Iônica substituem esse emissor. Sensores, reator, emissores de campo, módulos das asas e revestimentos dos propulsores ocupam encaixes próprios. As armas auxiliares e traseiras só aparecem conforme as cartas da partida. Os hardpoints conservam as coordenadas usadas pelo combate, para manter cada saída de projétil alinhada à boca da arma.

Use `/ship-lab` para comparar as vistas e combinações sem alterar o inventário do jogador.

O jogo usa ficção científica militar estilizada em um *space shooter* 3D visto principalmente de cima. A câmera alta tem pouca distorção de perspectiva; por isso, a silhueta e os volumes grandes importam mais que microdetalhes.

- Formas geométricas limpas, superfícies facetadas e complexidade intermediária.
- Mais detalhado que um low poly simples, sem buscar realismo fotográfico.
- Corpo alongado, nariz legível, asas abertas e dois motores traseiros.
- Simetria bilateral como regra; assimetria apenas em sensores, marcas, danos ou acessórios pequenos.
- Painéis grandes, divisões de armadura e núcleos emissivos.
- Peças espessas o suficiente para continuar visíveis durante a partida.
- Mecânica encaixada dentro do volume do casco, sem acessórios simplesmente colados.
- Contraste entre armadura clara, estrutura escura, metais quentes e energia colorida.

### Paleta estrutural

| Função | Aparência |
|---|---|
| Armadura principal | Cinza claro, branco azulado ou pintura escolhida pelo jogador |
| Estrutura interna | Azul muito escuro, quase preto |
| Juntas e áreas mecânicas | Grafite metálico |
| Fixadores e conduítes | Cobre ou bronze |
| Energia padrão | Ciano e azul luminoso |
| Tecnologia quântica, iônica e nébula | Violeta |
| Energia solar e cometa | Âmbar, laranja e dourado |
| Cura e fusão | Verde |
| Ameaças e dano | Vermelho, magenta e laranja |

O cenário é azul quase preto, com estrelas, planetas, meteoros e estruturas orbitais. A iluminação combina uma fonte quente forte com preenchimento azul, produzindo bordas claras e sombras azuladas.

## Legibilidade

A nave deve continuar legível em três contextos:

1. **Hangar:** detalhes, materiais e todos os encaixes são visíveis.
2. **Lobby:** a silhueta e os equipamentos principais são reconhecíveis.
3. **Partida:** nariz, asas, motores, energia e arma especial permanecem claros em tamanho reduzido.

Antenas, canos e lâminas muito finos devem ser ligeiramente exagerados em espessura.

## Arquitetura modular

Toda nave precisa das seis zonas permanentes abaixo:

```text
                         [ ARMA FRONTAL ]
                                │
               [ COCKPIT ] ── [ NARIZ ]
                     ╲           ╱
               [ ASA E ]       [ ASA D ]
                     ╲           ╱
        [ CAMPO E ] ── [ GERADOR ] ── [ CAMPO D ]
                     ╲           ╱
             [ PROPULSOR E ] [ PROPULSOR D ]
                         [ ARMA TRASEIRA ]
```

Mesmo vazio, cada slot deve possuir uma tampa ou superfície de encaixe. O slot de arma é a exceção funcional: quando vazio, sua base sustenta o Canhão Integrado Padrão descrito abaixo. Todo encaixe precisa de:

- base integrada à armadura;
- moldura escura entre casco e peça;
- ao menos dois fixadores visíveis;
- conduíte ou linha de energia;
- espaço para recuo, rotação, abertura ou partículas;
- tampa fechada quando não equipado.

| Slot | Posição | Papel visual | Atributo principal atual |
|---|---|---|---|
| Arma | Nariz e hardpoints auxiliares | Sistema ofensivo e origem física dos tiros | Ataque |
| Asas | Laterais do casco | Manobra e largura da silhueta | Ataque |
| Cockpit | Parte superior dianteira | Sensores, mira e computador | Ataque |
| Gerador | Centro ou dorso traseiro | Fonte de energia | Vida |
| Campo de força | Laterais do núcleo | Emissores defensivos | Vida |
| Propulsores | Traseira | Motores, mobilidade e rastros | Vida |

## Armas

O sistema visual deve distinguir claramente três estados: arma integrada, Canhão de Plasma equipado e Lança Iônica equipada. Eles compartilham o mesmo encaixe estrutural, mas **não podem reutilizar o mesmo modelo de canhão**.

### Canhão Integrado Padrão — slot vazio

É o armamento básico que pertence ao casco da nave e aparece somente quando não existe uma arma equipada. Ele garante que o disparo continue tendo uma origem física sem fingir que o jogador possui um equipamento especial.

- Forma compacta, simples e parcialmente embutida no nariz.
- Um único tubo curto, sem câmara externa volumosa.
- Moldura e materiais iguais aos do casco.
- Núcleo ciano pequeno e pouco intenso.
- Poucos anéis, conduítes ou partes móveis.
- Clarão básico, sem feixe especial nem assinatura iônica.
- Deve parecer produzido junto com a nave, não instalado posteriormente.
- Pode recolher ou receber uma tampa quando a nave não estiver em combate.

O modelo básico estabelece o encaixe universal. Ao equipar outra arma, ele é ocultado ou removido e o módulo equipado ocupa esse mesmo ponto. Não é permitido manter o canhão básico por baixo, dentro ou ao lado da arma equipada.

### Canhão de Plasma

- Usa um modelo próprio, visualmente mais avançado que o Canhão Integrado Padrão.
- Emissor tubular robusto e industrial.
- Câmara ciano e anéis de contenção em cobre.
- Recuo curto e clarão ciano na boca.
- Feixe contínuo nas rajadas especiais.
- Canhão principal no centro inferior do nariz.

### Lança Iônica

A lança possui um modelo próprio e substitui tanto o canhão integrado quanto o Canhão de Plasma; nunca deve ser sobreposta a nenhum deles.

- Haste central de cajado tecnológico.
- Dois trilhos aceleradores, bobinas e anéis metálicos.
- Núcleo e ponta violeta emissiva.
- Forma comprida, precisa e sofisticada.
- Projétil estreito, veloz e perfurante.

### Hardpoints das habilidades da partida

- Tiro frontal começa central e cresce em pares simétricos próximos às raízes das asas.
- Tiros Diagonais nível 1 usa dois canhões pequenos a 45°, um em cada canto da asa.
- Tiros Diagonais nível 2 acrescenta dois emissores laterais a 90°; eles compartilham a mesma base auxiliar ou ficam imediatamente atrás do par diagonal.
- Tiro traseiro usa um emissor sobre a traseira, entre os motores.
- Tiros múltiplos devem nascer de hardpoints físicos.
- Canhões diagonais devem ter aproximadamente metade do volume do principal.

## Melhorias escolhidas durante a partida

As cartas oferecidas ao subir de nível são melhorias temporárias da partida. Elas são diferentes dos equipamentos permanentes do hangar, mas precisam funcionar sobre qualquer combinação de nave e equipamento.

Regra central: **a melhoria temporária adapta o sistema equipado; ela não substitui a identidade do equipamento permanente**. Um Tiro Frontal com Lança Iônica cria emissores iônicos; com Canhão de Plasma, cria canhões de plasma; sem arma equipada, usa versões auxiliares do Canhão Integrado Padrão.

### Melhorias que alteram fisicamente a nave

| Carta | Níveis atuais | Exigência para o modelo |
|---|---|---|
| Tiro Frontal | Nível 1: 2 projéteis; nível 2: 3 | Reservar um hardpoint central e um par simétrico nas raízes das asas. Os canhões adicionais causam 40% do dano. |
| Tiros Diagonais | Nível 1: 2 tiros a 45°; nível 2: acrescenta 2 laterais a 90° | Reservar uma base auxiliar em cada canto de asa capaz de sustentar um emissor diagonal pequeno e um lateral ainda menor. |
| Tiro Traseiro | Nível 1: 1 tiro; nível 2: 2 tiros | Reservar uma base sobre a traseira, entre ou acima dos motores, expansível de um emissor central para um par simétrico. |

Os hardpoints temporários devem parecer extensões do armamento equipado e usar seus materiais, cor de energia e vocabulário de formas. Eles aparecem quando a carta é adquirida e desaparecem ao terminar a partida.

### Melhorias que alteram o disparo sem adicionar canhões

| Carta | Funcionamento atual | Regra visual |
|---|---|---|
| Tiros Múltiplos | Cada arma dispara 2 vezes no nível 1 e 3 vezes no nível 2 | Repete o disparo pelo mesmo canhão. Não duplicar canhões nem criar novos hardpoints. |
| Tiro Ricochete | Salta entre 1 e 5 vezes, perdendo metade do dano por salto | Rastro deve desenhar claramente a mudança de alvo; não altera o canhão. |
| Tiro Perfurante | Atinge até 2, 3, 5 ou 8 inimigos | Projétil mantém direção e atravessa o alvo; usar núcleo ou rastro que comunique penetração. |
| Caça Rastreador | Projéteis perseguem o alvo; a curva usa a velocidade do tiro e nem sempre alcança | Rastro curvo deve mostrar a perseguição e a curva perdida quando o tiro erra. Não altera o canhão nem o alcance da arma. |
| Alcance Estendido | Aumenta progressivamente a distância do projétil | Pode alongar e estabilizar o rastro, sem aumentar fisicamente o canhão. |
| Dano Aumentado | Eleva o dano total até 225% do base | Intensidade, núcleo e espessura podem crescer discretamente; preservar a identidade da arma. |
| Velocidade Aumentada | Nave até +30%; projétil até +40% | Intensificar chama e compressão do rastro durante o movimento, sem trocar propulsores. |
| Cadência | Até +40% de velocidade de ataque | Recuo e flashes ficam mais frequentes; não adicionar bocas de fogo. |
| Mira Precisa | Aumenta chance e dano crítico | Usar confirmação curta de mira ou brilho de impacto; não instalar sensores físicos temporários. |
| Tiro Certeiro | Chance de eliminar imediatamente inimigos que não sejam chefes | Impacto especial inequívoco no alvo; não altera a arma antes do disparo. |
| Tiro de Curta Distância | Alcance cai para 45% do normal; dano +20% e cadência +100%, com o projétil na velocidade normal | Nível único. O círculo de alcance encolhe junto e é a leitura principal da carta; a câmera não se aproxima, porque a altura mínima segura o enquadramento. Rastro curto e denso, boca de fogo mais frequente. Não adicionar canhões nem trocar a arma equipada. |

### Melhorias elementais

| Carta | Funcionamento atual | Assinatura visual |
|---|---|---|
| Tiro de Fogo | Incendeia e causa dano por 3 segundos | Núcleo laranja, chama aderida ao projétil, brasas e queimadura no alvo. |
| Tiro de Gelo | Congela, causa dano ao congelar e ao quebrar | Núcleo branco-ciano, cristais, névoa fria e estilhaços ao descongelar. |
| Tiro de Raio | Causa dano extra e salta para até 2 inimigos | Energia violeta, arco elétrico e conexão visível entre os alvos. |

Os elementos podem ser combinados. A leitura deve permanecer clara:

- fogo + gelo: vapor e fitas quente/fria;
- fogo + raio: eletricidade incandescente;
- gelo + raio: arco ciano-violeta e cristais eletrificados;
- fogo + gelo + raio: tempestade prismática, sem apagar a cor-base da arma.

Efeitos elementais pertencem ao projétil e ao alvo. Eles não substituem o modelo do Canhão Integrado, Canhão de Plasma ou Lança Iônica.

### Melhorias de estado e atributos

Estas cartas não exigem novas peças físicas permanentes. Sua comunicação deve acontecer por HUD, partículas breves, cor de impacto ou resposta da nave.

| Carta | Funcionamento | Representação recomendada |
|---|---|---|
| Vida Aumentada | Aumenta a vida máxima | Pulso curto no casco e atualização da barra de vida. |
| Ouro Bônus | Concede ouro ao completar a fase | Feedback de recompensa; nenhuma alteração na nave. |
| Aprendizado | Aumenta EXP e cresce por sala concluída | Feedback na coleta de EXP ou na HUD. |
| Reparo de Emergência | Cura imediatamente de 25% a 75% da vida máxima | Onda de reparo, faíscas de solda ou placas se recompondo brevemente. |
| Adrenalina | Aumenta dano conforme a vida diminui | Pulsação vermelha discreta e energia mais intensa quando a vida está baixa. |
| Manobra Evasiva | Aumenta a chance de desvio | Rastro curto ou pós-imagem somente durante o desvio. |
| Sifão | Chance de curar 5% da vida ao abater | Fluxo de energia do inimigo destruído até a nave. |
| Núcleo Vital | Cada coração coletado soma vida máxima pelo resto da partida | Feedback na coleta e atualização da barra de vida. Nenhuma peça nova no casco. |
| Fúria Carmesim | Cada coração coletado aumenta o dano por 30s | Elétrons vermelhos girando rentes ao casco, em planos cruzados, com rastro curto que apaga atrás deles. O raio vem do tamanho do modelo, então asas e naves diferentes mantêm os elétrons colados. Nunca um anel, domo ou casca parada em volta da nave: isso leria como campo de força. |
| Posição Firme | Parada, a nave acelera o tiro até 7x em 30s; andar zera a carga e, carregada, ela recebe até o dobro de dano de projétil | Plataforma de ancoragem deitada no **chão**, embaixo da nave: doze placas âmbar que travam uma a uma como medidor da carga, espirais puxando energia para o núcleo e fissuras vermelhas abrindo para fora conforme a exposição cresce. Nenhuma peça nova no casco. A folga entre as placas é larga de propósito: mesmo com a carga cheia o desenho lê como piso travado, e não como anel, domo ou casca em volta da nave — isso leria como campo de força. |
| Rastro de Fogo | Acende um rastro de fogo por onde a nave passa; quem encostar se queima | Reaproveita o rastro do Propulsor Cometa, depositado no chão atrás da nave. Nenhuma peça nova no casco ou no propulsor. |

### Compatibilidade obrigatória entre cartas

- Canhões frontais, diagonais e traseiros podem existir simultaneamente sem se cruzar.
- Tiros Múltiplos repete todos os hardpoints existentes, sem multiplicar a geometria.
- Ricochete, perfuração e elementos podem coexistir no mesmo projétil.
- Os efeitos devem permanecer reconhecíveis com Plasma, Lança Iônica ou Canhão Integrado.
- Nenhuma carta pode colocar canhão sobre cockpit, gerador, campo de força ou chama dos motores.
- A concept art deve mostrar a configuração de ocupação máxima dos hardpoints temporários.

## Asas

As asas podem mudar a silhueta, mas devem preservar a raiz estrutural, o espaço dos canhões diagonais, a leitura dos motores, a área segura do cockpit e a largura compatível com a nave.

### Asas Falcão

- Angulares, agressivas, com pontas voltadas para trás.
- Pequenas aletas verticais e linguagem de interceptador.
- Energia ciano; sinal âmbar quando o bônus está ativo.

### Asas Nébula

- Painéis largos ou segmentados, com áreas violetas.
- Condutores de energia e alojamentos circulares para liberar os orbes.
- Geometria exótica, ainda compatível com a estrutura militar do casco.

## Cockpit

O vidro deve permanecer livre. Sensores ocupam molduras laterais, “sobrancelhas” do cockpit ou a área imediatamente atrás dele.

### Cockpit Mira Tática

- Dois sensores laterais com lentes ciano.
- Trilhos de rastreamento e antenas protegidas.
- Aparência militar e marcação visual nos alvos selecionados.

### Cockpit Quântico

- Sensores violetas, anéis e lentes sobrepostas.
- Elementos duplicados ou espelhados.
- Linhas de energia e eco luminoso quando um tiro é duplicado.

## Gerador

O gerador ocupa um compartimento rebaixado atrás do cockpit e antes dos motores, com blindagem, conduítes e espaço para pulsar ou girar.

### Gerador de Fusão

- Reator compacto com núcleo ciano ou verde.
- Anel de contenção e conduítes simétricos.
- Pulso verde somente durante regeneração real.

### Núcleo Solar

- Esfera âmbar protegida por blindagem pesada segmentada.
- Aparência de pequena estrela aprisionada.
- Aberturas e onda circular laranja durante a explosão solar.

## Campo de força

Use um emissor em cada lado do gerador, próximo ao centro de massa. A barreira surge quando ativada; não precisa ser uma bolha permanente.

### Campo Égide

- Emissores robustos, simétricos e hexagonais.
- Energia azul clara.
- Clarão ou placas hexagonais ao bloquear um golpe.

### Campo Prisma

- Cristais, lentes facetadas e superfícies triangulares.
- Energia violeta e ciano.
- Pulso direcionado ao agressor quando reflete dano.

## Propulsores

Cada motor precisa de carcaça, câmara interna escura, anel externo, núcleo emissivo, espaço para chama e placas de dissipação. O conjunto deve se conectar visualmente ao gerador e às asas.

### Propulsor Cometa

- Bocal aberto, cobre e metal aquecido.
- Centro branco, bordas laranja.
- Rastro contínuo de plasma e poeira quente, com brasas discretas.
- O rastro alarga e desaparece gradualmente.
- O mesmo rastro é aceso pela carta Rastro de Fogo, inclusive sem o propulsor equipado. Com os dois, a largura fica com a maior das fontes e o dano soma.

### Propulsor Vórtice

- Turbinas gêmeas e anéis concêntricos.
- Energia violeta e peças contrarrotativas.
- Distorção circular sutil indicando a área de lentidão.

## Raridades

| Raridade | Cor | Evolução visual recomendada |
|---|---|---|
| Comum | Cinza | Estrutura básica |
| Incomum | Verde | Pequena linha emissiva |
| Raro | Azul | Conduítes e segundo material |
| Épico | Roxo | Núcleo ativo e primeira animação especial |
| Lendário | Laranja | Mais detalhes metálicos e energia |
| Mítico | Vermelho | Peça energizada, halo ou partes móveis |

As raridades não devem criar seis silhuetas desconectadas. A identidade principal da peça permanece reconhecível.

## Famílias tecnológicas

| Família | Vocabulário de formas | Energia |
|---|---|---|
| Plasma, Fusão e Égide | Tubos, círculos e anéis | Ciano |
| Iônica, Quântica, Nébula e Vórtice | Trilhos, cristais e formas alongadas | Violeta |
| Solar, Cometa e Falcão | Aletas, blindagem e dissipadores | Âmbar |

## Regras contra o efeito “Frankenstein”

1. Casco e equipamentos compartilham o mesmo vocabulário de formas.
2. Bases pertencem ao casco; somente o módulo funcional é substituído.
3. Nenhuma peça começa diretamente sobre a superfície sem suporte.
4. Molduras, fixadores e conduítes seguem um padrão comum.
5. Cores fortes ficam concentradas nos núcleos energéticos.
6. Armas, sensores e motores comunicam sua função pela forma.
7. Partes móveis têm espaço físico para se mover.
8. Equipamentos não atravessam cockpit, asas, casco ou motores.
9. A composição permanece equilibrada com seis equipamentos de famílias diferentes.
10. A nave continua coerente quando todos os módulos estão fechados ou vazios.

## Entrega obrigatória da concept art

- Vista superior, inferior, lateral e traseira.
- Perspectiva do hangar.
- Silhueta no tamanho aproximado da partida.
- Nave sem equipamentos e com os seis slots destacados.
- Duas alternativas para cada slot.
- Configurações com canhões frontais, diagonais e traseiro.
- Corte ou detalhe ampliado do cockpit e do gerador.
- Paleta de materiais e diagrama de emissões.
- Estado comum e mítico.

## Checklist de aceitação

- [ ] Os seis slots estão presentes e acessíveis.
- [ ] Cada equipamento tem base, moldura, fixadores e conduíte.
- [ ] Nenhum módulo atravessa outra parte da nave.
- [ ] Os tiros nascem de canhões visíveis.
- [ ] O slot vazio usa o Canhão Integrado Padrão, visualmente distinto do Canhão de Plasma.
- [ ] Equipar Plasma ou Lança Iônica substitui completamente o modelo anterior, sem sobreposição.
- [ ] Há espaço para Tiro Frontal nível 2, Tiros Diagonais nível 2 e Tiro Traseiro nível 2 coexistirem.
- [ ] Tiros Múltiplos usa os mesmos canhões e não cria geometria adicional.
- [ ] Os efeitos de Fogo, Gelo e Raio podem ser combinados sem perder a identidade da arma.
- [ ] A silhueta é legível na câmera superior e no tamanho de partida.
- [ ] As famílias tecnológicas são reconhecíveis sem quebrar a identidade do casco.
- [ ] As versões sem equipamento possuem tampas coerentes.
- [ ] A concept art inclui todas as vistas obrigatórias.

## Adaptação da prancha modular de asas

- A Falcão usa uma carcaça varrida contínua, placas cerâmicas separadas por juntas de grafite, travas metálicas, radiadores e pequenos detalhes âmbar/ciano. Não é um leque de penas independentes.
- A Nébula usa a mesma interface, com extensões bifurcadas, bordas violetas e lentes circulares alojadas nas faces superior e inferior. As lentes ficam orientadas pela normal da asa.
- A asa padrão permanece mais simples. Equipar Falcão ou Nébula substitui a asa inteira, preservando o corpo central.
- As proporções do encaixe e da silhueta da prancha são adaptadas ao envelope do chassi e aos hardpoints fixos. As armas auxiliares ilustradas na prancha não são canhões permanentes da asa: surgem somente quando o equipamento ou a melhoria de partida correspondente está ativo.
- Os modelos usam os materiais compartilhados do casco e geometria agrupada por material. Trocar uma asa descarta sua geometria, mas preserva os materiais compartilhados.

Princípio central: **o casco carrega as interfaces mecânicas; os equipamentos completam essas interfaces**.
