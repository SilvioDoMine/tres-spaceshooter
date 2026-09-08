# Dilatação espacial

Configuração central: `app/utils/spatialDilation.ts`, constante `DILATION_CONFIG`.

O centro de cada sala é `stage.center` quando definido, ou `(0,0)` no plano XZ usado pelas salas atuais. A zona estável tem no mínimo 24 unidades; aumenta para incluir as dimensões da sala, início do jogador e portal, com margem. Os limiares de alerta e crítico acompanham esse aumento.

O movimento é separado em componentes radial e tangencial. Somente o componente radial positivo recebe a curva `minimum + (1 - minimum) * exp(-((distance - start) / width)^power)`. O input, direção, animação dos motores e regras existentes de tiro são preservados. Retorno e movimento tangencial não recebem penalidade; não há clamp de posição nem parede.

| Estado | Condição padrão |
| --- | --- |
| SAFE | Até 24 unidades, ou o raio ampliado da sala |
| DILATION | Além da região estável |
| WARNING | 1,5 s além de 32 unidades |
| CRITICAL | 3 s insistindo para fora além de 44 unidades |
| STRUCTURAL_DAMAGE | Mais 4 s de insistência crítica, depois pulsos de dano a cada 1 s |

O dano base é 8 por segundo, modulado pela intensidade. Usa `currentRun.takeDamage`, incluindo som, texto, efeito e morte existentes. Retornar ou soltar o movimento interrompe imediatamente o dano e reinicia o tempo de exposição crítica; os tremores e partículas diminuem suavemente. O cooldown de avisos é 12 s, e a mensagem crítica tem prioridade. Ao voltar à região estável, uma mensagem breve confirma a recuperação. Trocar de sala reinicia todo o estado; pausar congela a simulação.

Partículas reutilizam o buffer de efeitos do combate. O tremor apenas desloca a apresentação da nave/câmera, sem alterar colisões, posição real ou projeção dos indicadores. A preferência de movimento reduzido desliga os tremores e reduz as partículas. O alerta é não interativo e não bloqueia toque.

O áudio usa o AudioContext existente e respeita volume geral e volume de efeitos. Dois osciladores suaves produzem a tensão crescente; alertas distintos acompanham aviso, criticidade e dano estrutural. Ao pausar, ocultar a aba ou sair da partida, o som é silenciado; os nós são liberados ao desmontar o HUD. O navegador libera o áudio com o primeiro toque ou tecla.

O cenário reage usando `sceneryStretch`, `sceneryResponseRadius` e `cometResistance`. Meteoros próximos recebem uma deformação elástica de até 13%, incluída na margem de separação. Cometas mantêm pelo menos 84% da velocidade e recuperam o formato ao sair da influência. Estação e destroços respeitam volumes de separação ao se aproximar, e o reposicionamento distante é gradual.

`/spatial-lab` permite testar alerta, região crítica, retorno e troca de sala usando os componentes reais do jogo. Disponível apenas em desenvolvimento; não é uma opção de gameplay.
