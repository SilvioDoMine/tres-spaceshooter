# Efeitos do jogo

| Evento | Resposta visual |
| --- | --- |
| Disparo do jogador | Núcleo branco/ciano, rastro afilado pulsante e clarão de saída |
| Disparo inimigo | Núcleo quente e rastro laranja para distinguir o perigo |
| Acerto no inimigo | Clarão curto, faíscas e pequena dispersão de fumaça |
| Destruição | Onda expansiva, fragmentos, faíscas e fumaça residual; casco desaparece rapidamente dentro da explosão |
| Dano no jogador | Pulso na nave e bordas avermelhadas, mantendo o centro da tela livre |
| Saúde abaixo de 30% | Fumaça leve acompanhando o deslocamento |
| Coração dropado | Coração 3D vermelho estufado, pequeno, batendo e balançando; halo aditivo pulsante embaixo e faíscas vermelhas/rosadas saindo em volta (congela na pausa) |
| Passagem no cenário | Meteoro com tamanho, proporção, cor, velocidade, giro e trajetória variáveis; intervalo de 9–21 segundos após cada passagem, sem repetir o quadrante de entrada anterior |
| Motores e portal | Mantidos os efeitos animados existentes |

Os efeitos de partículas usam um buffer de 640 posições reutilizadas. A cena de partículas tem uma chamada de desenho e o meteoro usa geometria compartilhada durante sua passagem. Os tiros compartilham geometria e dois materiais. A resolução do canvas continua limitada a 1,5 vezes a resolução CSS. Isso limita o custo, mas não substitui medição em um celular físico.

A rota `/vfx-lab` é uma bancada de desenvolvimento para conferir disparo, impacto, explosão e dano separadamente. Fora do desenvolvimento ela redireciona para o lobby.
