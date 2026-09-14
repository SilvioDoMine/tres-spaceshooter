<script setup lang="ts">
import { Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from 'three'
import { BOSS_BUILDERS, type BossModel } from '~/utils/bossModels'
import { disposeModel } from '~/utils/spaceModels'
import { finalBossPhase } from '~/utils/combatPatterns'

// Bosses com peças animadas. Em jogo, fase, carga do ataque, hangar, escudos e investida vêm do inimigo;
// no lab/lobby a fase e a carga podem vir por prop.
const props = withDefaults(defineProps<{
  enemy: any
  baseStats: any
  setVisualMeshRef: Function
  model?: BossModel
  phase?: number
  attackCharge?: number
  speed?: number
}>(), { model: undefined, phase: undefined, attackCharge: undefined, speed: 1 })

const model: BossModel = props.model ?? props.baseStats[props.enemy.type]?.model ?? 'hive'
const { root, parts } = BOSS_BUILDERS[model]()
const size = computed(() => props.baseStats[props.enemy.type]?.size ?? 1)

// Grupo externo: recebe posição e rumo do EnemyManager (o mundo gira a partir dele)
let outer: any = null
function bindOuter(el: any) {
  outer = el
  props.setVisualMeshRef(props.enemy.id)(el)
}

const glow: { material: MeshStandardMaterial; base: number; color: Color }[] = []
root.traverse((object: any) => {
  const material = object.material
  if (material instanceof MeshStandardMaterial && material.emissive.getHex() !== 0) {
    glow.push({ material, base: material.emissiveIntensity, color: material.emissive.clone() })
  }
})

// Linha de aviso da investida da Harpia (fora da escala do modelo, em unidades do mundo)
const telegraph = new Group()
const warningMaterial = new MeshBasicMaterial({ color: '#ff3355', transparent: true, opacity: 0, depthWrite: false })
const warning = new Mesh(new PlaneGeometry(1, 1), warningMaterial)
warning.rotation.x = -Math.PI / 2
telegraph.add(warning)
telegraph.visible = false

const hot = new Color('#ff2a1a')
let time = 0, open = 0, hatch = 0, lastRage = 0

useGameLoop().onBeforeRender(({ delta }) => {
  // Congelado: portas, torretas e escudos param junto com o casco
  const dt = Math.min(delta, .1) * props.speed * (props.enemy.elementState?.freeze ? 0 : 1)
  time += dt
  const enemy = props.enemy
  const charge = Math.max(props.attackCharge ?? enemy.attackCharge ?? 0, enemy.dashCharge ?? 0)
  const phase = props.phase ?? (enemy.maxHealth ? finalBossPhase(enemy) : 1)
  const heading = outer?.rotation.y ?? 0
  const approach = (value: number, target: number, rate: number) => value + (target - value) * Math.min(1, dt * rate)

  glow.forEach(g => { g.material.emissiveIntensity = g.base * (1 + charge * 1.6 + Math.sin(time * 3) * .12) })
  const rage = model === 'harpy' || model === 'colossus' ? (phase - 1) / 2 : 0
  if (rage !== lastRage) {
    glow.forEach(g => g.material.emissive.copy(g.color).lerp(hot, rage * .6))
    lastRage = rage
  }
  parts.engines?.children.forEach((flame: any, i: number) => flame.scale.set(1, .85 + Math.sin(time * 20 + i * 1.7) * .15 + charge * .3, 1))

  if (model === 'hive') {
    // Portas abertas no modo torreta (no lab, fase 3 simula a torreta)
    open = approach(open, enemy.hangarOpen || (props.phase ?? 0) >= 3 ? 1 : 0, 5)
    parts.doors.forEach((door: any) => { door.slide.position.x = door.sign * open * .2 })
    parts.core.position.y = .26 + open * .14
    parts.core.rotation.y += dt * (.6 + open * 2)
    parts.core.scale.setScalar(1 + Math.sin(time * 4) * .05 * (1 + open))
    parts.antennas.forEach((antenna: any, i: number) => { antenna.rotation.z = Math.sin(time * 2 + i * 2) * .08 })
  } else if (model === 'harpy') {
    parts.body.rotation.z = Math.sin(time * 1.3) * .05
    parts.wingGuns.forEach((gun: any) => { gun.rotation.y = gun.userData.side * (.06 + charge * .24) })
    const aiming = enemy.dashState === 'aim' && enemy.dashDirection
    telegraph.visible = Boolean(aiming)
    if (aiming) {
      const length = enemy.dashLength || 14
      // O nariz (-Z) aponta para a direção travada, independente do rumo atual do casco
      telegraph.rotation.y = Math.atan2(-enemy.dashDirection.x, -enemy.dashDirection.z) - heading
      // Largura = hitbox da investida
      warning.scale.set(enemy.dashWidth ?? size.value * .7, length, 1)
      warning.position.set(0, .05, -length / 2)
      warningMaterial.transparent = true
      warningMaterial.opacity = .12 + .38 * (enemy.dashCharge ?? 0)
    }
  } else if (model === 'bastion') {
    // Em jogo o anel segue a rotação do escudo que bloqueia os tiros
    if (typeof enemy.shieldRotation === 'number') parts.shieldRing.rotation.y = enemy.shieldRotation - heading
    else parts.shieldRing.rotation.y += dt * (.5 + phase * .35 + charge * 1.5)
    parts.core.position.y = .62 + Math.sin(time * 1.6) * .05
    parts.core.rotation.x += dt * .7
    parts.core.rotation.y += dt * 1.1
  } else if (model === 'colossus') {
    hatch = approach(hatch, phase >= 3 ? 1 : 0, 3)
    parts.reactorHatch.forEach((half: any) => { half.position.x = half.userData.sign * hatch * .2 })
    parts.reactor.scale.setScalar(.55 + .45 * hatch + Math.sin(time * 6) * .05 * hatch)
    parts.turrets.forEach((turret: any, i: number) => { turret.rotation.y = Math.sin(time * .6 + i * 1.3) * .5 * (1 - charge) })
  }
})

onUnmounted(() => {
  disposeModel(root)
  warning.geometry.dispose()
  warningMaterial.dispose()
})
</script>

<template>
  <TresGroup :ref="bindOuter" :name="`enemy-visual-${enemy.id}`">
    <TresGroup :scale="size">
      <primitive :object="root" />
    </TresGroup>
    <primitive :object="telegraph" />
  </TresGroup>
</template>
