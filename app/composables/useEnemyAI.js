import { useEnemyManagerStore } from '~/stores/enemyManagerStore';
import { useCurrentRunStore } from '~/stores/currentRun';
import { storeToRefs } from 'pinia';
import { useEnemyManager } from '~/composables/useEnemyManager';

export function useEnemyAI() {
    const enemyManager = useEnemyManager();
    const enemyManagerStore = useEnemyManagerStore();
    const currentRunStore = useCurrentRunStore();
    
    const { activeEnemies } = storeToRefs(enemyManagerStore);
    const { playerPosition } = storeToRefs(currentRunStore);

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

            if (length > desiredDistance) {
                enemy.position.z += (directionZ / length) * enemy.speed * deltaTime;
                enemy.position.x += (directionX / length) * enemy.speed * deltaTime;
            }

            // detecta colisão com o jogador e dá dano
            if (length <= 1) {
                // Aqui você pode implementar a lógica de dano ao jogador
                console.log(`UFO ${enemy.id} colidiu com o jogador!`);

                currentRunStore.takeDamage(enemy.onHitDamage);
                enemyManager.takeDamage(enemy.id, enemy.health);
            }
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
