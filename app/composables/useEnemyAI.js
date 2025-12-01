import { useEnemyManagerStore } from '~/stores/enemyManagerStore';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { storeToRefs } from 'pinia';
import { useEnemyManager } from '~/composables/useEnemyManager';
import { useProjectileStore, projectilesType } from '~/stores/projectileStore';

export function useEnemyAI() {
    const enemyManager = useEnemyManager();
    const enemyManagerStore = useEnemyManagerStore();
    const currentRunStore = useCurrentRunStore();
    const projectileStore = useProjectileStore();
    
    const { activeEnemies } = storeToRefs(enemyManagerStore);
    const { playerPosition, isPlaying } = storeToRefs(currentRunStore);

    const behaviors = {
        asteroid: (enemy, deltaTime) => {
            // Comportamento simples para asteroides: movem-se lentamente na direção do jogador no eixo Y e Z
            const directionZ = playerPosition.value.z - enemy.position.z;
            const directionX = playerPosition.value.x - enemy.position.x;
            const length = Math.sqrt(directionZ * directionZ + directionX * directionX);
            if (length > 1) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
            }

            // detecta colisão com o jogador e dá dano
            if (length <= 1) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`Asteroid ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                // destrói o asteroide após a colisão
                enemyManager.takeDamage(enemy.id, enemy.health);
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
                );

                // Reseta o cooldown do tiro
                enemy.cooldownShot = enemy.cooldownTotalShot;
            }

            // detecta colisão com o jogador e dá dano
            if (length <= 1) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`UFO ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                enemyManager.takeDamage(enemy.id, enemy.health);
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
            if (length > 1) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
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
            );

            // Reseta o cooldown do tiro
            enemy.cooldownShot = enemy.cooldownTotalShot;
        },
    }

    const update = (deltaTime) => {
        activeEnemies.value.forEach(enemy => {
            const behavior = behaviors[enemy.type];

            if (! behavior) {
                console.warn(`Enemy AI: No behavior defined for enemy type "${enemy.type}"`);
                return;
            }

            behavior(enemy, deltaTime);
        });
    }

    return {
        update,
    }
}
