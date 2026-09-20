<script setup lang="ts">
import { shallowRef } from 'vue';
import { useCurrentRunStore, PlayerBaseStats } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';
import type { TresInstance } from '@tresjs/core';
import * as THREE from 'three';
import { rangeCameraHeight } from '~/utils/rangeCamera';
import { DILATION_CONFIG } from '~/utils/spatialDilation';
import { applyElementalTint, collectMaterials } from '~/utils/elementalVisuals';
// Suavização da pilotagem. Para desfazer, veja o cabeçalho de ~/utils/shipHandling.
import { currentHeading, bankForTurn, resetBank } from '~/utils/shipHandling';
const dilation=useSpatialDilation().state;
const reducedMotion=useState('spatial-reduced-motion',()=>false);
const cameraShake=shallowRef({x:0,z:0});let stressTime=0;
const hyperdrivePunch=useState('hyperdrive-punch',()=>0);

// Interface para o Stage
interface Stage {
  width: number;
  height: number;
  [key: string]: any;
}

  // | Efeito desejado                           | Altura | FOV   |
  // |-------------------------------------------|--------|-------|
  // | Mais "plano" (quase ortográfico)          | 70-100 | 15-20 |
  // | Balanceado (recomendo)                    | 40-60  | 20-30 |
  // | Mais "cinematográfico" (mais perspectiva) | 20-30  | 40-50 |

// Opcional: Para carregar um modelo 3D GLTF (assumindo que você o tem)
// import { TresLeches } from '@tresjs/leches';
// import { useGLTF } from '@tresjs/cientos';

const currentRun = useCurrentRunStore();
const playerStats = usePlayerStats();

// Posição inicial (reativa - só dispara quando componente monta)
const initialPosition = currentRun.getPlayerPosition();

/**
 * ✅ OTIMIZAÇÃO: Template Ref para acesso direto ao mesh Three.js
 * Elimina completamente o overhead reativo em loops de 60 FPS
 */
const playerMeshRef = shallowRef<TresInstance | null>(null);
const hpMeshRef = shallowRef<TresInstance | null>(null);
const rangeCircleRef = shallowRef<TresInstance | null>(null);
const currentPosition = shallowRef({ x: initialPosition.x, y: initialPosition.y, z: initialPosition.z });
// A mira lógica encaixa no alvo ao disparar; o modelo segue esse giro de forma suave
const VISUAL_TURN_RATE = 28;
let visualYaw: number | null = null;
// Tint elemental da nave (materiais coletados só enquanto há efeito, o modelo carrega assíncrono)
const elementTint = { materials: [] as any[], tinted: false };
let elementTime = 0;

// ==================== CONFIGURAÇÃO DA CÂMERA ====================
const CAMERA_HEIGHT = 52;
const CAMERA_FOV = 25;
const { sizes } = useTresContext();
const viewportWidth = ref(1280), viewportHeight = ref(720);
function resizeViewport() { viewportWidth.value = window.innerWidth; viewportHeight.value = window.innerHeight; }
onMounted(() => { resizeViewport(); window.addEventListener('resize', resizeViewport); });
onUnmounted(() => window.removeEventListener('resize', resizeViewport));

// Posição calculada da câmera (atualizada a cada frame)
const cameraPosition = shallowRef({ x: initialPosition.x, y: CAMERA_HEIGHT, z: initialPosition.z });
let previousRange = -1, previousAspect = -1;
watch(() => currentRun.currentStage, () => {
  const p = currentRun.getPlayerPosition();
  cameraPosition.value = { x: p.x, y: cameraPosition.value.y, z: p.z };
});

// Opcional: Se você estiver usando um modelo GLTF
// const { nodes, materials } = await useGLTF('/models/player.gltf', { draco: true });

// Círculo mostrando o range de tiro do jogador
const rangeCircleGeometry = new THREE.BufferGeometry();
const rangeRadius = projectilesType.player.range;
const segments = 64; // Mais segmentos = círculo mais suave
const circleVertices: number[] = [];

