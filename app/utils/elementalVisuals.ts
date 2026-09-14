import { Color, type Object3D } from 'three';

// Tint dos cascos por efeito elemental: brasa sutil no fogo, casco branco-gelo congelado, clarão violeta no raio.
const FIRE = new Color('#ff4a12');
const ICE_BODY = new Color('#dff7ff');
const ICE_GLOW = new Color('#2fb8ff');
const SHOCK = new Color('#b48cff');

export type TintHolder = { materials: any[]; tinted?: boolean };

export function collectMaterials(root: Object3D) {
  const materials = new Set<any>();
  root.traverse((object: any) => {
    if (!object.material) return;
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material: any) => materials.add(material));
  });
  return [...materials];
}

/**
 * Aplica (ou desfaz) o tint do estado elemental. Sem efeito ativo e já restaurado, não toca nos materiais.
 * Luzes próprias do casco (emissivo aceso, animado pelos chefes) só recebem a cor base, nunca o brilho.
 */
export function applyElementalTint(holder: TintHolder, state: any, time: number) {
  const burning = Boolean(state?.burn), frozen = Boolean(state?.freeze), shocked = (state?.shock || 0) > 0;
  const active = burning || frozen || shocked;
  const wasTinted = Boolean(holder.tinted);
  if (!active && !wasTinted) return;
  holder.tinted = active;
  const flicker = .55 + .25 * Math.sin(time * 13) + .2 * Math.sin(time * 29 + 1.3);
  const flash = shocked ? (Math.sin(time * 90) > 0 ? 1 : .35) : 0;
  for (const material of holder.materials) {
    if (!material?.emissive || !material.color) continue;
    // Captura a aparência original ao entrar no efeito (pintura da nave pode ter mudado)
    if (!wasTinted || !material.userData.elementBase) {
      material.userData.elementBase = {
        color: material.color.clone(), emissive: material.emissive.clone(),
        intensity: material.emissiveIntensity, glow: material.emissive.getHex() !== 0,
      };
    }
    const base = material.userData.elementBase;
    material.color.copy(base.color);
    if (frozen) material.color.lerp(ICE_BODY, .72);
    if (base.glow) continue;
    material.emissive.copy(base.emissive);
    material.emissiveIntensity = base.intensity;
    if (!active) continue;
    material.emissiveIntensity = 1;
    if (frozen) material.emissive.lerp(ICE_GLOW, .38);
    if (burning) material.emissive.lerp(FIRE, .16 + .14 * flicker);
    if (shocked) material.emissive.lerp(SHOCK, .75 * flash);
  }
}
