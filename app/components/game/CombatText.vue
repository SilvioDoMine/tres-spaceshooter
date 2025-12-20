<script setup lang="js">
function getColor(type) {
    switch (type) {
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

function getTextState(text) {
    const elapsed = Date.now() - text.createdAt;
    const duration = 1000; // 1 second
    const progress = Math.min(elapsed / duration, 1);

    return {
        opacity: 1 - progress,
        offsetY: progress * 2, // Move up by 2 units over the duration
    };
}

const props = defineProps({
    position: {
        type: Array,
        required: false,
    },
    default: () => {
        return [0, 0, 0];
    },
});


const combatTexts = shallowRef([
    {
        id: 1,
        type: 'damage',
        value: 150,
        createdAt: Date.now(),
    },
        {
        id: 2,
        type: 'damage',
        value: 150,
        createdAt: Date.now(),
    },
]);
</script>

<template>
    <TresGroup name="CombatText">
        <TresGroup
            v-for="text in combatTexts"
            :key="text.id"
            :position="props.position"
            :name="`combattext${text.id}`"
        >
            <Suspense>
                <Text3D
                    :position="[0, 0, 0]"
                    :rotation="[-Math.PI / 2, 0, 0]"
                    :scale="[0.5, 0.5, 0.5]"
                    text="9999"
                    font="/fonts/PoppinsBold.json"
                    center
                >
                <TresMeshBasicMaterial
                    color="white"
                    :opacity="getTextState(text).opacity"
                    :transparent="false"
                />
                </Text3D>
            </Suspense>
        </TresGroup>
    </TresGroup>
</template>
