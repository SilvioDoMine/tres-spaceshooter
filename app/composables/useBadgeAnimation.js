/**
 * Composable para animação de badges voando até um destino
 * Similar a animações de moedas em jogos mobile
 */
export const useBadgeAnimation = () => {
    /**
     * Cria partículas de brilho
     */
    const createSparkles = (x, y) => {
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'badge-sparkle';
            sparkle.style.left = x + 'px';
            sparkle.style.top = y + 'px';
            document.body.appendChild(sparkle);

            const angle = (Math.PI * 2 * i) / 5;
            const velocity = 2 + Math.random() * 2;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            let posX = x, posY = y;
            let life = 1;

            function animateSparkle() {
                posX += vx;
                posY += vy;
                life -= 0.02;

                sparkle.style.left = posX + 'px';
                sparkle.style.top = posY + 'px';
                sparkle.style.opacity = life;

                if (life > 0) {
                    requestAnimationFrame(animateSparkle);
                } else {
                    sparkle.remove();
                }
            }

            animateSparkle();
        }
    };

    /**
     * Cria um badge voador
     */
    const createFlyingBadge = (sourceRect, targetRect, onComplete) => {
        const badge = document.createElement('img');
        badge.src = '/images/icons/badges/mission-badge.png';
        badge.className = 'flying-badge';

        // Posição inicial (no centro do badge de origem)
        const startX = sourceRect.left + sourceRect.width / 2 - 20;
        const startY = sourceRect.top + sourceRect.height / 2 - 20;

        badge.style.left = startX + 'px';
        badge.style.top = startY + 'px';

        document.body.appendChild(badge);

        // Cria partículas de brilho
        createSparkles(startX + 20, startY + 20);

        // Animação com curva bezier (efeito de arco)
        const duration = 800;
        const startTime = Date.now();

        // Variação aleatória na trajetória
        const randomOffsetX = (Math.random() - 0.5) * 100;
        const randomOffsetY = (Math.random() - 0.5) * 100;

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Curva de easing (ease-in-out)
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Calcula a posição com curva bezier
            const targetX = targetRect.left + targetRect.width / 2 - 20;
            const targetY = targetRect.top + targetRect.height / 2 - 20;

            const currentX = startX + (targetX - startX + randomOffsetX * (1 - progress)) * easeProgress;
            const currentY = startY + (targetY - startY + randomOffsetY * (1 - progress)) * easeProgress - Math.sin(progress * Math.PI) * 100;

            badge.style.left = currentX + 'px';
            badge.style.top = currentY + 'px';
            badge.style.opacity = 1 - (progress * 0.3); // Fade suave

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove o badge
                badge.remove();

                // Callback de conclusão
                if (onComplete) {
                    onComplete();
                }
            }
        }

        requestAnimationFrame(animate);
    };

    /**
     * Adiciona efeito de pulso em um elemento
     */
    const addPulseEffect = (element) => {
        if (!element) return;

        element.classList.add('badge-pulse');
        setTimeout(() => {
            element.classList.remove('badge-pulse');
        }, 300);
    };

    /**
     * Anima badges voando de um elemento origem para um destino
     * @param {HTMLElement} sourceElement - Elemento de origem
     * @param {HTMLElement} targetElement - Elemento de destino
     * @param {Object} options - Opções da animação
     * @param {number} options.numberOfBadges - Quantidade de badges (padrão: 15)
     * @param {number} options.delayBetweenBadges - Delay entre cada badge em ms (padrão: 80)
     * @param {Function} options.onComplete - Callback ao finalizar todas as animações
     * @param {Function} options.onEachBadge - Callback para cada badge que chega ao destino
     */
    const animateBadges = (sourceElement, targetElement, options = {}) => {
        const {
            numberOfBadges = 15,
            delayBetweenBadges = 80,
            onComplete = null,
            onEachBadge = null
        } = options;

        if (!sourceElement || !targetElement) {
            console.error('Source or target element not found');
            return;
        }

        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        let badgesCompleted = 0;

        // Cria múltiplos badges com delay
        for (let i = 0; i < numberOfBadges; i++) {
            setTimeout(() => {
                createFlyingBadge(sourceRect, targetRect, () => {
                    badgesCompleted++;

                    // Efeito de pulso no destino
                    addPulseEffect(targetElement);

                    // Callback para cada badge
                    if (onEachBadge) {
                        onEachBadge(badgesCompleted);
                    }

                    // Callback ao finalizar todos os badges
                    if (badgesCompleted === numberOfBadges && onComplete) {
                        onComplete();
                    }
                });
            }, i * delayBetweenBadges);
        }
    };

    return {
        animateBadges,
        createSparkles,
        addPulseEffect
    };
};
