import { watch } from 'vue';
import { useAudio } from '~/composables/useAudio';
import { modalStack } from '~/composables/useModal';
import { UI_HAPTICS } from '~/utils/uiSynth';

const HAPTICS = UI_HAPTICS as Record<string, number | number[]>;

// Microinterações globais da UI: som + vibração ao tocar em qualquer elemento interativo,
// som discreto de hover no desktop e som ao abrir/fechar modais.
// Um elemento pode escolher o som com data-ui-sound="confirm|tab|..." ou silenciar com data-ui-sound="off".
const INTERACTIVE = 'button, a[href], [role="button"], [role="checkbox"], [data-ui-sound], .cursor-pointer';

// Modais com sting próprio (o de recompensas toca a fanfarra) dispensam o som genérico de abertura
const MODALS_WITH_OWN_SOUND = new Set(['rewards-modal']);

function findInteractive(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest<HTMLElement>(INTERACTIVE);
  if (!el) return null;
  if (el.dataset.uiSound === 'off') return null;
  if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return null;
  return el;
}

function soundFor(el: HTMLElement): string {
  if (el.dataset.uiSound) return el.dataset.uiSound;
  if (el.getAttribute('role') === 'checkbox') {
    // Estado antes do clique: se estava desligado, vai ligar
    return el.getAttribute('aria-checked') === 'true' ? 'toggleOff' : 'toggleOn';
  }
  return 'tap';
}

export default defineNuxtPlugin(() => {
  const audio = useAudio();

  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const el = findInteractive(event.target);
    if (!el) return;

    const kind = soundFor(el);
    audio.playUiSound(kind);
    if (event.pointerType !== 'mouse') audio.vibrate(HAPTICS[kind] ?? 8);
  }, { capture: true, passive: true });

  // Hover só em dispositivos com mouse de verdade
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let hovered: HTMLElement | null = null;
  let lastHoverAt = 0;
  document.addEventListener('pointerover', (event) => {
    if (event.pointerType !== 'mouse' || !canHover.matches) return;
    const el = findInteractive(event.target);
    if (el === hovered) return;
    hovered = el;
    if (!el) return;

    const now = performance.now();
    if (now - lastHoverAt < 60) return;
    lastHoverAt = now;
    audio.playUiSound('hover');
  }, { passive: true });

  watch(() => modalStack.value.length, (length, previous) => {
    if (length === previous) return;
    if (length < previous) {
      audio.playUiSound('close');
      return;
    }
    if (MODALS_WITH_OWN_SOUND.has(modalStack.value[length - 1])) return;
    audio.playUiSound('open');
  });
});
