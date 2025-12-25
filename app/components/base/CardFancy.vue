<script setup lang="js">
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
        <div
            :class="[
              'card-fancy-content',
              `card-fancy-content--${variant}`
            ]"
        >
            <!-- Checkers background -->
            <div class="absolute inset-0 bg-center rounded-lg"
            style="background-image:
                linear-gradient(135deg, rgba(255,255,255,.05) 25%, transparent 25%),
                linear-gradient(225deg, rgba(255,255,255,.05) 25%, transparent 25%),
                linear-gradient(315deg, rgba(255,255,255,.05) 25%, transparent 25%),
                linear-gradient(45deg, rgba(255,255,255,.05) 25%, transparent 25%);
                background-size: 50px 50px;"
            >
            </div>

            <!-- Content -->
            <div class="flex flex-col items-center">
                <slot />
            </div>

        </div>
    </div>
</template>

<style scoped>
/* Base da borda externa */
.card-fancy-border {
  padding: 0.75rem;
  border-radius: 0.75rem;
  box-shadow: 0px 2px 0px 2px rgba(255, 0, 0, 1);
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

/* Base do conteúdo interno */
.card-fancy-content {
  position: relative;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

/* Variantes de conteúdo */
.card-fancy-content--blue {
  background-color: rgb(29 78 216);
  box-shadow: 0px 0.5px 0px 2px rgb(30 58 138);
}

.card-fancy-content--yellow {
  background-color: #ffca4a;
  box-shadow: 0px 0.5px 0px 2px #a86b00;
}

.card-fancy-content--red {
  background-color: #ff4a4a;
  box-shadow: 0px 0.5px 0px 2px #b81a1a;
}

.card-fancy-content--green {
  background-color: #5cd63c;
  box-shadow: 0px 0.5px 0px 2px #1a7a0a;
}

.card-fancy-content--orange {
  background-color: #ff9933;
  box-shadow: 0px 0.5px 0px 2px #cc6600;
}

.card-fancy-content--gray {
  background-color: #8a8a8a;
  box-shadow: 0px 0.5px 0px 2px #4a4a4a;
}
</style>
