// Baú 3D procedural estilo cartoon (Archero 2): corpo chanfrado, faixas metálicas, tampa com dobradiça
// e fecho com gema. Os materiais ganham um contorno de luz (fresnel) para o visual "toon" brilhante.
import {
  Color,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  MeshBasicMaterial,
  Shape,
  type BufferGeometry,
  type Material,
} from 'three';
import type { ChestTheme } from '../data/shop';

/** Caixa com cantos arredondados (extrusão com bisel), centralizada na origem */
function roundedBox(width: number, height: number, depth: number, radius: number) {
  const r = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001, depth / 2 - 0.001);
  const w = width - 2 * r;
  const h = height - 2 * r;
  const shape = new Shape();
  const corner = Math.min(r, w / 2, h / 2) * 0.6;
  shape.moveTo(-w / 2 + corner, -h / 2);
  shape.lineTo(w / 2 - corner, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + corner);
  shape.lineTo(w / 2, h / 2 - corner);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - corner, h / 2);
  shape.lineTo(-w / 2 + corner, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - corner);
  shape.lineTo(-w / 2, -h / 2 + corner);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + corner, -h / 2);

  const geometry = new ExtrudeGeometry(shape, {
    depth: Math.max(0.001, depth - 2 * r),
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: 3,
    curveSegments: 6,
  });
  geometry.center();
  return geometry;
}

export interface RimMaterial extends MeshStandardMaterial {
  userData: { rim: { value: number } };
}

/** MeshStandardMaterial + brilho nas bordas voltadas para fora da câmera */
function rimMaterial(color: string, rimColor: string, rimStrength: number, extra: Partial<MeshStandardMaterial> = {}) {
  const material = new MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.08, ...extra }) as RimMaterial;
  const rim = { value: rimStrength };
  material.userData.rim = rim;
  material.onBeforeCompile = shader => {
    shader.uniforms.uRimColor = { value: new Color(rimColor) };
    shader.uniforms.uRimStrength = rim;
    shader.fragmentShader = `uniform vec3 uRimColor;\nuniform float uRimStrength;\n${shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `float rimFactor = 1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
      gl_FragColor.rgb += uRimColor * pow(rimFactor, 2.6) * uRimStrength;
      #include <dithering_fragment>`,
    )}`;
  };
  return material;
}

export interface ChestModel {
  root: Group;
  /** Grupo que sobe/treme/achata (pivô na base) */
  body: Group;
  /** Pivô da tampa na dobradiça de trás: girar em X negativo abre */
  lid: Group;
  gem: MeshStandardMaterial;
  rims: RimMaterial[];
  /** Altura da boca do baú (onde nasce a luz) */
  mouthY: number;
  depth: number;
  setLid(open: number): void;
  setGlow(gem: number, rim: number): void;
  dispose(): void;
}

export function buildChestModel(theme: ChestTheme): ChestModel {
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const track = <G extends BufferGeometry>(geometry: G) => (geometries.push(geometry), geometry);
  const trackMat = <M extends Material>(material: M) => (materials.push(material), material);

  const WIDTH = 1.7;
  const HEIGHT = 0.95;
  const DEPTH = 1.15;

  const bodyMat = trackMat(rimMaterial(theme.body, '#ffffff', 0.55));
  const trimMat = trackMat(rimMaterial(theme.trim, '#fff2d0', 0.4));
  const metalMat = trackMat(rimMaterial(theme.metal, '#ffffff', 0.7, { metalness: 0.45, roughness: 0.3 }));
  const baseMat = trackMat(rimMaterial(new Color(theme.metal).multiplyScalar(0.7).getStyle(), '#ffffff', 0.35, { metalness: 0.4, roughness: 0.4 }));
  const gemMat = trackMat(
    new MeshStandardMaterial({
      color: theme.gem,
      emissive: new Color(theme.gem),
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.2,
      flatShading: true,
    }),
  );
  const cavityMat = trackMat(new MeshBasicMaterial({ color: new Color(theme.body).multiplyScalar(0.18) }));

  const mesh = (geometry: BufferGeometry, material: Material, x = 0, y = 0, z = 0) => {
    const m = new Mesh(geometry, material);
    m.position.set(x, y, z);
    return m;
  };

  const root = new Group();
  const body = new Group();
  root.add(body);

  // Base, corpo e painel frontal
  body.add(mesh(track(roundedBox(WIDTH + 0.12, 0.14, DEPTH + 0.1, 0.05)), baseMat, 0, 0.07, 0));
  body.add(mesh(track(roundedBox(WIDTH, HEIGHT, DEPTH, 0.09)), bodyMat, 0, 0.1 + HEIGHT / 2 - 0.05, 0));
  body.add(mesh(track(roundedBox(1.02, 0.56, 0.1, 0.04)), trimMat, 0, 0.44, DEPTH / 2 + 0.02));

  // Faixas metálicas verticais
  const band = track(roundedBox(0.17, HEIGHT + 0.04, DEPTH + 0.07, 0.05));
  body.add(mesh(band, metalMat, -0.62, 0.1 + HEIGHT / 2 - 0.05, 0));
  body.add(mesh(band, metalMat, 0.62, 0.1 + HEIGHT / 2 - 0.05, 0));

  const mouthY = 0.1 + HEIGHT - 0.05;

  // Fundo escuro da boca (aparece quando a tampa abre)
  const cavity = mesh(track(new PlaneGeometry(WIDTH - 0.24, DEPTH - 0.24)), cavityMat, 0, mouthY + 0.005, 0);
  cavity.rotation.x = -Math.PI / 2;
  body.add(cavity);

  // Tampa com pivô na dobradiça de trás
  const lid = new Group();
  lid.position.set(0, mouthY, -DEPTH / 2);
  body.add(lid);
  const LID_H = 0.42;
  lid.add(mesh(track(roundedBox(WIDTH + 0.06, LID_H, DEPTH + 0.06, 0.1)), bodyMat, 0, LID_H / 2, DEPTH / 2));
  lid.add(mesh(track(roundedBox(1.2, 0.08, 0.7, 0.03)), trimMat, 0, LID_H + 0.02, DEPTH / 2));
  const lidBand = track(roundedBox(0.18, LID_H + 0.05, DEPTH + 0.12, 0.05));
  lid.add(mesh(lidBand, metalMat, -0.62, LID_H / 2, DEPTH / 2));
  lid.add(mesh(lidBand, metalMat, 0.62, LID_H / 2, DEPTH / 2));
  // Aba do fecho pendurada na frente da tampa
  lid.add(mesh(track(roundedBox(0.34, 0.22, 0.08, 0.03)), metalMat, 0, 0.02, DEPTH + 0.06));

  // Fecho com gema facetada (losango de frente)
  body.add(mesh(track(roundedBox(0.52, 0.56, 0.12, 0.05)), metalMat, 0, 0.72, DEPTH / 2 + 0.08));
  const gem = mesh(track(new OctahedronGeometry(0.19, 0)), gemMat, 0, 0.72, DEPTH / 2 + 0.16);
  gem.scale.set(1, 1.1, 0.55);
  body.add(gem);

  const rims = [bodyMat, trimMat, metalMat, baseMat];

  return {
    root,
    body,
    lid,
    gem: gemMat,
    rims,
    mouthY,
    depth: DEPTH,
    setLid(open) {
      lid.rotation.x = -open * 1.95;
    },
    setGlow(gemGlow, rim) {
      gemMat.emissiveIntensity = 0.3 + gemGlow * 1.6;
      for (const material of rims) material.userData.rim.value = rim;
    },
    dispose() {
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    },
  };
}
