import QRCode from 'qrcode';
import { useShopStore } from '~/stores/useShopStore';
import type { PixCharge } from '~/utils/shop';

// Pagamento PIX de qualquer produto pago (pacotes de gemas, ofertas...). A UI só conhece a interface
// PixProvider; hoje o provider é simulado (o pagamento é "confirmado" pelo comando de debug
// simulatePixPayment()). Para ligar um gateway real, basta implementar PixProvider chamando rotas do
// servidor e trocar `provider` abaixo.
export type PixStatus = 'pending' | 'paid' | 'expired';

/** O que está sendo pago: o modal mostra o resumo e chama `onPaid` quando o pagamento confirma */
export interface PixProduct {
  /** Único por produto: pacotes usam o id do pacote; ofertas usam "offer:<id>" */
  id: string;
  title: string;
  /** Linha extra no resumo (ex.: "+ 80 bônus") */
  subtitle?: string;
  priceBRL: number;
  icon?: 'gems' | 'card';
  /** Entrega o produto e devolve o texto de sucesso (ex.: "+160 gemas") */
  onPaid: () => string;
}

export interface PixProvider {
  createCharge(product: PixProduct): Promise<PixCharge>;
  getStatus(charge: PixCharge): Promise<PixStatus>;
}

const CHARGE_TTL_MS = 30 * 60 * 1000;

/** Campo EMV: id + tamanho com 2 dígitos + valor */
const emv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** CRC16-CCITT (0x1021), exigido no fim do BR Code */
function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/** BR Code no formato do PIX copia e cola (chave fictícia: não é pagável) */
function fakeBrCode(txid: string, amount: number) {
  const account = emv('00', 'br.gov.bcb.pix') + emv('01', 'loja-simulada@spaceshooter.dev');
  const body =
    emv('00', '01') +
    emv('26', account) +
    emv('52', '0000') +
    emv('53', '986') +
    emv('54', amount.toFixed(2)) +
    emv('58', 'BR') +
    emv('59', 'SPACESHOOTER') +
    emv('60', 'SAO PAULO') +
    emv('62', emv('05', txid.slice(0, 25)));
  const withCrc = `${body}6304`;
  return withCrc + crc16(withCrc);
}

/** Cobranças marcadas como pagas pelo debug (vale só nesta aba) */
const simulatedPaid = new Set<string>();

export const mockPixProvider: PixProvider = {
  async createCharge(product) {
    const id = `SIM${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const createdAt = Date.now();
    return {
      id,
      packId: product.id,
      amountBRL: product.priceBRL,
      copyPaste: fakeBrCode(id, product.priceBRL),
      createdAt,
      expiresAt: createdAt + CHARGE_TTL_MS,
    };
  },
  async getStatus(charge) {
    if (simulatedPaid.has(charge.id)) return 'paid';
    return Date.now() > charge.expiresAt ? 'expired' : 'pending';
  },
};

const provider: PixProvider = mockPixProvider;

export function usePix() {
  const shop = useShopStore();

  /** Reaproveita a cobrança pendente do mesmo produto (reabrir o modal não gera outra) */
  async function startCharge(product: PixProduct) {
    const pending = shop.pendingPix;
    if (pending && pending.packId === product.id && pending.expiresAt > Date.now()) return pending;
    const charge = await provider.createCharge(product);
    shop.setPendingPix(charge);
    return charge;
  }

  /** Consulta o pagamento; se pago, entrega o produto e devolve o texto de sucesso */
  async function refresh(charge: PixCharge, product: PixProduct): Promise<{ status: PixStatus; message: string }> {
    const status = await provider.getStatus(charge);
    const isPending = shop.pendingPix?.id === charge.id;
    if (status === 'paid' && isPending) {
      // Limpa antes de entregar: um segundo Atualizar não entrega de novo
      shop.setPendingPix(null);
      return { status, message: product.onPaid() };
    }
    if (status === 'expired' && isPending) shop.setPendingPix(null);
    return { status, message: '' };
  }

  const qrDataUrl = (charge: PixCharge) =>
    QRCode.toDataURL(charge.copyPaste, { margin: 1, width: 240, color: { dark: '#10183a', light: '#ffffff' } });

  return { startCharge, refresh, qrDataUrl };
}

/** Debug: confirma a cobrança pendente (ou uma específica) como paga */
export function simulatePixPayment(chargeId?: string) {
  const id = chargeId ?? useShopStore().pendingPix?.id;
  if (!id) return false;
  simulatedPaid.add(id);
  return true;
}
