<script setup lang="ts">
import { useShopStore } from '~/stores/useShopStore';

// Tela da Loja: uma página rolável com seções e sub-abas no rodapé que levam até cada uma.
type ShopSection = 'daily' | 'chests' | 'gems' | 'gold';

const props = defineProps<{ focus?: { section: ShopSection; nonce: number } | null }>();

const shop = useShopStore();
shop.ensureFresh();

const screen = ref<{ $el: HTMLElement } | null>(null);
const active = ref<ShopSection>('daily');
const body = () => screen.value?.$el.querySelector<HTMLElement>('.lobby-screen__body') ?? null;

const tabs = computed(() => [
  { id: 'daily' as const, label: 'Loja Diária', badge: shop.hasDailyPending },
  { id: 'chests' as const, label: 'Baús', badge: shop.hasChestPending },
  { id: 'gems' as const, label: 'Gemas', badge: false },
  { id: 'gold' as const, label: 'Ouro', badge: shop.hasGoldPending },
]);

// Enquanto a rolagem é por toque na sub-aba, o observador não troca a aba ativa no meio do caminho
let lockUntil = 0;

function scrollTo(section: ShopSection, smooth = true) {
  const container = body();
  const target = container?.querySelector<HTMLElement>(`[data-shop-section="${section}"]`);
  if (!container || !target) return;
  active.value = section;
  lockUntil = Date.now() + 700;
  const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  container.scrollTo({ top: top - 8, behavior: smooth ? 'smooth' : 'auto' });
}

let observer: IntersectionObserver | null = null;

onMounted(() => {
  const container = body();
  if (!container) return;

  // A seção ativa é a mais alta que ainda aparece na metade de cima da área visível
  const visible = new Map<ShopSection, number>();
  observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.shopSection as ShopSection;
        if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
        else visible.delete(id);
      }
      if (Date.now() < lockUntil || !visible.size) return;
      active.value = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]![0];
    },
    { root: container, rootMargin: '0px 0px -55% 0px' },
  );
  container.querySelectorAll('[data-shop-section]').forEach(el => observer!.observe(el));

  if (props.focus) nextTick(() => scrollTo(props.focus!.section, false));
});

onBeforeUnmount(() => observer?.disconnect());

watch(
  () => props.focus?.nonce,
  () => props.focus && scrollTo(props.focus.section),
);
</script>

<template>
  <LobbyScreen ref="screen" title="Loja" theme="shop">
    <div class="shop">
      <LobbyShopDailySection data-shop-section="daily" />
      <LobbyShopChestSection data-shop-section="chests" />
      <LobbyShopGemsSection data-shop-section="gems" />
      <LobbyShopGoldSection data-shop-section="gold" />
    </div>

    <template #footer>
      <LobbyShopSubTabs :tabs="tabs" :active="active" @select="scrollTo" />
    </template>
  </LobbyScreen>
</template>

<style scoped>
.shop {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
}
@media (min-width: 900px) {
  .shop {
    max-width: 720px;
  }
}
</style>
