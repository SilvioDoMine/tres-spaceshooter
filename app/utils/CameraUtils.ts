/**
 * CameraUtils - Sistema de câmera com limites baseados no mapa
 *
 * Comportamento:
 * 1. Câmera segue o jogador (centralizada)
 * 2. Para de seguir nas bordas do stage
 * 3. Jogador pode continuar andando além da câmera
 * 4. Se o stage cabe na tela, câmera fica centralizada
 * 5. Ajuste automático por plataforma (mobile/desktop)
 */

export interface MapBounds {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
}

export class CameraUtils {
  /**
   * Calcula o viewport real (área visível) baseado na altura e FOV da câmera
   *
   * @param cameraHeight - Altura da câmera
   * @param fov - Campo de visão em graus
   * @param aspect - Aspect ratio da tela (width/height)
   * @returns Tamanho do viewport { width, height }
   */
  static calculateViewportSize(
    cameraHeight: number,
    fov: number,
    aspect: number = 16 / 9
  ): { width: number; height: number } {
    const fovRadians = (fov * Math.PI) / 180;
    const height = 2 * cameraHeight * Math.tan(fovRadians / 2);
    const width = height * aspect;

    return { width, height };
  }

  /**
   * Calcula a posição da câmera para seguir o jogador dentro dos limites do mapa
   *
   * Sistema adaptativo:
   * - Stage pequeno: câmera centralizada no mapa
   * - Stage grande: câmera segue jogador até as bordas
   * - Ajuste automático mobile/desktop para melhor experiência
   *
   * @param playerPosition - Posição atual do jogador (x, z)
   * @param mapBounds - Limites do mapa (stage)
   * @param cameraHeight - Altura da câmera
   * @param fov - Campo de visão da câmera em graus
   * @param aspect - Aspect ratio da tela (width/height)
   * @returns Posição calculada da câmera (x, y, z)
   */
  static calculateCameraPosition(
    playerPosition: { x: number; z: number },
    mapBounds: MapBounds,
    cameraHeight: number,
    fov: number,
    aspect: number = 16 / 9
  ): { x: number; y: number; z: number } {
    const viewport = this.calculateViewportSize(cameraHeight, fov, aspect);

    // Ajuste de margem por plataforma
    // Valores mais altos = câmera para mais próximo da borda exata
    // 1.0 = exatamente na borda, 0.8 = 20% além da borda
    let viewportUsage: number;
    if (aspect < 0.8) {
      viewportUsage = 0.85; // Mobile portrait
    } else if (aspect < 1.2) {
      viewportUsage = 0.9;  // Tablet/Mobile landscape
    } else {
      viewportUsage = 0.95; // Desktop
    }

    const effectiveViewportWidth = viewport.width * viewportUsage;
    const effectiveViewportHeight = viewport.height * viewportUsage;

    const mapWidth = mapBounds.xMax - mapBounds.xMin;
    const mapHeight = mapBounds.zMax - mapBounds.zMin;
    const mapCenterX = (mapBounds.xMin + mapBounds.xMax) / 2;
    const mapCenterZ = (mapBounds.zMin + mapBounds.zMax) / 2;

    // Verifica se o mapa cabe no viewport efetivo
    const mapFitsWidth = mapWidth <= effectiveViewportWidth;
    const mapFitsHeight = mapHeight <= effectiveViewportHeight;

    let cameraX: number;
    let cameraZ: number;

    // Eixo X: centraliza se cabe, senão segue com limites
    if (mapFitsWidth) {
      cameraX = mapCenterX;
    } else {
      const halfViewWidth = effectiveViewportWidth / 2;
      const minCameraX = mapBounds.xMin + halfViewWidth;
      const maxCameraX = mapBounds.xMax - halfViewWidth;
      cameraX = Math.max(minCameraX, Math.min(maxCameraX, playerPosition.x));
    }

    // Eixo Z: centraliza se cabe, senão segue com limites
    if (mapFitsHeight) {
      cameraZ = mapCenterZ;
    } else {
      const halfViewHeight = effectiveViewportHeight / 2;
      const minCameraZ = mapBounds.zMin + halfViewHeight;
      const maxCameraZ = mapBounds.zMax - halfViewHeight;
      cameraZ = Math.max(minCameraZ, Math.min(maxCameraZ, playerPosition.z));
    }

    return {
      x: cameraX,
      y: cameraHeight,
      z: cameraZ
    };
  }

  /**
   * Converte os limites de um stage em MapBounds
   *
   * @param stageWidth - Largura do stage
   * @param stageHeight - Altura do stage
   * @returns MapBounds correspondente
   */
  static stageToMapBounds(stageWidth: number, stageHeight: number): MapBounds {
    const halfWidth = stageWidth / 2;
    const halfHeight = stageHeight / 2;

    return {
      xMin: -halfWidth,
      xMax: halfWidth,
      zMin: -halfHeight,
      zMax: halfHeight
    };
  }
}
