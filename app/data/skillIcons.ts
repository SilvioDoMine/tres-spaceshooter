// Ícones SVG das habilidades (desenhados em components/skill/Icon.vue).
// O campo `icon` de uma habilidade aceita uma dessas chaves (padrão) ou qualquer outro texto, que é
// mostrado como emoji dentro da mesma caixa quadrada.
export const SKILL_ICON_KEYS = [
  'coins',
  'damage-up',
  'health-up',
  'datapad',
  'wrench',
  'thrusters',
  'ricochet',
  'spread-shot',
  'back-shot',
  'pierce',
  'radar',
  'crosshair',
  'rotary-cannon',
  'adrenaline',
  'alien-skull',
  'evasion',
  'siphon',
  'front-shot',
  'fire-shot',
  'ice-crystal',
  'lightning',
  'burst',
  'shotgun',
] as const;

export type SkillIconKey = (typeof SKILL_ICON_KEYS)[number];

export const isSkillIconKey = (icon: string): icon is SkillIconKey =>
  (SKILL_ICON_KEYS as readonly string[]).includes(icon);
