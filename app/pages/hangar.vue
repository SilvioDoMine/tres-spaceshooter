<script setup lang="ts">
// Hangar no formato do resto do jogo: faixa azul com título pendurado, palco 3D igual ao do Equipamento
// e um painel de madeira (como os modais) com a frota e a personalização da nave.
const appearance = useShipAppearance();

const paints = [
  { name: 'Patrulha', color: '#17a2ad', exhaust: '#27c7ff' },
  { name: 'Solar', color: '#e99426', exhaust: '#ff973f' },
  { name: 'Nebulosa', color: '#8652d2', exhaust: '#af7aff' },
  { name: 'Resgate', color: '#d83e52', exhaust: '#55ffcc' },
];
const choose = (p: (typeof paints)[number]) => {
  appearance.value.color = p.color;
  appearance.value.exhaust = p.exhaust;
};

const finishes = [
  { label: 'Fosco', value: 0.1 },
  { label: 'Acetinado', value: 0.4 },
  { label: 'Metálico', value: 0.8 },
];

useHead({ title: 'Hangar · Kestrel-07' });
</script>

<template>
  <main class="hangar">
    <header class="hangar__header">
      <NuxtLink to="/" class="hangar__back" aria-label="Voltar ao lobby" data-ui-sound="tap">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </NuxtLink>
      <BaseRibbonTitle text="Hangar" variant="yellow" class="hangar__title" />
      <span class="hangar__owned">1 nave</span>
    </header>

    <section class="hangar__showcase" aria-label="Prévia 3D da Kestrel-07">
      <LobbyEquipmentShipStage class="hangar__stage" />
      <div class="hangar__plate">
        <span class="hangar__class">Interceptadora</span>
        <h2 class="hangar__name">Kestrel-07</h2>
        <p class="hangar__hint">Arraste para girar</p>
      </div>
    </section>

    <section class="hangar__deck allow-scroll">
      <!-- Frota -->
      <BaseInset class="hangar__block">
        <h3 class="hangar__heading">Frota</h3>
        <div class="hangar__fleet">
          <button type="button" class="shipcard is-selected" aria-pressed="true">
            <span class="shipcard__shine" aria-hidden="true"></span>
            <span class="shipcard__tag">Equipada</span>
            <span class="shipcard__icon" aria-hidden="true">🚀</span>
            <b class="shipcard__name">Kestrel-07</b>
          </button>
          <div class="shipcard is-empty">
            <span class="shipcard__icon" aria-hidden="true">✦</span>
            <b class="shipcard__name">Em breve</b>
            <small class="shipcard__note">Novas naves</small>
          </div>
        </div>
      </BaseInset>

      <!-- Personalização -->
      <BaseInset class="hangar__block">
        <h3 class="hangar__heading">Personalizar nave</h3>

        <div class="hangar__paints">
          <button
            v-for="p in paints"
            :key="p.name"
            type="button"
            class="paint"
            :class="{ 'is-active': appearance.color === p.color }"
            :aria-pressed="appearance.color === p.color"
            data-ui-sound="tap"
            @click="choose(p)"
          >
            <i class="paint__swatch" :style="{ background: p.color }" aria-hidden="true"></i>
            <span class="paint__name">{{ p.name }}</span>
          </button>
        </div>

        <BaseInset variant="sunken" class="hangar__controls">
          <label class="hangar__row">
            <span>Pintura</span>
            <input v-model="appearance.color" type="color" class="hangar__color" aria-label="Cor da pintura" />
          </label>
          <label class="hangar__row">
            <span>Cor do propulsor</span>
            <input v-model="appearance.exhaust" type="color" class="hangar__color" aria-label="Cor do propulsor" />
          </label>
          <div class="hangar__row">
            <span>Acabamento</span>
            <div class="hangar__segmented" role="radiogroup" aria-label="Acabamento">
              <button
                v-for="f in finishes"
                :key="f.value"
                type="button"
                role="radio"
                :aria-checked="appearance.finish === f.value"
                :class="{ 'is-active': appearance.finish === f.value }"
                data-ui-sound="tap"
                @click="appearance.finish = f.value"
              >
                {{ f.label }}
              </button>
            </div>
          </div>
          <div class="hangar__row">
            <span>Chama</span>
            <div class="hangar__range">
              <BaseRangeInput v-model="appearance.power" :min="0.65" :max="1.5" :step="0.05" aria-label="Tamanho visual da chama" />
            </div>
          </div>
          <div class="hangar__row">
            <span>Motores animados</span>
            <BaseToggleCheckbox v-model="appearance.thrusters" />
          </div>
        </BaseInset>

        <p class="hangar__saved">✓ Alterações aplicadas à sua nave no jogo</p>
      </BaseInset>
    </section>
  </main>
</template>

