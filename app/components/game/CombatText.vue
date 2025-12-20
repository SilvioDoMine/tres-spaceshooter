<script setup lang="js">
import { useCombatTextStore } from '~/stores/useCombatTextStore';

const combatTextStore = useCombatTextStore();

const props = defineProps({
    position: {
        type: Array,
        required: false,
    },
    entityId: {
        type: String,
        required: true,
    },
    default: () => {
        return [0, 0, 0];
    },
});


function getColor(text) {
    if (text.entityId !== PlayerBaseStats.id) {
        return 'white';
    }

    switch (text.type) {
        case 'damage':
            return 'red';
        case 'heal':
            return 'green';
        case 'critical':
            return 'orange';
        default:
            return 'white';
    }
}

function getText(text) {
    switch (text.type) {
        case 'damage':
            return `-${text.value}`;
        case 'heal':
            return `+${text.value}`;
        case 'critical':
            return `-${text.value}!`;
        default:
            return `${text.value}`;
    }
}

const getTextState = (text) => {
    const elapsed = Date.now() - text.createdAt;
    const duration = 1000; // 1 second
    const progress = Math.min(elapsed / duration, 1);
    const offsetY = progress * 2; // Move up by 2 units over the duration
    // Create a NEW array instead of mutating the original
    const position = [text.position[0], text.position[1] + offsetY, text.position[2]];

    return {
        opacity: 1 - progress,
        position: position,
    };
}

const combatTexts = ref([]);

let searchInterval = null;
let cleanupInterval = null;

// Inicia o watcher
onMounted(() => {
    searchInterval = setInterval(() => {
        const newTexts = combatTextStore.consumeForTarget(props.entityId);

        if (newTexts.length <= 0) {
            return;
        }

        newTexts.forEach(text => {
            combatTexts.value.push({
                id: text.id,
                entityId: text.entityId,
                type: text.type,
                value: text.value,
                position: props.position,
                createdAt: Date.now(),
            });
        });
    }, 100);

    // Remove textos expirados automaticamente
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        combatTexts.value = combatTexts.value.filter(text =>
            now - text.createdAt < 1000
        );
    }, 100);
});

// Remove os intervalos
onUnmounted(() => {
    clearInterval(searchInterval);
    clearInterval(cleanupInterval);
});
</script>

<template>
    <TresGroup name="CombatText">
        <TresGroup
            v-for="text in combatTexts"
            :key="text.id"
            :position="getTextState(text).position"
            :name="`combattext${text.id}`"
        >
            <Suspense>
                <Text3D
                    :position="[0, 0, 0]"
                    :rotation="[-Math.PI / 2, 0, 0]"
                    :scale="[0.6, 0.6, 0.6]"
                    :text="getText(text)"
                    font="/fonts/PoppinsBold.json"
                    center
                >
                <TresMeshBasicMaterial
                    :color="getColor(text)"
                    :opacity="getTextState(text).opacity"
                    :transparent="true"
                />
                </Text3D>
            </Suspense>
        </TresGroup>
    </TresGroup>
</template>
