// Catálogo dos itens simples (moedas, experiência, chaves...): só nome e descrição para o tooltip.
// Equipamento não entra aqui — ele tem atributos e habilidades próprios, ver ~/data/equipment.

export type SimpleItemId = 'gold' | 'gems' | 'exp' | 'key-silver' | 'key-obsidian';

export interface SimpleItemDefinition {
  id: SimpleItemId;
  name: string;
  description: string;
}

export const SIMPLE_ITEMS: Record<SimpleItemId, SimpleItemDefinition> = {
  gold: {
    id: 'gold',
    name: 'Ouro',
    description: 'Moeda comum da frota. Serve para sortear talentos e comprar na loja.',
  },
  gems: {
    id: 'gems',
    name: 'Gemas',
    description: 'Moeda rara. Abre baús, compra os itens da Loja Diária e as ofertas especiais.',
  },
  exp: {
    id: 'exp',
    name: 'Experiência',
    description: 'Sobe o nível da conta, que libera novos sorteios de talento.',
  },
  'key-silver': {
    id: 'key-silver',
    name: 'Chave de Prata',
    description: 'Abre um Baú de Prata sem gastar gemas.',
  },
  'key-obsidian': {
    id: 'key-obsidian',
    name: 'Chave de Obsidiana',
    description: 'Abre um Baú de Obsidiana sem gastar gemas.',
  },
};

export const getSimpleItem = (id: SimpleItemId) => SIMPLE_ITEMS[id];

/** Chave do baú a partir do tipo (o ícone e o estoque são por tipo de baú) */
export const keyItemId = (type: 'silver' | 'obsidian'): SimpleItemId => `key-${type}`;