<style scoped>
.hangar {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  color: #fff;
  background: linear-gradient(#4aa3ec 0%, #2d6fbf 30%, #1d3566 60%, #161f3f 100%);
}

/* ==================== Faixa do topo (igual às telas cheias do lobby) ==================== */
.hangar__header {
  position: relative;
  z-index: 3;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 84px;
  padding: 0 16px;
  background: linear-gradient(#2f6fc4, #24569e);
  border-bottom: 3px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 14px rgba(10, 6, 40, 0.28);
}
.hangar__title {
  width: auto;
  margin-top: 12px;
}

/* Voltar: botão redondo azul (mesmo acabamento do botão de troca das cartas) */
.hangar__back {
  position: absolute;
  left: 16px;
  top: 50%;
  translate: 0 -50%;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 3px solid #134a91;
  background: linear-gradient(#6cc2ff, #2a7ee0);
  box-shadow: 0 4px 0 #134a91, inset 0 2px 0 rgba(255, 255, 255, 0.5);
  transition: translate 0.1s ease, box-shadow 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}
.hangar__back:active {
  translate: 0 calc(-50% + 3px);
  box-shadow: 0 1px 0 #134a91, inset 0 2px 0 rgba(255, 255, 255, 0.5);
}
.hangar__back svg {
  width: 24px;
  fill: none;
  stroke: #fff;
  stroke-width: 3.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1.5px 0 #134a91);
}

.hangar__owned {
  position: absolute;
  right: 16px;
  top: 50%;
  translate: 0 -50%;
  padding: 5px 12px 6px;
  border-radius: 999px;
  background: rgba(8, 18, 48, 0.45);
  border: 2px solid rgba(255, 255, 255, 0.18);
  font: 13px/1 'Lilita One', sans-serif;
  color: #d4ecff;
}

/* ==================== Palco 3D ==================== */
.hangar__showcase {
  position: relative;
  flex: 1;
  min-height: 200px;
}
.hangar__stage {
  position: absolute;
  inset: 0;
}

/* Placa com o nome da nave: etiqueta pendurada + nome com contorno */
.hangar__plate {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 14px;
  translate: -50% 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.hangar__class {
  padding: 3px 12px 4px;
  border-radius: 10px 10px 0 0;
  background: #173f7d;
  font: 11px/1 'Lilita One', sans-serif;
  letter-spacing: 0.8px;
  color: #d4ecff;
  text-transform: uppercase;
}
.hangar__name {
  margin: 0;
  font: 34px/1.05 'Lilita One', sans-serif;
  letter-spacing: 0.5px;
  color: #fff;
  -webkit-text-stroke: 7px #173f7d;
  paint-order: stroke fill;
  text-shadow: 0 4px 0 #173f7d, 0 8px 14px rgba(0, 0, 0, 0.45);
}
.hangar__hint {
  margin: 6px 0 0;
  padding: 3px 10px 4px;
  border-radius: 999px;
  background: rgba(8, 18, 48, 0.55);
  font: 11px 'Fredoka One', sans-serif;
  color: #d4ecff;
}

/* ==================== Painel de madeira (igual aos modais) ==================== */
.hangar__deck {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 250px 1fr;
  align-items: start;
  gap: 14px;
  max-height: 46dvh;
  overflow: auto;
  margin-top: -18px;
  padding: 16px 16px max(16px, env(safe-area-inset-bottom));
  border-radius: 22px 22px 0 0;
  border-top: 3px solid #8a531f;
  background: linear-gradient(180deg, #f5cf99 0%, #e8b06c 55%, #d99a55 100%);
  box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.35), inset 0 3px 0 rgba(255, 255, 255, 0.45);
  color: #5a3a1c;
  scrollbar-width: thin;
  scrollbar-color: #a8742f transparent;
  overscroll-behavior: contain;
}

.hangar__block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px 12px;
}
.hangar__heading {
  margin: 0;
  font: 20px/1.1 'Lilita One', sans-serif;
  letter-spacing: 0.3px;
  color: #fff;
  -webkit-text-stroke: 5px #8a531f;
  paint-order: stroke fill;
  text-shadow: 0 2px 0 #8a531f;
}

/* Frota: cartas no estilo das cartas de habilidade */
.hangar__fleet {
  display: flex;
  gap: 10px;
}
.shipcard {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  width: 106px;
  height: 118px;
  padding: 20px 6px 10px;
  overflow: hidden;
  border-radius: 14px;
  font-family: 'Lilita One', sans-serif;
}
.shipcard.is-selected {
  border: 3px solid #173f7d;
  background: linear-gradient(#5fb8ff, #2a74db 85%);
  box-shadow:
    0 4px 0 #173f7d,
    0 0 0 3px #ffd24d,
    inset 0 2px 0 rgba(255, 255, 255, 0.45);
  color: #fff;
  cursor: default;
}
.shipcard__shine {
  position: absolute;
  top: 5px;
  left: 8px;
  width: 16px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  rotate: -30deg;
}
.shipcard__tag {
  position: absolute;
  top: 0;
  left: 50%;
  translate: -50% 0;
  padding: 3px 9px 4px;
  border-radius: 0 0 9px 9px;
  background: linear-gradient(#6ff06a, #2fb52a);
  border: 2px solid #135c10;
  border-top: 0;
  font-size: 10px;
  line-height: 1;
  color: #0e3f0b;
  text-transform: uppercase;
  white-space: nowrap;
}
.shipcard__icon {
  font-size: 38px;
  line-height: 1;
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.25));
}
.shipcard__name {
  font-size: 15px;
  font-weight: 400;
  -webkit-text-stroke: 4px #173f7d;
  paint-order: stroke fill;
}
.shipcard.is-empty {
  background: rgba(138, 83, 31, 0.08);
  outline: 2px dashed #c9964f;
  outline-offset: -2px;
  color: #a8742f;
}
.shipcard.is-empty .shipcard__icon {
  font-size: 28px;
  filter: none;
}
.shipcard.is-empty .shipcard__name {
  -webkit-text-stroke: 0;
}
.shipcard__note {
  font: 10px 'Fredoka One', sans-serif;
  color: #a8742f;
}

/* Pinturas prontas */
.hangar__paints {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.paint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  padding: 7px 4px 6px;
  border-radius: 12px;
  border: 2px solid #d9a766;
  background: #fffaf0;
  box-shadow: 0 3px 0 #c48c4a;
  cursor: pointer;
  transition: translate 0.1s ease, box-shadow 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}
.paint:active {
  translate: 0 2px;
  box-shadow: 0 1px 0 #c48c4a;
}
.paint.is-active {
  border-color: #8a5300;
  background: linear-gradient(#ffe98f, #ffd24d);
  box-shadow: 0 3px 0 #8a5300, inset 0 2px 0 rgba(255, 255, 255, 0.6);
}
.paint__swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid rgba(0, 0, 0, 0.35);
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.35), inset 0 -3px 0 rgba(0, 0, 0, 0.2);
}
.paint__name {
  font: 12px/1 'Lilita One', sans-serif;
  color: #5a3a1c;
}

/* Controles finos */
.hangar__controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
}
.hangar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  font: 15px 'Lilita One', sans-serif;
  color: #6b3d12;
}
.hangar__row + .hangar__row {
  border-top: 2px solid rgba(138, 83, 31, 0.15);
}

