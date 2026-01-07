import { useEnemyManagerStore } from '~/stores/enemyManagerStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { storeToRefs } from 'pinia';
import { useEnemyManager, baseStats } from '~/composables/useEnemyManager';
import { useProjectileStore } from '~/stores/projectileStore';

export function useEnemyAI() {
    const enemyManager = useEnemyManager();
    const enemyManagerStore = useEnemyManagerStore();
    const currentRunStore = useCurrentRunStore();
    const projectileStore = useProjectileStore();
    
    const { activeEnemies } = storeToRefs(enemyManagerStore);
    const { playerPosition, isPlaying } = storeToRefs(currentRunStore);

    const behaviors = {
        angel: (enemy, deltaTime) => {
            // Fica parado, se o jogador chegar 2 pixels próximo nós iremos dar 1 upgrade de skill
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);

            if (length <= 2) {
                console.log(`Angel ${enemy.id} deu um upgrade ao jogador!`);

                useSkillStore().startSkillSelection();
                // destrói o angel após dar o upgrade
                enemyManager.takeDamage(enemy.id, enemy.health, 'systemkill');
            }
        },
        miniasteroid: (enemy, deltaTime) => {
            // Escolhe uma direção aleatória no spawn e segue em linha reta
            if (!enemy.direction) {
                const angle = Math.random() * Math.PI * 2;
                enemy.direction = {
                    x: Math.cos(angle),
                    z: Math.sin(angle),
                };
            }

            // Move-se na direção escolhida
            enemy.position.z += enemy.direction.z * enemy.speed * deltaTime;
            enemy.position.x += enemy.direction.x * enemy.speed * deltaTime;

            // Ricochete nas paredes (bounce como uma bola de bilhar)
            const levelWidth = useCurrentRunStore().currentStage.width;
            const levelHeight = useCurrentRunStore().currentStage.height;

            // Parede Z (cima/baixo)
            if (enemy.position.z <= -levelHeight / 2 || enemy.position.z >= levelHeight / 2) {
                enemy.direction.z = -enemy.direction.z;
                // Empurra pra dentro do mapa para não ficar preso
                enemy.position.z = Math.max(-levelHeight / 2 + 0.1, Math.min(levelHeight / 2 - 0.1, enemy.position.z));
            }

            // Parede X (esquerda/direita)
            if (enemy.position.x <= -levelWidth / 2 || enemy.position.x >= levelWidth / 2) {
                enemy.direction.x = -enemy.direction.x;
                // Empurra pra dentro do mapa para não ficar preso
                enemy.position.x = Math.max(-levelWidth / 2 + 0.1, Math.min(levelWidth / 2 - 0.1, enemy.position.x));
            }
            
            // Inicializa velocidade de rotação aleatória se não existir
            if (!enemy.rotationSpeed) {
                enemy.rotationSpeed = {
                    x: (Math.random() - 0.5) * 4, // -2 a 2
                    y: (Math.random() - 0.5) * 4,
                    z: (Math.random() - 0.5) * 4
                };
            }

            // Inicializa rotação se não existir
            if (!enemy.rotation) {
                enemy.rotation = { x: 0, y: 0, z: 0 };
            }

            // Atualiza rotação continuamente
            enemy.rotation.x += enemy.rotationSpeed.x * deltaTime;
            enemy.rotation.y += enemy.rotationSpeed.y * deltaTime;
            enemy.rotation.z += enemy.rotationSpeed.z * deltaTime;

            // detecta colisão com o jogador e dá dano
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);

            if (length <= enemy.size) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`Miniasteroid ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                // destrói o asteroide após a colisão
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
            }
        },
        asteroidBoss: (enemy, deltaTime) => {
            // Comportamento simples para asteroides: movem-se lentamente na direção do jogador no eixo Y e Z
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);

            // Inicializa velocidade de rotação aleatória se não existir
            if (!enemy.rotationSpeed) {
                enemy.rotationSpeed = {
                    x: (Math.random() - 0.5) * 2, // -1 a 1
                    y: (Math.random() - 0.5) * 2,
                    z: (Math.random() - 0.5) * 2
                };
            }

            // Inicializa rotação se não existir
            if (!enemy.rotation) {
                enemy.rotation = { x: 0, y: 0, z: 0 };
            }

            // Atualiza rotação continuamente
            enemy.rotation.x += enemy.rotationSpeed.x * deltaTime;
            enemy.rotation.y += enemy.rotationSpeed.y * deltaTime;
            enemy.rotation.z += enemy.rotationSpeed.z * deltaTime;

            if (length > 1) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
            }

            // detecta colisão com o jogador e dá dano
            if (length <= enemy.size) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`Asteroid ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                // destrói o asteroide após a colisão
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
            }
        },
        asteroid: (enemy, deltaTime) => {
            // Comportamento simples para asteroides: movem-se lentamente na direção do jogador no eixo Y e Z
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);

            // Inicializa velocidade de rotação aleatória se não existir
            if (!enemy.rotationSpeed) {
                enemy.rotationSpeed = {
                    x: (Math.random() - 0.5) * 2, // -1 a 1
                    y: (Math.random() - 0.5) * 2,
                    z: (Math.random() - 0.5) * 2
                };
            }

            // Inicializa rotação se não existir
            if (!enemy.rotation) {
                enemy.rotation = { x: 0, y: 0, z: 0 };
            }

            // Atualiza rotação continuamente
            enemy.rotation.x += enemy.rotationSpeed.x * deltaTime;
            enemy.rotation.y += enemy.rotationSpeed.y * deltaTime;
            enemy.rotation.z += enemy.rotationSpeed.z * deltaTime;

            if (length > 1) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
            }

            // detecta colisão com o jogador e dá dano
            if (length <= enemy.size) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`Asteroid ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                // destrói o asteroide após a colisão
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
            }
        },
        ufo: (enemy, deltaTime) => {
            // Move-se em direção ao jogador, mas param a uma certa distância.
            // Se o jogador se aproximar, o UFO mantém a distância.
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);
            const desiredDistance = enemy.distanceKeep; // Distância que o UFO quer manter do jogador

            // Atualiza o cooldown do tiro - Essa lógica precisa acontecer antes
            if (enemy.cooldownShot !== undefined) {
                enemy.cooldownShot -= deltaTime;
                if (enemy.cooldownShot < 0) {
                    enemy.cooldownShot = 0;
                }
            }

            // Move-se em direção ao jogador se estiver além da distância desejada
            if (length > desiredDistance) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
            } else {
                // Verifica se o enemy pode atirar
                if (enemy.cooldownShot === undefined) {
                    console.log(`Enemy AI: UFO enemy ${enemy.id} missing cooldownShot property`);
                    return;
                }

                if (enemy.cooldownShot > 0) {
                    return;
                }

                // Atira um projétil em direção ao jogador
                const directionNorm = {
                    x: directionX / length,
                    z: directionZ / length,
                };

                projectileStore.spawnProjectile(
                    'ufo',
                    { ...enemy.position },
                    directionNorm,
                    enemy.id,
                    'enemy',
                    1,
                    1,
                    baseStats.ufo.shotDamage
                );

                // Reseta o cooldown do tiro
                enemy.cooldownShot = enemy.cooldownTotalShot;
            }

            // detecta colisão com o jogador e dá dano
            if (length <= enemy.size) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`UFO ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
            }
        },
        ufofast: (enemy, deltaTime) => {
            // Move-se em direção ao jogador, mas param a uma certa distância.
            // Se o jogador se aproximar, o UFO mantém a distância.
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);
            const desiredDistance = enemy.distanceKeep; // Distância que o UFO quer manter do jogador

            // Atualiza o cooldown do tiro - Essa lógica precisa acontecer antes
            if (enemy.cooldownShot !== undefined) {
                enemy.cooldownShot -= deltaTime;
                if (enemy.cooldownShot < 0) {
                    enemy.cooldownShot = 0;
                }
            }

            // Move-se em direção ao jogador se estiver além da distância desejada
            if (length > desiredDistance) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
            } else {
                // Verifica se o enemy pode atirar
                if (enemy.cooldownShot === undefined) {
                    console.log(`Enemy AI: UFO enemy ${enemy.id} missing cooldownShot property`);
                    return;
                }

                if (enemy.cooldownShot > 0) {
                    return;
                }

                // Atira um projétil em direção ao jogador
                const directionNorm = {
                    x: directionX / length,
                    z: directionZ / length,
                };

                projectileStore.spawnProjectile(
                    'ufofast',
                    { ...enemy.position },
                    directionNorm,
                    enemy.id,
                    'enemy',
                    1,
                    1,
                    baseStats.ufofast.shotDamage
                );

                // Reseta o cooldown do tiro
                enemy.cooldownShot = enemy.cooldownTotalShot;
            }

            // detecta colisão com o jogador e dá dano
            if (length <= enemy.size) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`UFOFAST ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
            } 
        },
        kamikaze: (enemy, deltaTime) => {
            // Move-se lentamente até chegar no keepDistance, depois pausa por 1 segundo
            // Depois acelera em direção ao jogador para colidir.
            // Caso o jogador se afaste, volta a se aproximar lentamente e reinicia o ciclo.
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);
            const desiredDistance = enemy.distanceKeep; // Distância que o kamikaze quer manter do jogador

            if (! enemy.kamikazeState) {
                enemy.kamikazeState = 'approaching'; // 'approaching', 'pausing', 'charging', 'recovering'
                enemy.kamikazeTimer = 0;
            }
            
            if (enemy.kamikazeState === 'approaching') {
                // Move-se em direção ao jogador
                if (length > desiredDistance) {
                    enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                    enemy.position.x += (directionX / length) * enemy.speed * deltaTime;

                    // Rotação suave para apontar na direção do movimento
                    const targetRotation = Math.atan2(directionX, directionZ);
                    if (!enemy.rotation) enemy.rotation = targetRotation;

                    // Interpolação suave da rotação
                    const rotationSpeed = 8; // Velocidade de rotação
                    let diff = targetRotation - enemy.rotation;

                    // Normaliza diferença para [-PI, PI] (caminho mais curto)
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;

                    enemy.rotation += diff * rotationSpeed * deltaTime;
                } else {
                    // Alcançou a distância desejada, começa a pausar
                    enemy.kamikazeState = 'pausing';
                    enemy.kamikazeTimer = 1.0; // Pausa por 1 segundo
                }
            } else if (enemy.kamikazeState === 'pausing') {
                enemy.kamikazeTimer -= deltaTime;
                if (enemy.kamikazeTimer <= 0) {
                    // Começa a carregar em direção ao jogador
                    enemy.kamikazeChargePosition = { ...playerPosition.value }; // Trava a posição do jogador no momento do charge
                    enemy.kamikazeState = 'charging';
                }
            } else if (enemy.kamikazeState === 'charging') {
                // Anda em direção à posição travada do jogador
                const chargeDirectionZ = enemy.kamikazeChargePosition.z - enemy.position.z;
                const chargeDirectionX = enemy.kamikazeChargePosition.x - enemy.position.x;
                const chargeLength = Math.sqrt(chargeDirectionZ * chargeDirectionZ + chargeDirectionX * chargeDirectionX);


                // Charge com 4x a velocidade normal
                const chargeSpeed = enemy.speed * 4;

                if (chargeLength > 0.5) { // Se ainda está longe da posição travada
                    enemy.position.z += (chargeDirectionZ / chargeLength) * chargeSpeed * deltaTime;
                    enemy.position.x += (chargeDirectionX / chargeLength) * chargeSpeed * deltaTime;

                    // Rotação suave para apontar na direção do charge
                    const targetRotation = Math.atan2(chargeDirectionX, chargeDirectionZ);
                    if (!enemy.rotation) enemy.rotation = targetRotation;

                    // Interpolação rápida durante o charge
                    const rotationSpeed = 15; // Mais rápido durante charge
                    let diff = targetRotation - enemy.rotation;

                    // Normaliza diferença para [-PI, PI] (caminho mais curto)
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;

                    enemy.rotation += diff * rotationSpeed * deltaTime;
                } else {
                    // Chegou na posição travada, entra em cooldown de recuperação
                    enemy.kamikazeState = 'recovering';
                    enemy.kamikazeTimer = enemy.chargeRecoveryCooldown || 0;
                }

                // Se o jogador atual se afastar muito da posição travada, recalcula
                const currentPlayerDistance = Math.sqrt(
                    Math.pow(playerPosition.value.x - enemy.kamikazeChargePosition.x, 2) +
                    Math.pow(playerPosition.value.z - enemy.kamikazeChargePosition.z, 2)
                );
                if (currentPlayerDistance > 8) { // Jogador se afastou muito, reinicia
                    enemy.kamikazeState = 'recovering';
                    enemy.kamikazeTimer = enemy.chargeRecoveryCooldown || 0;
                }
            } else if (enemy.kamikazeState === 'recovering') {
                // Fica parado durante o cooldown de recuperação
                enemy.kamikazeTimer -= deltaTime;
                if (enemy.kamikazeTimer <= 0) {
                    // Cooldown terminou, volta a se aproximar
                    enemy.kamikazeState = 'approaching';
                }
            }

            // detecta colisão com o jogador e dá dano
            if (length <= enemy.size) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`Kamikaze ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
            }
        },
        boss: (enemy, deltaTime) => {
            // Comportamento do boss: Move-se lentamente em direção ao jogador e atira frequentemente
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);

            // Atualiza o cooldown do tiro
            if (enemy.cooldownShot !== undefined) {
                enemy.cooldownShot -= deltaTime;
                if (enemy.cooldownShot < 0) {
                    enemy.cooldownShot = 0;
                }
            }

            // Move-se em direção ao jogador
            if (length > enemy.size) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
            } else {
                // detecta colisão com o jogador e dá dano
                console.log(`Boss ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
                return;
            }

            // Verifica se o boss pode atirar
            if (enemy.cooldownShot === undefined) {
                console.log(`Enemy AI: Boss enemy ${enemy.id} missing cooldownShot property`);
                return;
            }

            if (enemy.cooldownShot > 0) {
                return;
            }

            // Atira um projétil em direção ao jogador
            const directionNorm = {
                x: directionX / length,
                z: directionZ / length,
            };

            projectileStore.spawnProjectile(
                'boss',
                { ...enemy.position },
                directionNorm,
                enemy.id,
                'enemy',
                1,
                1,
                baseStats.boss.shotDamage,
            );

            // Reseta o cooldown do tiro
            enemy.cooldownShot = enemy.cooldownTotalShot;
        },
        miniboss: (enemy, deltaTime) => {
            // Comportamento do boss: Move-se lentamente em direção ao jogador e atira frequentemente
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);

            // Atualiza o cooldown do tiro
            if (enemy.cooldownShot !== undefined) {
                enemy.cooldownShot -= deltaTime;
                if (enemy.cooldownShot < 0) {
                    enemy.cooldownShot = 0;
                }
            }

            // Move-se em direção ao jogador
            if (length > enemy.size) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
            } else {
                // detecta colisão com o jogador e dá dano
                console.log(`Miniboss ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
                return;
            }

            // Verifica se o boss pode atirar
            if (enemy.cooldownShot === undefined) {
                console.log(`Enemy AI: Boss enemy ${enemy.id} missing cooldownShot property`);
                return;
            }

            if (enemy.cooldownShot > 0) {
                return;
            }

            // Atira um projétil em direção ao jogador
            const directionNorm = {
                x: directionX / length,
                z: directionZ / length,
            };

            projectileStore.spawnProjectile(
                'miniboss',
                { ...enemy.position },
                directionNorm,
                enemy.id,
                'enemy',
                1,
                1,
                baseStats.miniboss.shotDamage
            );

            // Reseta o cooldown do tiro
            enemy.cooldownShot = enemy.cooldownTotalShot;
        },
        kamikazeBoss: (enemy, deltaTime) => {
            // Move-se lentamente até chegar no keepDistance, depois pausa por 1 segundo
            // Depois acelera em direção ao jogador para colidir.
            // Caso o jogador se afaste, volta a se aproximar lentamente e reinicia o ciclo.
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);
            const desiredDistance = enemy.distanceKeep; // Distância que o kamikaze quer manter do jogador

            if (! enemy.kamikazeState) {
                enemy.kamikazeState = 'approaching'; // 'approaching', 'pausing', 'charging', 'recovering'
                enemy.kamikazeTimer = 0;
            }
            
            if (enemy.kamikazeState === 'approaching') {
                // Move-se em direção ao jogador
                if (length > desiredDistance) {
                    enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                    enemy.position.x += (directionX / length) * enemy.speed * deltaTime;

                    // Rotação suave para apontar na direção do movimento
                    const targetRotation = Math.atan2(directionX, directionZ);
                    if (!enemy.rotation) enemy.rotation = targetRotation;

                    // Interpolação suave da rotação
                    const rotationSpeed = 8; // Velocidade de rotação
                    let diff = targetRotation - enemy.rotation;

                    // Normaliza diferença para [-PI, PI] (caminho mais curto)
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;

                    enemy.rotation += diff * rotationSpeed * deltaTime;
                } else {
                    // Alcançou a distância desejada, começa a pausar
                    enemy.kamikazeState = 'pausing';
                    enemy.kamikazeTimer = 1.0; // Pausa por 1 segundo
                }
            } else if (enemy.kamikazeState === 'pausing') {
                enemy.kamikazeTimer -= deltaTime;
                if (enemy.kamikazeTimer <= 0) {
                    // Começa a carregar em direção ao jogador
                    enemy.kamikazeChargePosition = { ...playerPosition.value }; // Trava a posição do jogador no momento do charge
                    enemy.kamikazeState = 'charging';
                }
            } else if (enemy.kamikazeState === 'charging') {
                // Anda em direção à posição travada do jogador
                const chargeDirectionZ = enemy.kamikazeChargePosition.z - enemy.position.z;
                const chargeDirectionX = enemy.kamikazeChargePosition.x - enemy.position.x;
                const chargeLength = Math.sqrt(chargeDirectionZ * chargeDirectionZ + chargeDirectionX * chargeDirectionX);


                // Charge com 4x a velocidade normal
                const chargeSpeed = enemy.speed * 4;

                if (chargeLength > 0.5) { // Se ainda está longe da posição travada
                    enemy.position.z += (chargeDirectionZ / chargeLength) * chargeSpeed * deltaTime;
                    enemy.position.x += (chargeDirectionX / chargeLength) * chargeSpeed * deltaTime;

                    // Rotação suave para apontar na direção do charge
                    const targetRotation = Math.atan2(chargeDirectionX, chargeDirectionZ);
                    if (!enemy.rotation) enemy.rotation = targetRotation;

                    // Interpolação rápida durante o charge
                    const rotationSpeed = 15; // Mais rápido durante charge
                    let diff = targetRotation - enemy.rotation;

                    // Normaliza diferença para [-PI, PI] (caminho mais curto)
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;

                    enemy.rotation += diff * rotationSpeed * deltaTime;
                } else {
                    // Chegou na posição travada, entra em cooldown de recuperação
                    enemy.kamikazeState = 'recovering';
                    enemy.kamikazeTimer = enemy.chargeRecoveryCooldown || 0;
                }

                // Se o jogador atual se afastar muito da posição travada, recalcula
                const currentPlayerDistance = Math.sqrt(
                    Math.pow(playerPosition.value.x - enemy.kamikazeChargePosition.x, 2) +
                    Math.pow(playerPosition.value.z - enemy.kamikazeChargePosition.z, 2)
                );
                if (currentPlayerDistance > 8) { // Jogador se afastou muito, reinicia
                    enemy.kamikazeState = 'recovering';
                    enemy.kamikazeTimer = enemy.chargeRecoveryCooldown || 0;
                }
            } else if (enemy.kamikazeState === 'recovering') {
                // Fica parado durante o cooldown de recuperação
                enemy.kamikazeTimer -= deltaTime;
                if (enemy.kamikazeTimer <= 0) {
                    // Cooldown terminou, volta a se aproximar
                    enemy.kamikazeState = 'approaching';
                }
            }

            // detecta colisão com o jogador e dá dano
            if (length <= enemy.size) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`Kamikaze ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
            }
        },
    }

    /**
     * Aplica separação entre inimigos para evitar que fiquem sobrepostos
     * @param {object} enemy - O inimigo atual
     * @param {number} deltaTime - Delta time
     */
    const applySeparation = (enemy, deltaTime) => {
        const separationDistance = enemy.size * 1.5; // Distância mínima desejada entre inimigos
        const separationForce = 2; // Força da repulsão

        let pushX = 0;
        let pushZ = 0;

        activeEnemies.value.forEach(other => {
            // Ignora a si mesmo e inimigos não ativos
            if (other.id === enemy.id || other.state !== 'active') {
                return;
            }

            const dx = enemy.position.x - other.position.x;
            const dz = enemy.position.z - other.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Se estiver muito próximo, aplica força de repulsão
            if (distance < separationDistance && distance > 0.1) {
                // Força inversamente proporcional à distância
                const strength = (separationDistance - distance) / separationDistance;

                // Normaliza a direção e aplica a força
                pushX += (dx / distance) * strength;
                pushZ += (dz / distance) * strength;
            }
        });

        // Aplica o empurrão suavemente
        if (pushX !== 0 || pushZ !== 0) {
            enemy.position.x += pushX * separationForce * deltaTime;
            enemy.position.z += pushZ * separationForce * deltaTime;
        }
    };

    const update = (deltaTime) => {
        activeEnemies.value.forEach(enemy => {
            // Inimigos em spawning não se movem nem atacam
            if (enemy.state === 'spawning') {
                return;
            }

            if (enemy.state === 'dying') {
                return;
            }

            // Se state não tiver na array ['active', 'spawning', 'dying'], não faz nada
            if (! ['active', 'angel'].includes(enemy.state)) {
                return;
            }

            const behavior = behaviors[enemy.type];

            if (! behavior) {
                console.warn(`Enemy AI: No behavior defined for enemy type "${enemy.type}"`);
                return;
            }

            behavior(enemy, deltaTime);

            // Aplica separação após o comportamento
            applySeparation(enemy, deltaTime);
        });
    }

    return {
        update,
    }
}
