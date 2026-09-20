# Integração — coordenadas e comportamento

## Convenções

GLB: frente -Z, vertical +Y, direita +X. Origem do root (0,0,0). Aplicar `baseStats[type].size` uma única vez no grupo da nave. Para efeitos, procurar marcadores cujo `userData.role` corresponda ao papel (export_extras está habilitado); o Blender pode acrescentar sufixos ao nome de objetos repetidos.

Os pontos `muzzle_*`, `engine_*`, `drone_launch_*`, `fragment_spawn_*`, `impact_tip` e `dash_axis` são objetos vazios, não geometria. A direção local +Y de cada marcador no Blender é a direção do disparo; o manifest fornece a direção no referencial do GLB.

## Mapeamento por tipo

- **ufo / Fenda:** usar `muzzle_front`, posição GLB (0,0,-1.22). Hoje o tiro nasce no centro. Na integração, obter a posição mundial desse marcador; manter direção, dano, intervalo e velocidade atuais.
- **ufofast / Tridente:** `muzzle_fan_0..2` correspondem às direções -0.28, 0, +0.28 rad de `attackDirections`. Usar exatamente uma boca por direção, tanto para plasma quanto para mísseis. NÃO adicionar 3 muzzles ao perfil atual: o laço cartesiano produziria 9 tiros e alteraria o balanceamento.
- **asteroid / Nódulo:** `muzzle_radial_0..4` ficam em `radial_emitter`, que gira sobre +Y no GLB. Antes da salva v, orientar o rotor local em -(pi/5 + v*0.23) relativamente à mira travada, compensando a rotação do casco se necessário. Cada boca corresponde a uma direção; NÃO multiplicar as 5 direções por 5 muzzles. Altura das bocas = 0.15 no modelo; decidir se o projétil usa essa altura visual ou desce para y=0 na camada visual, preservando a colisão XZ existente.
- **miniHive / Berço:** `muzzle_hive_left/right` em (+/-0.32,0,-1.14), correspondendo a HIVE_MUZZLES. Convergência continua calculada a partir de cada origem. `drone_launch_left/right` em (+/-0.6581793,0,-0.38), equivalentes aos dois primeiros pontos de HANGAR_LAUNCH_ORDER no raio 0.76.
- **miniHarpy / Tesoura:** `muzzle_wing_left/right` em (+/-1.12,0,-0.41), correspondendo a HARPY_WING_GUNS; manter a convergência. O modo planando usa `muzzle_glide` em (0,0,-1.04); hoje esse tiro ainda nasce no centro. Durante a investida não disparar.
- **kamikaze / Agulha:** não possui muzzles. `impact_tip` e `dash_axis` são guias visuais. Preservar o bloqueio de tiros, a carga e a colisão atuais.

## Peças móveis

- Berço: `hangar_door_left` e `hangar_door_right` podem deslizar lateralmente quando `enemy.hangarOpen` for verdadeiro; uma abertura sugerida é 0.22 unidades por lado. Pivôs no root e geometria em coordenadas do modelo.
- Nódulo: `fragment_left/right` são grupos independentes. São adequados para separação visual, mas as duas instâncias de miniasteroid continuam sendo criadas pela lógica atual; não duplicar invocações. A arte dos miniasteroids não foi remodelada nesta entrega.
- Carga: materiais com emission são candidatos a intensidade ligada a `enemy.attackCharge` ou `enemy.dashCharge`; não mudar velocidade/timing para caber na animação.
- Congelamento: pausar rotor, portas e pulsação conforme `enemy.elementState.freeze`.

## Verificação ao integrar

Comparar silhueta com hitbox e barra de vida no tamanho real. Conferir origem de cada projétil em tiro central, leque, anel e convergência. Preservar número de balas, contagem de drones, padrões e recompensas. Os novos arquivos não estão conectados ao EnemyManager: miniHive/miniHarpy exigem substituir o caminho visual que hoje aponta ao mesmo builder dos bosses, mantendo suas IAs.
