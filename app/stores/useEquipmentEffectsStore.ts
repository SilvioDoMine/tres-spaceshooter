import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { emptyEquipmentEffects, type EquipmentEffects } from '~/utils/equipment';
import { useCurrentRunStore } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useEnemyManager } from '~/composables/useEnemyManager';
import { emitImpact } from '~/utils/combatEffects';

type Point = { x: number; z: number };
type TrailPoint = Point & { id: number; ttl: number; maxTtl: number; width: number };

export const useEquipmentEffectsStore = defineStore('equipmentEffects', () => {
  const effects = shallowRef<EquipmentEffects>(emptyEquipmentEffects());
  const orbPositions = shallowRef<Point[]>([]);
  const trail = shallowRef<TrailPoint[]>([]);
  const flare = shallowRef<(Point & { ttl: number; maxTtl: number }) | null>(null);
  const feedback = shallowRef<any[]>([]);
  const regenerating = ref(false);
  let feedbackSerial=0;
  function signal(kind:string, from:Point, to?:Point) { feedback.value=[...feedback.value.slice(-23),{id:++feedbackSerial,kind,from:{...from},to:to?{...to}:null,ttl:.55}]; }
  const attackSpeedBuffTime = ref(0);
  const shieldCooldown = ref(0);
  let shotCounter = 0, orbitTime = 0, timeSinceDamage = 99, trailSerial = 0;
  let lastTrailPosition: Point | null = null;
  let flareThresholds = [0.7, 0.4, 0.1];
  const orbHitTimers = new Map<string, number>();
  const trailHitTimers = new Map<string, number>();

  function initialize(next: EquipmentEffects) {
    feedback.value=[];regenerating.value=false;
    effects.value = { ...emptyEquipmentEffects(), ...next };
    shotCounter = 0; orbitTime = 0; timeSinceDamage = 99; trailSerial = 0;
    attackSpeedBuffTime.value = 0; shieldCooldown.value = 0;
    lastTrailPosition = null; flareThresholds = [0.7, 0.4, 0.1];
    orbHitTimers.clear(); trailHitTimers.clear();
    orbPositions.value = []; trail.value = []; flare.value = null;
  }
  function cleanup() { initialize(emptyEquipmentEffects()); }

  function prepareVolley(rng = Math.random) {
    shotCounter++;
    const burst = effects.value.plasmaEvery > 0 && shotCounter % effects.value.plasmaEvery === 0;
    return {
      burst,
      damageMultiplier: burst ? effects.value.plasmaMultiplier : 1,
      aoeRadius: burst ? effects.value.plasmaRadius : 0,
      echo: effects.value.quantumEchoChance > 0 && rng() < effects.value.quantumEchoChance,
      echoCanCrit: effects.value.quantumEchoCanCrit,
      extraHits: effects.value.ionExtraHits,
      extraBounces: effects.value.ionBounces,
    };
  }
  function onDodge() {
    if (effects.value.dodgeAttackSpeedPercent > 0) attackSpeedBuffTime.value = effects.value.dodgeAttackSpeedDuration;
  }
  function effectiveShotCooldown(base: number) {
    const buff = attackSpeedBuffTime.value > 0 ? effects.value.dodgeAttackSpeedPercent : 0;
    return base / (1 + buff / 100);
  }
  function blockIncoming(source: 'attack' | 'collision' | 'environment') {
    if (source === 'environment' || effects.value.aegisCooldown <= 0 || shieldCooldown.value > 0) return false;
    shieldCooldown.value = effects.value.aegisCooldown;
    signal('shield',useCurrentRunStore().getPlayerPosition());
    return true;
  }

  function onPlayerDamaged(previousHealth: number, currentHealth: number, source: string, attackerId?: string) {
    timeSinceDamage = 0;
    const run = useCurrentRunStore();
    const previousFraction = previousHealth / Math.max(1, run.maxHealth);
    const currentFraction = currentHealth / Math.max(1, run.maxHealth);
    const crossed = flareThresholds.filter(threshold => previousFraction > threshold && currentFraction <= threshold);
    if (crossed.length && effects.value.solarFlareStun !== 0) {
      flareThresholds = flareThresholds.filter(threshold => !crossed.includes(threshold));
      const player = run.getPlayerPosition();
      for (const enemy of useEnemyManager().activeEnemies.value) {
        if (enemy.state !== 'active') continue;
        const dx = enemy.position.x - player.x, dz = enemy.position.z - player.z;
        const distance = Math.hypot(dx, dz);
        if (distance > 7 || distance < .001) continue;
        enemy.position.x += dx / distance * 3.5;
        enemy.position.z += dz / distance * 3.5;
        if (effects.value.solarFlareStun > 0) enemy.stunTimer = Math.max(enemy.stunTimer || 0, effects.value.solarFlareStun);
      }
      flare.value = { x: player.x, z: player.z, ttl: .65, maxTtl: .65 };
      emitImpact(player.x, player.z, false, 'hit');
    }
    if (source === 'attack' && attackerId && effects.value.prismReflectPercent > 0) {
      const target=useEnemyManager().activeEnemies.value.find(e=>e.id===attackerId);
      if(target)signal('reflect',run.getPlayerPosition(),target.position);
      useEnemyManager().takeDamage(attackerId, (previousHealth - currentHealth) * effects.value.prismReflectPercent / 100, 'reflect');
    }
  }

  function criticalBonusFor(enemyId: string) {
    return useEnemyManager().activeEnemies.value.some(enemy => enemy.id === enemyId && enemy.equipmentMarked)
      ? effects.value.lockOnCriticalBonus : 0;
  }
  function distanceToPlayer(enemy: any) {
    const player = useCurrentRunStore().getPlayerPosition();
    return Math.hypot(enemy.position.x - player.x, enemy.position.z - player.z);
  }
  function damageMultiplierFor(enemy: any) {
    return effects.value.vortexDamagePercent > 0 && distanceToPlayer(enemy) <= effects.value.vortexRadius
      ? 1 + effects.value.vortexDamagePercent / 100 : 1;
  }
  function enemyTimeScale(enemy: any) {
    return effects.value.vortexSlowPercent > 0 && distanceToPlayer(enemy) <= effects.value.vortexRadius
      ? 1 - effects.value.vortexSlowPercent / 100 : 1;
  }

  function update(delta: number) {
    const run = useCurrentRunStore(), stats = usePlayerStats(), manager = useEnemyManager();
    feedback.value=feedback.value.map(f=>({...f,ttl:f.ttl-delta})).filter(f=>f.ttl>0);
    for(const enemy of manager.activeEnemies.value){const impulse=enemy.solarImpulse;if(impulse){const step=Math.min(delta,impulse.remaining)/.4;enemy.position.x+=impulse.x*step;enemy.position.z+=impulse.z*step;impulse.remaining-=delta;if(impulse.remaining<=0)enemy.solarImpulse=null;}}
    attackSpeedBuffTime.value = Math.max(0, attackSpeedBuffTime.value - delta);
    shieldCooldown.value = Math.max(0, shieldCooldown.value - delta);
    timeSinceDamage += delta; orbitTime += delta;
    for (const [id, value] of orbHitTimers) value <= delta ? orbHitTimers.delete(id) : orbHitTimers.set(id, value - delta);
    for (const [id, value] of trailHitTimers) value <= delta ? trailHitTimers.delete(id) : trailHitTimers.set(id, value - delta);
    if (flare.value) {
      flare.value = { ...flare.value, ttl: flare.value.ttl - delta };
      if (flare.value.ttl <= 0) flare.value = null;
    }
    if (effects.value.fusionRegenPercent > 0 && run.currentHealth < run.maxHealth
      && (effects.value.fusionRegenInCombat || timeSinceDamage >= 4)) {
      run.healPlayer(run.maxHealth * effects.value.fusionRegenPercent / 100 * delta, false);
    }

    const player = run.getPlayerPosition();
    orbPositions.value = Array.from({ length: effects.value.nebulaOrbCount }, (_, i) => {
      const angle = orbitTime * 2.2 + i * Math.PI * 2 / effects.value.nebulaOrbCount;
      return { x: player.x + Math.cos(angle) * 2.15, z: player.z + Math.sin(angle) * 2.15 };
    });
    if (orbPositions.value.length) for (const enemy of manager.activeEnemies.value) {
      if (enemy.state !== 'active' || orbHitTimers.has(enemy.id)) continue;
      if (orbPositions.value.some(orb => Math.hypot(orb.x - enemy.position.x, orb.z - enemy.position.z) <= .55 + enemy.size * .45)) {
        manager.takeDamage(enemy.id, stats.damage * effects.value.nebulaOrbDamageMultiplier, 'equipment');
        orbHitTimers.set(enemy.id, .45);
      }
    }

    if (effects.value.cometTrailWidth > 0 && run.isPlaying) {
      const move = run.getMoveVector();
      const moving = Math.hypot(move.x, move.z) > .05;
      if (moving && (!lastTrailPosition || Math.hypot(player.x - lastTrailPosition.x, player.z - lastTrailPosition.z) >= .55)) {
        const point = { id: ++trailSerial, x: player.x+Math.sin(run.getPlayerRotation().y)*.65, z: player.z+Math.cos(run.getPlayerRotation().y)*.65, ttl: 3.5, maxTtl: 3.5, width: effects.value.cometTrailWidth };
        trail.value = [...trail.value.slice(-63), point];
        lastTrailPosition = { x: player.x, z: player.z };
      } else if (!moving) lastTrailPosition = null;
    }
    trail.value = trail.value.map(point => ({ ...point, ttl: point.ttl - delta })).filter(point => point.ttl > 0);
    if (trail.value.length) for (const enemy of manager.activeEnemies.value) {
      if (enemy.state !== 'active' || trailHitTimers.has(enemy.id)) continue;
      if (trail.value.some(point => Math.hypot(point.x - enemy.position.x, point.z - enemy.position.z) <= point.width * Math.max(0,point.ttl/point.maxTtl) + enemy.size * .35)) {
        manager.takeDamage(enemy.id, stats.damage * effects.value.cometTrailDamageMultiplier, 'equipment');
        trailHitTimers.set(enemy.id, .5);
      }
    }

    const candidates = manager.activeEnemies.value.filter(enemy => enemy.state === 'active')
      .sort((a, b) => Math.hypot(a.position.x - player.x, a.position.z - player.z) - Math.hypot(b.position.x - player.x, b.position.z - player.z));
    const marked = new Set(candidates.slice(0, effects.value.lockOnCount).map(enemy => enemy.id));
    for (const enemy of manager.activeEnemies.value) {
      const next = marked.has(enemy.id);
      if (enemy.equipmentMarked !== next) enemy.equipmentMarked = next;
    }
  }

  return {
    feedback, regenerating, effects, orbPositions, trail, flare, attackSpeedBuffTime, shieldCooldown,
    initialize, cleanup, update, prepareVolley, onDodge, effectiveShotCooldown,
    blockIncoming, onPlayerDamaged, criticalBonusFor, damageMultiplierFor, enemyTimeScale,
  };
});
