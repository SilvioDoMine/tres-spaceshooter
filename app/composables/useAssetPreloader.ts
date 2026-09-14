import { Cache, FileLoader, ImageLoader } from 'three';
import manifest from 'virtual:asset-manifest';
import { useAudio } from '~/composables/useAudio';

// Com o cache ligado, TextureLoader, GLTFLoader e FontLoader (Text3D) reaproveitam
// o que a tela de loading já baixou, em vez de ir de novo à rede.
Cache.enabled = true;

type OnBytes = (bytes: number) => void;

const progress = ref(0);
const done = ref(false);
let running: Promise<void> | null = null;

export function useAssetPreloader() {
  function start() {
    running ??= run();
    return running;
  }

  return { progress: readonly(progress), done: readonly(done), start };
}

async function run() {
  const audio = useAudio();
  // Progresso ponderado pelo tamanho de cada arquivo (a música pesa bem mais que um ícone)
  const total = manifest.reduce((sum, asset) => sum + Math.max(asset.size, 1), 0) || 1;
  const loaded = new Map<string, number>();
  const report = (url: string, size: number, bytes: number) => {
    loaded.set(url, Math.min(bytes, Math.max(size, 1)));
    let sum = 0;
    loaded.forEach(value => { sum += value; });
    progress.value = sum / total;
  };

  await Promise.all(manifest.map(async ({ url, size }) => {
    try {
      await loadAsset(url, bytes => report(url, size, bytes), audio);
    } catch (error) {
      // Um asset quebrado não pode prender o jogador na tela de loading
      console.warn(`Falha ao pré-carregar ${url}`, error);
    }
    report(url, size, Infinity);
  }));

  // Fontes do CSS (títulos e botões)
  await Promise.all([
    document.fonts?.load('1em "Lilita One"'),
    document.fonts?.load('1em "Fredoka One"'),
  ]).catch(() => {});

  progress.value = 1;
  // Deixa a barra cheia aparecer antes de sumir
  await new Promise(resolve => setTimeout(resolve, 250));
  done.value = true;
}

function loadAsset(url: string, onBytes: OnBytes, audio: ReturnType<typeof useAudio>) {
  const ext = url.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'png': case 'jpg': case 'jpeg': case 'webp': case 'gif': case 'svg':
      return new ImageLoader().loadAsync(url);
    case 'glb': case 'gltf': case 'bin':
      // Mesmo responseType que o GLTFLoader usa, para o cache servir
      return new FileLoader().setResponseType('arraybuffer').loadAsync(url, e => onBytes(e.loaded));
    case 'json':
      return new FileLoader().loadAsync(url, e => onBytes(e.loaded));
    case 'mp3':
      return fetchWithProgress(url, onBytes).then(data => audio.registerMusicData(url, data));
    case 'wav': case 'ogg':
      return fetchWithProgress(url, onBytes).then(data => audio.registerSoundData(url, data));
    default:
      return fetchWithProgress(url, onBytes);
  }
}

async function fetchWithProgress(url: string, onBytes: OnBytes) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onBytes(buffer.byteLength);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done: finished, value } = await reader.read();
    if (finished) break;
    chunks.push(value);
    received += value.byteLength;
    onBytes(received);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}
