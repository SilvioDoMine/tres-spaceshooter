<script setup lang="js">
import CheckersCard from '~/components/base/CheckersCard.vue';

defineProps({
  variant: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'yellow', 'red', 'green', 'orange', 'gray'].includes(value)
  },
  goldBorder: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
    <div
      :class="[
        'card-fancy-border',
        goldBorder ? 'card-fancy-border--gold' : `card-fancy-border--${variant}`
      ]"
    >
        <!-- Content card -->
        <CheckersCard :variant="variant">
            <div class="flex flex-col items-center">
                <slot />
            </div>
        </CheckersCard>
    </div>
</template>

<style scoped>
/* Base da borda externa */
.card-fancy-border {
  padding: 0.75rem;
  border-radius: 0.75rem;
}

/* Borda dourada (padrão) */
.card-fancy-border--gold {
  background-color: rgb(253 224 71);
  box-shadow: 0px 2px 0px 2px rgb(202 138 4);
}

/* Bordas coloridas por variante */
.card-fancy-border--blue {
  background-color: #7cb5ff;
  box-shadow: 0px 2px 0px 2px #1a4a8a;
}

.card-fancy-border--yellow {
  background-color: rgb(253 224 71);
  box-shadow: 0px 2px 0px 2px rgb(202 138 4);
}

.card-fancy-border--red {
  background-color: #ff7a7a;
  box-shadow: 0px 2px 0px 2px #b81a1a;
}

.card-fancy-border--green {
  background-color: #7ce85c;
  box-shadow: 0px 2px 0px 2px #1a7a0a;
}

.card-fancy-border--orange {
  background-color: #ffb366;
  box-shadow: 0px 2px 0px 2px #cc6600;
}

.card-fancy-border--gray {
  background-color: #b8b8b8;
  box-shadow: 0px 2px 0px 2px #4a4a4a;
}
</style>