for (let i = 0; i <= segments; i++) {
  const theta = (i / segments) * Math.PI * 2;
  circleVertices.push(
    Math.cos(theta) * rangeRadius, // x
    0, // y (no plano XZ)
    Math.sin(theta) * rangeRadius  // z
  );
}

rangeCircleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(new Float32Array(circleVertices), 3)
);

const rangeMaterial = new THREE.LineBasicMaterial({ color: 0x48b5ce, opacity: 0.12, transparent: true });
const rangeLine = new THREE.Line(rangeCircleGeometry, rangeMaterial);
onUnmounted(() => { rangeCircleGeometry.dispose(); rangeMaterial.dispose(); });

// ==================== GAME LOOP (60 FPS) ====================
/**
 * Loop principal de atualização do jogador
 * ✅ Otimizado: Mutação direta sem overhead reativo
 */
const { onBeforeRender } = useGameLoop();
const flightView = useState("flight-view", () => ({ x: 0, z: 0, width: 30, height: 23 }));
onBeforeRender(({ delta }) => {
  if (!playerMeshRef.value || !hpMeshRef.value || !rangeCircleRef.value) return;

  const position = currentRun.getPlayerPosition();
  const rotation = currentRun.getPlayerRotation();

  // Atualiza posição e rotação do jogador
  playerMeshRef.value.position.set(position.x, position.y, position.z);
  if (visualYaw === null || !currentRun.isPlaying) visualYaw = rotation.y;
  let yawDiff = rotation.y - visualYaw;
  while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
  while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;
  const yawStep = yawDiff * (1 - Math.exp(-Math.min(delta, .1) * VISUAL_TURN_RATE));
  visualYaw += yawStep;
  // Inclinação para dentro da curva: o casco reto é o que dá a sensação de andar de lado,
  // ainda mais no corrido do portal. Só rolagem do modelo, nada de física.
  if (!currentRun.isPlaying) resetBank();
  const bank = bankForTurn(yawStep / Math.max(delta, .001), Math.min(delta, .1));
  playerMeshRef.value.rotation.set(rotation.x, visualYaw, rotation.z + bank);
  // Imune a colisão: a nave pisca enquanto dura o i-frame
  const collisionGrace = currentRun.getCollisionGrace();
  playerMeshRef.value.visible = !(collisionGrace > 0 && currentRun.currentHealth > 0 && Math.floor(collisionGrace * 10) % 2 === 1);
  elementTime += Math.min(delta, .1);
  const elements = currentRun.getPlayerElements();
  if (elements.burn || elements.freeze || elements.shock > 0 || elementTint.tinted) elementTint.materials = collectMaterials(playerMeshRef.value as any);
  applyElementalTint(elementTint, elements, elementTime);
  if(currentRun.isPlaying)stressTime+=Math.min(delta,.1);
  const stress=reducedMotion.value?0:dilation.value.shake;
  playerMeshRef.value.rotation.z+=Math.sin(stressTime*29)*stress*DILATION_CONFIG.shipShake;
  cameraShake.value={x:Math.sin(stressTime*23)*stress*DILATION_CONFIG.cameraShake,z:Math.sin(stressTime*19)*stress*DILATION_CONFIG.cameraShake};
  // Tranco curto do estrondo da hiper velocidade
  const boom=reducedMotion.value?0:hyperdrivePunch.value**2*.22;
  if(boom>0){cameraShake.value={x:cameraShake.value.x+Math.sin(stressTime*71)*boom,z:cameraShake.value.z+Math.cos(stressTime*57)*boom};}

  // Atualiza barra de HP
  hpMeshRef.value.position.set(position.x, position.y + 2, position.z);

  // Atualiza círculo de range
  rangeCircleRef.value.position.set(position.x, position.y + 0.1, position.z);
  rangeCircleRef.value.scale.setScalar(playerStats.getRangeMultiplier);

  currentPosition.value = { x: position.x, y: position.y, z: position.z };

  // A bounded look-ahead gives motion at the invisible edge without drifting indefinitely.
  // Rumo real (curvo), não o comando cru das teclas: senão a antecipação da câmera dá o tranco de
  // 45 graus enquanto a nave ainda está fazendo a curva. Ver ~/utils/shipHandling para desfazer.
  const move = currentHeading(currentRun.getMoveVector());
  // Freeze the camera exactly where pause began, including unfinished easing.
  // Viewport dimensions below still update if the paused window is resized.
  const blend = currentRun.isPlaying ? 1 - Math.exp(-Math.min(delta, .1) * 3) : 0;
  const target = { x: position.x + move.x * 2.6, z: position.z + move.z * 2.6 };
  cameraPosition.value = {
    x: cameraPosition.value.x + (target.x - cameraPosition.value.x) * blend,
    y: cameraPosition.value.y,
    z: cameraPosition.value.z + (target.z - cameraPosition.value.z) * blend,
  };
  const aspect = (sizes.width.value || viewportWidth.value) / Math.max(1, sizes.height.value || viewportHeight.value);
  const range = projectilesType.player.range * playerStats.getRangeMultiplier;
  // Pausa mantém posição e zoom, salvo alteração real de viewport ou alcance.
  if (currentRun.isPlaying || aspect !== previousAspect || range !== previousRange) {
    const required = rangeCameraHeight(range, aspect,
      Math.max(aspect < 1 ? 0 : 2.6, Math.abs(position.x - cameraPosition.value.x - cameraShake.value.x)),
      Math.max(aspect < 1 ? 0 : 2.6, Math.abs(position.z - cameraPosition.value.z - cameraShake.value.z)), CAMERA_FOV);
    // Abrir imediatamente garante alcance visível; fechar suavemente evita pulsação.
    cameraPosition.value.y = required >= cameraPosition.value.y ? required
      : cameraPosition.value.y + (required - cameraPosition.value.y) * blend;
    previousRange = range; previousAspect = aspect;
  }
  const height = 2 * cameraPosition.value.y * Math.tan(CAMERA_FOV * Math.PI / 360);
  flightView.value = { x: cameraPosition.value.x + cameraShake.value.x,
    z: cameraPosition.value.z + cameraShake.value.z, height, width: height * aspect };
});
</script>

