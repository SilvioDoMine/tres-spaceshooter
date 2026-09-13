<script setup lang="ts">
import { useAudio } from '~/composables/useAudio';
import { simulatePixPayment, usePix, type PixProduct } from '~/composables/usePix';
import { formatBRL, type PixCharge } from '~/utils/shop';

// Pagamento PIX de um produto (pacote de gemas, oferta...): valor, QR Code, copia e cola, Atualizar
// e confirmação automática. Quem abre decide o que entregar em `product.onPaid`.
const props = defineProps<{ product: PixProduct | null }>();
const emit = defineEmits<{ close: []; paid: [] }>();

const pix = usePix();
const audio = useAudio();
const isDev = import.meta.dev;

const charge = ref<PixCharge | null>(null);
const qr = ref('');
const status = ref<'loading' | 'pending' | 'checking' | 'paid' | 'expired'>('loading');
const message = ref('');
const copied = ref(false);
/** Produto pago guardado: o pai pode trocar/limpar o `product` depois de entregar */
const paidProduct = ref<PixProduct | null>(null);

let poll: ReturnType<typeof setInterval> | undefined;

async function load(product: PixProduct) {
  status.value = 'loading';
  message.value = '';
  copied.value = false;
  paidProduct.value = null;
  const next = await pix.startCharge(product);
  if (props.product?.id !== product.id) return;
  charge.value = next;
  qr.value = await pix.qrDataUrl(next);
  status.value = 'pending';
  clearInterval(poll);
  poll = setInterval(() => check(false), 5000);
}

async function check(manual = true) {
  const product = props.product;
  if (!charge.value || !product || status.value === 'paid' || status.value === 'checking') return;
  if (manual) status.value = 'checking';
  const result = await pix.refresh(charge.value, product);
  if (result.status === 'paid') {
    clearInterval(poll);
    message.value = result.message;
    paidProduct.value = product;
    status.value = 'paid';
    audio.playUiSound('fuse');
    confettiOnPageSides(600);
    emit('paid');
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
  () => props.product?.id,
  () => {
    clearInterval(poll);
    if (props.product) load(props.product);
    else charge.value = null;
  },
);

onUnmounted(() => clearInterval(poll));
</script>

<template>
  <LobbyShopDialog :open="!!product" title="Pagamento via PIX" width="380px" @close="emit('close')">
    <div v-if="product" class="pix">
      <template v-if="status === 'paid'">
        <div class="pix__paid">
          <SvgGemIcon v-if="(paidProduct ?? product).icon !== 'card'" :size="72" />
          <span v-else class="pix__card-icon pix__card-icon--big" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 4v8h16V8H4m2 6h4v2H6v-2z" /></svg>
          </span>
          <strong>{{ message }}</strong>
          <p>Pagamento confirmado! Já está na sua conta.</p>
        </div>
      </template>

      <template v-else>
        <div class="pix__summary">
          <SvgGemIcon v-if="product.icon !== 'card'" :size="34" :sparkle="false" />
          <span v-else class="pix__card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 4v8h16V8H4m2 6h4v2H6v-2z" /></svg>
          </span>
          <span>
            {{ product.title }}
            <b v-if="product.subtitle">{{ product.subtitle }}</b>
          </span>
          <strong>{{ formatBRL(product.priceBRL) }}</strong>
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
          Assim que o pagamento for confirmado, a compra é liberada automaticamente na sua conta.
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
.pix__card-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(#ff7a8a, #d8344a);
  border: 2px solid #7a1424;
}
.pix__card-icon svg {
  width: 22px;
  height: 22px;
  fill: #fff;
}
.pix__card-icon--big {
  width: 72px;
  height: 72px;
  border-radius: 16px;
}
.pix__card-icon--big svg {
  width: 48px;
  height: 48px;
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
  font-size: 24px;
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