.hangar__color {
  appearance: none;
  -webkit-appearance: none;
  flex-shrink: 0;
  width: 48px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
  border: 3px solid #8a531f;
  background: none;
  box-shadow: 0 3px 0 #6b3d12;
  cursor: pointer;
  overflow: hidden;
}
.hangar__color::-webkit-color-swatch-wrapper {
  padding: 0;
}
.hangar__color::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}
.hangar__color::-moz-color-swatch {
  border: none;
  border-radius: 6px;
}

.hangar__segmented {
  display: flex;
  padding: 3px;
  border-radius: 12px;
  background: rgba(107, 61, 18, 0.18);
  box-shadow: inset 0 2px 3px rgba(107, 61, 18, 0.25);
}
.hangar__segmented button {
  min-height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 9px;
  background: none;
  font: 13px 'Lilita One', sans-serif;
  color: #8a531f;
  cursor: pointer;
}
.hangar__segmented button.is-active {
  background: linear-gradient(#ffe98f, #f6b624);
  box-shadow: 0 2px 0 #8a5300, inset 0 2px 0 rgba(255, 255, 255, 0.6);
  color: #fff;
  -webkit-text-stroke: 3px #8a5300;
  paint-order: stroke fill;
}

.hangar__range {
  width: min(180px, 50%);
}

.hangar__saved {
  align-self: center;
  margin: 0;
  padding: 4px 12px 5px;
  border-radius: 999px;
  background: linear-gradient(#6ff06a, #2fb52a);
  border: 2px solid #135c10;
  font: 12px 'Lilita One', sans-serif;
  color: #0e3f0b;
}

/* ==================== Celular ==================== */
@media (max-width: 650px) {
  .hangar__header {
    height: 72px;
  }
  .hangar__owned {
    display: none;
  }
  .hangar__back {
    left: 12px;
    width: 42px;
    height: 42px;
  }
  .hangar__deck {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-height: 52dvh;
    padding: 14px 12px max(14px, env(safe-area-inset-bottom));
  }
  .hangar__name {
    font-size: 28px;
    -webkit-text-stroke-width: 6px;
  }
  .shipcard {
    width: 96px;
    height: 104px;
  }
  .shipcard__icon {
    font-size: 32px;
  }
  .hangar__segmented button {
    padding: 0 7px;
    font-size: 12px;
  }
}

/* ==================== Paisagem baixa: palco à esquerda, painel à direita ==================== */
@media (max-height: 500px) and (orientation: landscape) {
  .hangar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 60px minmax(0, 1fr);
  }
  .hangar__header {
    grid-column: 1 / -1;
    height: 60px;
  }
  .hangar__title {
    margin-top: 8px;
  }
  .hangar__owned {
    display: none;
  }
  .hangar__showcase {
    min-height: 0;
  }
  .hangar__deck {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-height: none;
    margin-top: 0;
    border-radius: 0;
    border-top: 0;
    border-left: 3px solid #8a531f;
    padding: 10px;
  }
  .hangar__hint {
    display: none;
  }
  .hangar__name {
    font-size: 22px;
    -webkit-text-stroke-width: 5px;
  }
}
</style>