<template>
  <!--
    ✅ Template ref conecta ao mesh Three.js
    Posição inicial é setada uma vez, depois atualizada via ref
  -->
  <TresGroup ref="playerMeshRef"
    name="PlayerCharacter"
  >
    <GameKestrelShip gameplay /></TresGroup>
  <TresMesh
    ref="hpMeshRef"
    name="PlayerHPIndicator"
  >
    <TresMeshStandardMaterial  :visible="false" color="pink" />
    <TresBoxGeometry :args="[1, 1, 1]" />

    <!-- HealthBar (só mostra quando ativo) -->
    <GameHealthBar
      v-if="true"
      :current-health="currentRun.currentHealth"
      :max-health="currentRun.maxHealth"
      :width="1.5"
      :height="0.21"
      :position="[0, -5, -1.2]"
      :showHp="true"
      :segment-hp="50"
    />

    <!-- Combat text -->
    <GameCombatText
      :position="[0, -5, -1.75]"
      :entity-id="PlayerBaseStats.id"
    />
  </TresMesh>

  <!-- Círculo mostrando o range de tiro -->
  <primitive
    ref="rangeCircleRef"
    :object="rangeLine"
    name="RangeCircle"
  />

  <TresPerspectiveCamera
    :position="[cameraPosition.x+cameraShake.x, cameraPosition.y, cameraPosition.z+cameraShake.z]"
    :look-at="[cameraPosition.x+cameraShake.x, 0, cameraPosition.z+cameraShake.z]"
    :fov="CAMERA_FOV"
    name="PlayerCamera"
  />
</template>
