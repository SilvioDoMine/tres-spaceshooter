<script setup lang="js">
import BaseModal from '~/components/ui/BaseModal.vue';
</script>

<template>
    <BaseModal
        modal-id="offers-modal"
        title="Ofertas"
    >
        <!-- content box -->
        <div class="flex flex-col gap-4 pointer-events-auto">

                <!-- Settings Controls -->
                <div class="bg-orange-200 flex flex-col gap-2 items-center w-full rounded-md drop-shadow-2xl shadow-orange-400 p-2">

                    <BaseCheckersCard
                        variant="blue"
                        class="w-full"
                    >
                        Oferda Diária
                    </BaseCheckersCard>


                    <BaseCardFancy
                        variant="blue"
                        :gold-border="false"
                        class="w-full"
                    >
                        Sexo
                    </BaseCardFancy>

                    <BaseCardFancy
                        variant="red"
                        :gold-border="false"
                        class="w-full"
                    >
                        Sexo
                    </BaseCardFancy>

                </div>

                <!-- Actions -->
                <div class="flex flex-row gap-2 justify-center">
                    <BaseButton
                        variant="green"
                        size="sm"
                        @click=""
                    >
                        Resgatar Tudo
                    </BaseButton>
                </div>
        </div>
    </BaseModal>
</template>

<style scoped>
    /** Style glow for image div */
    .glow {
        box-shadow: 0 0px 10px 5px rgb(79, 74, 240);
    }
</style>
