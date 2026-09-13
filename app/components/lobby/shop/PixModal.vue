<script setup lang="ts">
import type { GemPack } from '~/data/shop';
import { useAudio } from '~/composables/useAudio';
import { simulatePixPayment, usePix } from '~/composables/usePix';
import { useShopStore } from '~/stores/useShopStore';
import { formatBRL, type PixCharge } from '~/utils/shop';

// Pagamento PIX de um pacote de gemas: valor, QR Code, copia e cola, Atualizar e confirmação automática.
const props = defineProps<{ pack: GemPack | null }>();
const emit = defineEmits<{ close: [] }>();

const shop = useShopStore();
const pix = usePix();
const audio = useAudio();
const isDev = import.meta.dev;

const charge = ref<PixCharge | null>(null);
const qr = ref('');
const status = ref<'loading' | 'pending' | 'checking' | 'paid' | 'expired'>('loading');
const credited = ref(0);
const copied = ref(false);

const credit = computed(() => {
  if (!props.pack) return { base: 0, bonus: 0 };
  return { base: props.pack.gems, bonus: shop.bonusApplies(props.pack.id) ? props.pack.bonus : 0 };
});

let poll: ReturnType<typeof setInterval> | undefined;

async function load(pack: GemPack) {
  status.value = 'loading';
  credited.value = 0;
  copied.value = false;
  const next = await pix.startCharge(pack.id);
  if (!next || props.pack?.id !== pack.id) return;
  charge.value = next;
  qr.value = await pix.qrDataUrl(next);
  status.value = 'pending';
  clearInterval(poll);
  poll = setInterval(() => check(false), 5000);
}

async function check(manual = true) {
  if (!charge.value || status.value === 'paid' || status.value === 'checking') return;
  if (manual) status.value = 'checking';
  const result = await pix.refresh(charge.value);
  if (result.status === 'paid') {
    clearInterval(poll);
    credited.value = result.credited;
    status.value = 'paid';
    audio.playUiSound('fuse');
    confettiOnPageSides(600);
  } else {
    status.value = result.status;
    if (result.status === 'expired') clearInterval(poll);
  }
}

async function copy() {
  if (!charge.value) return;
  try {
    await navigator.clipboard.writeText(charge.value.copyPaste);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
}

function simulate() {
  simulatePixPayment(charge.value?.id);
  check();
}

watch(
  () => props.pack,
  pack => {
    clearInterval(poll);
    if (pack) load(pack);
    else charge.value = null;
  },
);

onUnmounted(() => clearInterval(poll));
</script>

<template>
  <LobbyShopDialog :open="!!pack" title="Pagamento via PIX" width="380px" @close="emit('close')">
    <div v-if="pack" class="pix">
      <template v-if="status === 'paid'">
        <div class="pix__paid">
          <SvgGemIcon :size="72" />
          <strong>+{{ credited.toLocaleString('pt-BR') }} gemas</strong>
          <p>Pagamento confirmado! As gemas já estão na sua conta.</p>
        </div>
      </template>

      <template v-else>
        <div class="pix__summary">
          <SvgGemIcon :size="34" :sparkle="false" />
          <span>
            {{ credit.base.toLocaleString('pt-BR') }} gemas
            <b v-if="credit.bonus">+ {{ credit.bonus.toLocaleString('pt-BR') }} bônus</b>
          </span>
          <strong>{{ formatBRL(pack.priceBRL) }}</strong>
        </div>

        <div class="pix__qr">
          <img v-if="qr && status !== 'loading'" :src="qr" alt="QR Code PIX" />
          <span v-else class="pix__loading">Gerando cobrança…</span>
        </div>

        <label class="pix__copy">
          <span>PIX copia e cola</span>
          <input :value="charge?.copyPaste ?? ''" readonly @focus="($event.target as HTMLInputElement).select()" />
        </label>
        <button type="button" class="pix__btn is-blue" :disabled="!charge" @click="copy">
          {{ copied ? 'Código copiado!' : 'Copiar código' }}
        </button>

        <p class="pix__info">
          Assim que o pagamento for confirmado, as gemas caem automaticamente na sua conta.
          <template v-if="status === 'expired'"><br /><b>Esta cobrança expirou. Feche e gere outra.</b></template>
        </p>
      </template>
    </div>

    <template #actions>
      <button v-if="status === 'paid'" type="button" class="pix__btn is-green" @click="emit('close')">Continuar</button>
      <template v-else>
        <button type="button" class="pix__btn is-green" :disabled="!charge || status === 'checking'" @click="check()">
          {{ status === 'checking' ? 'Verificando…' : 'Atualizar' }}
        </button>
        <button v-if="isDev" type="button" class="pix__btn is-dev" :disabled="!charge" @click="simulate">Simular pago</button>
      </template>
    </template>
  </LobbyShopDialog>
</template>

<style scoped>
.pix {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}
.pix__summary {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #efe2c6;
  font-size: 15px;
}
.pix__summary b {
  display: block;
  font-size: 12px;
  color: #2a9a2a;
}
.pix__summary strong {
  font-size: 20px;
  color: #3a2410;
}
.pix__qr {
  display: grid;
  place-items: center;
  align-self: center;
  width: 200px;
  height: 200px;
  padding: 8px;
  border-radius: 12px;
  background: #fff;
  border: 2px solid #e2c08e;
}
.pix__qr img {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}
.pix__loading {
  font-size: 14px;
  color: #8a6a44;
}
.pix__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.pix__copy input {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 2px solid #e2c08e;
  background: #fff;
  font: 12px monospace;
  color: #3a2410;
  user-select: all;
  -webkit-user-select: all;
}
.pix__info {
  margin: 0;
  font-size: 13px;
  line-height: 1.35;
  color: #8a5a2c;
  text-align: center;
}
.pix__paid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  text-align: center;
}
.pix__paid strong {
  font-size: 28px;
  color: #2a9a2a;
}
.pix__paid p {
  margin: 0;
  font-size: 15px;
}
.pix__btn {
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  border: 3px solid;
  font: 18px 'Lilita One', sans-serif;
  color: #fff;
  cursor: pointer;
  -webkit-text-stroke: 4px rgba(0, 0, 0, 0.35);
  paint-order: stroke fill;
}
.pix__btn:disabled {
  filter: grayscale(0.7);
  cursor: not-allowed;
}
.pix__btn.is-green {
  border-color: #1a6a0a;
  background: linear-gradient(#8ef06a, #37b41e);
  box-shadow: 0 4px 0 #1a6a0a;
}
.pix__btn.is-blue {
  border-color: #134a91;
  background: linear-gradient(#7cc4ff, #2a7ee0);
  box-shadow: 0 4px 0 #134a91;
}
.pix__btn.is-dev {
  flex: 0 0 auto;
  border-color: #6b4a00;
  background: linear-gradient(#ffd97a, #e0a020);
  box-shadow: 0 4px 0 #6b4a00;
  font-size: 14px;
}
</style>
