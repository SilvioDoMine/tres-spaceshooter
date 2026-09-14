<script setup lang="ts">
/**
 * MapBoundarySmoke - Componente de fumaça nas bordas do mapa
 *
 * PROPS:
 * - mapWidth: largura do mapa
 * - mapHeight: altura do mapa
 * - color: cor da fumaça em hexadecimal (padrão: '#ffffff')
 *   Exemplos:
 *   - '#33ff33' = Verde radiação
 *   - '#ff3333' = Vermelho (fogo)
 *   - '#3333ff' = Azul (gelo)
 *   - '#ff33ff' = Roxo (tóxico)
 *
 * COMO AJUSTAR A FUMAÇA:
 *
 * 1. Velocidade de animação dos frames:
 *    - MIN_FRAME_SPEED: menor valor = mais rápido
 *    - MAX_FRAME_SPEED: maior valor = mais lento
 *
 * 2. Velocidade de rotação:
 *    - MIN_ROTATION_SPEED: negativo = gira anti-horário
 *    - MAX_ROTATION_SPEED: positivo = gira horário
 *
 * 3. Densidade:
 *    - spacing: menor = mais denso
 *    - layers: mais camadas sobrepostas = mais densidade
 *
 * 4. Profundidade (Campo de fumaça):
 *    - depthLevels: quantos anéis concêntricos de fumaça (1 = só na borda, 3 = 3 anéis)
 *    - depthSpacing: distância entre cada anel (ex: 0.5 = cada anel fica 0.5 unidades mais longe)
 *
 * 5. Variação:
 *    - numMaterials: mais = mais variação (mas menos performance)
 */
import * as THREE from 'three';

const props = withDefaults(defineProps<{
  mapWidth: number;
  mapHeight: number;
  color?: string; // Cor da fumaça em hexadecimal (ex: '#00ff00' para verde radiação)
}>(), {
  color: '#ffffff', // Branco por padrão
});

// Configuração do sprite sheet (30 frames em uma grade)
const framesX = 6;
const framesY = 5;
const totalFrames = 30;

// ============================================
// CONFIGURAÇÕES DE FUMAÇA - AJUSTE AQUI!
// ============================================

// Geometria
const smokeExtension = 1;
const spriteSize = 2.5;
const spacing = 1; // Menor = mais denso
const layers = 3; // Mais camadas = mais densidade (sobreposição no mesmo lugar)

// Profundidade (níveis concêntricos)
const depthLevels = 2; // Quantos níveis de profundidade (anéis concêntricos)
const depthSpacing = 1; // Distância entre cada nível de profundidade

// Velocidade de animação dos frames (segundos por frame)
const MIN_FRAME_SPEED = 0.05; // Mais rápido
const MAX_FRAME_SPEED = 0.075; // Mais lento

// Velocidade de rotação (radianos por segundo)
const MIN_ROTATION_SPEED = -0.1; // Sentido anti-horário
const MAX_ROTATION_SPEED = 0.1;  // Sentido horário

// Quantidade de variações diferentes (mais = mais variação, mas menos performance)
const numMaterials = 12; // Aumentado para ainda mais variação

// ============================================

// Criar textura e materiais (apenas uma vez!)
const textureLoader = new THREE.TextureLoader();
const smokeTexture = textureLoader.load('/images/textures/Smoke30Frames.png');
smokeTexture.wrapS = THREE.ClampToEdgeWrapping;
smokeTexture.wrapT = THREE.ClampToEdgeWrapping;

// Criar materiais compartilhados
const materials = ref<THREE.MeshBasicMaterial[]>([]);
const textures = ref<THREE.Texture[]>([]);

// InstancedMeshes - um para cada material
const instancedMeshes = ref<THREE.InstancedMesh[]>([]);

// Dados de rotação para cada sprite
interface SpriteData {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  rotationSpeed: number; // Velocidade de rotação única
}

const spriteDataByMaterial = ref<SpriteData[][]>([]);

// Velocidades de animação aleatórias para cada material
const materialFrameSpeeds = ref<number[]>([]);

