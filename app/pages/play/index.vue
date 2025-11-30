<script setup lang="ts">
onMounted(async () => {
  // Aguardando o próximo tick para garantir que tudo esteja carregado (custom renderer)
  await nextTick();

  // Se o usuário caiu no /index significa que ele não iniciou um jogo, redireciona para a home
  console.warn('Play index page mounted - redirecionando para a home');
  navigateTo('/');
});
</script>

<template>
    <!-- Empty just in case -->
</template>