// Inicializar materiais e InstancedMeshes
const initSmoke = () => {
  // Criar materiais
  const mats: THREE.MeshBasicMaterial[] = [];
  const texs: THREE.Texture[] = [];
  const speeds: number[] = [];

  for (let i = 0; i < numMaterials; i++) {
    const tex = smokeTexture.clone();
    tex.needsUpdate = true;
    tex.repeat.set(1 / framesX, 1 / framesY);

    // Offset inicial aleatório para cada material
    const startFrame = Math.floor(Math.random() * totalFrames);
    const frameX = startFrame % framesX;
    const frameY = Math.floor(startFrame / framesX);
    tex.offset.set(frameX / framesX, 1 - (frameY + 1) / framesY);

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      color: new THREE.Color(props.color), // Aplicar cor da prop
    });

    mats.push(mat);
    texs.push(tex);

    // Velocidade de animação aleatória usando as configurações
    const speed = MIN_FRAME_SPEED + Math.random() * (MAX_FRAME_SPEED - MIN_FRAME_SPEED);
    speeds.push(speed);
  }

  materials.value = mats;
  textures.value = texs;
  materialFrameSpeeds.value = speeds;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌫️  SMOKE CONFIGURATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Materials: ${numMaterials} different variations`);
  console.log(`⚡ Frame Speed: ${MIN_FRAME_SPEED}s - ${MAX_FRAME_SPEED}s per frame`);
  console.log(`🔄 Rotation Speed: ${MIN_ROTATION_SPEED} - ${MAX_ROTATION_SPEED} rad/s`);
  console.log(`📐 Spacing: ${spacing} units`);
  console.log(`📚 Layers (overlay): ${layers}`);
  console.log(`🌊 Depth Levels: ${depthLevels} concentric rings`);
  console.log(`📏 Depth Spacing: ${depthSpacing} units between rings`);
  console.log(`📦 Total rings: ${depthLevels} × ${layers} = ${depthLevels * layers} per edge`);
  console.log('');
  console.log('   Visual (top view):');
  const depthLevel = depthLevels as number;
  if (depthLevel === 1) {
    console.log('   ┌─────────┐');
    console.log('   │  🗺️ MAP │ ← single ring of smoke');
    console.log('   └─────────┘');
  } else if (depthLevel === 2) {
    console.log('   ┌───────────┐');
    console.log('   │ ┌─────────┐');
    console.log('   │ │  🗺️ MAP │ ← 2 concentric rings');
    console.log('   │ └─────────┘');
    console.log('   └───────────┘');
  } else {
    console.log('   ┌─────────────┐');
    console.log('   │ ┌───────────┐');
    console.log('   │ │ ┌─────────┐');
    console.log(`   │ │ │  🗺️ MAP │ ← ${depthLevel} concentric rings`);
    console.log('   │ │ └─────────┘');
    console.log('   │ └───────────┘');
    console.log('   └─────────────┘');
  }
  console.log(`🎨 Color: ${props.color}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Gerar posições dos sprites
  const spritesByMaterial: SpriteData[][] = [];
  for (let i = 0; i < numMaterials; i++) {
    spritesByMaterial.push([]);
  }

  // Calcular posições com níveis de profundidade
  for (let depthLevel = 0; depthLevel < depthLevels; depthLevel++) {
    // Cada nível de profundidade se afasta mais do mapa
    const depthOffset = depthLevel * depthSpacing;

    for (let layer = 0; layer < layers; layer++) {
      const yOffset = layer * 0.08;
      const layerOffset = (layer / layers) * spacing * 0.6; // Maior offset entre camadas

      const positions = [
        // Borda superior (se afasta para trás)
        { start: -(props.mapWidth / 2 + smokeExtension + depthOffset),
          end: props.mapWidth / 2 + smokeExtension + depthOffset,
          z: -(props.mapHeight / 2 + smokeExtension / 2 + depthOffset), axis: 'x' },
        // Borda inferior (se afasta para frente)
        { start: -(props.mapWidth / 2 + smokeExtension + depthOffset),
          end: props.mapWidth / 2 + smokeExtension + depthOffset,
          z: props.mapHeight / 2 + smokeExtension / 2 + depthOffset, axis: 'x' },
        // Borda esquerda (se afasta para esquerda)
        { start: -(props.mapHeight / 2 + depthOffset),
          end: props.mapHeight / 2 + depthOffset,
          x: -(props.mapWidth / 2 + smokeExtension / 2 + depthOffset), axis: 'z' },
        // Borda direita (se afasta para direita)
        { start: -(props.mapHeight / 2 + depthOffset),
          end: props.mapHeight / 2 + depthOffset,
          x: props.mapWidth / 2 + smokeExtension / 2 + depthOffset, axis: 'z' },
      ];

      positions.forEach(edge => {
        for (let pos = edge.start + layerOffset; pos <= edge.end; pos += spacing) {
          const materialIndex = Math.floor(Math.random() * numMaterials);

          // Maior variação aleatória para melhor sobreposição
          const randomOffset = (Math.random() - 0.5) * 0.8;
          const x = edge.axis === 'x' ? pos + randomOffset * 0.5 : edge.x! + randomOffset;
          const z = edge.axis === 'z' ? pos + randomOffset * 0.5 : edge.z! + randomOffset;

          // Velocidade de rotação usando as configurações
          const rotSpeed = MIN_ROTATION_SPEED + Math.random() * (MAX_ROTATION_SPEED - MIN_ROTATION_SPEED);

          const material = spritesByMaterial[materialIndex];
          if (!material) continue;

          material.push({
            position: new THREE.Vector3(x, 0.1 + yOffset, z),
            rotation: Math.random() * Math.PI * 2,
            scale: 0.7 + Math.random() * 0.6,
            rotationSpeed: rotSpeed,
          });
        }
      });
    }
  }

  // Armazenar dados dos sprites para animação
  spriteDataByMaterial.value = spritesByMaterial;

  // Estatísticas finais
  const totalSprites = spritesByMaterial.reduce((sum, arr) => sum + arr.length, 0);
  const allRotSpeeds = spritesByMaterial.flat().map(s => s.rotationSpeed);
  console.log(`✅ Generated ${totalSprites} smoke sprites`);
  console.log(`   Rotation range: ${Math.min(...allRotSpeeds).toFixed(2)} to ${Math.max(...allRotSpeeds).toFixed(2)} rad/s`);
  console.log(`   Frame speeds: ${speeds.map(s => s.toFixed(3)).join(', ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Criar InstancedMeshes
  const geometry = new THREE.PlaneGeometry(1, 1);
  const meshes: THREE.InstancedMesh[] = [];

  for (let i = 0; i < numMaterials; i++) {
    const materialSprites = spritesByMaterial[i];
    const material = materials.value[i];
    if (!materialSprites || !material) continue;

    const count = materialSprites.length;
    const mesh = new THREE.InstancedMesh(geometry, material, count);

    // Configurar transformações iniciais
    const matrix = new THREE.Matrix4();
    materialSprites.forEach((sprite, index) => {
      matrix.makeRotationX(-Math.PI / 2);
      matrix.multiply(new THREE.Matrix4().makeRotationZ(sprite.rotation));
      matrix.setPosition(sprite.position);
      const scale = spriteSize * sprite.scale;
      matrix.scale(new THREE.Vector3(scale, scale, 1));
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    meshes.push(mesh);
  }

  instancedMeshes.value = meshes;
};

// Reinicializar quando dimensões mudarem
watch([() => props.mapWidth, () => props.mapHeight], () => {
  initSmoke();
}, { immediate: true });

// Animar texturas
const materialFrames = ref<number[]>([]);
const materialLastFrameTimes = ref<number[]>([]);

const { onBeforeRender } = useGameLoop();
onBeforeRender(({ elapsed, delta }) => {
  // Animar frames das texturas com velocidades aleatórias
  for (let i = 0; i < materials.value.length; i++) {
    const lastTime = materialLastFrameTimes.value[i] ?? 0;
    const frameSpeed = materialFrameSpeeds.value[i];

    if (frameSpeed !== undefined && elapsed - lastTime > frameSpeed) {
      const currentFrame = materialFrames.value[i] ?? 0;
      const nextFrame = (currentFrame + 1) % totalFrames;
      materialFrames.value[i] = nextFrame;
      const frameX = nextFrame % framesX;
      const frameY = Math.floor(nextFrame / framesX);

      const texture = textures.value[i];
      if (texture) {
        texture.offset.set(frameX / framesX, 1 - (frameY + 1) / framesY);
      }
      materialLastFrameTimes.value[i] = elapsed;
    }
  }

  // Atualizar rotação individual de cada sprite
  const matrix = new THREE.Matrix4();
  const rotationMatrix = new THREE.Matrix4();

  spriteDataByMaterial.value.forEach((sprites, materialIndex) => {
    const mesh = instancedMeshes.value[materialIndex];
    if (!mesh) return;

    sprites.forEach((sprite, index) => {
      // Atualizar rotação com base na velocidade única
      sprite.rotation += sprite.rotationSpeed * delta;

      // Reconstruir matriz de transformação com nova rotação
      matrix.makeRotationX(-Math.PI / 2);
      rotationMatrix.makeRotationZ(sprite.rotation);
      matrix.multiply(rotationMatrix);
      matrix.setPosition(sprite.position);
      const scale = spriteSize * sprite.scale;
      matrix.scale(new THREE.Vector3(scale, scale, 1));

      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });
});
</script>

<template>
  <TresGroup>
    <!-- InstancedMeshes para performance otimizada -->
    <primitive
      v-for="(mesh, index) in instancedMeshes"
      :key="`instanced-${index}`"
      :object="mesh"
    />
  </TresGroup>
</template>
