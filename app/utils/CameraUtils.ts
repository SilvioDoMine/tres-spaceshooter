/**
 * CameraUtils - Gerencia a posição da câmera com limites baseados no mapa
 *
 * Implementa o comportamento onde:
 * 1. A câmera segue o jogador (centralizada nele)
 * 2. Quando chega nas bordas do mapa, a câmera para de se mover
 * 3. O jogador pode continuar se movendo nas bordas (se "desprende" da câmera)
 */

export interface MapBounds {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
}

export interface CameraConfig {
  /** Altura da câmera em relação ao chão */
  height: number;
  /** Campo de visão (FOV) da câmera em graus */
  fov: number;
  /** Largura do viewport visível na altura do chão */
  viewportWidth: number;
  /** Altura do viewport visível na altura do chão */
  viewportHeight: number;
}

export class CameraUtils {
  /**
   * Calcula a posição da câmera para seguir o jogador dentro dos limites do mapa
   *
   * @param playerPosition - Posição atual do jogador (x, z)
   * @param mapBounds - Limites do mapa
   * @param cameraConfig - Configuração da câmera
   * @returns Posição calculada da câmera (x, y, z)
   */
  static calculateCameraPosition(
    playerPosition: { x: number; z: number },
    mapBounds: MapBounds,
    cameraConfig: CameraConfig
  ): { x: number; y: number; z: number } {
    // Calcula metade do viewport visível (área que a câmera vê)
    // Usa 2.4 como divisor (igual ao vueshooter) para dar mais margem de movimento
    const halfViewWidth = cameraConfig.viewportWidth / 2.4;
    const halfViewHeight = cameraConfig.viewportHeight / 2.4;

    // Calcular os limites onde a câmera pode estar para não mostrar área fora do mapa
    // A câmera não pode ir além de uma posição onde a borda do viewport mostraria fora do mapa
    const minCameraX = mapBounds.xMin + halfViewWidth;
    const maxCameraX = mapBounds.xMax - halfViewWidth;
    const minCameraZ = mapBounds.zMin + halfViewHeight;
    // Só limitar metade pra cima (Z+), pois o joystick mobile fica na parte de baixo da tela
    const maxCameraZ = mapBounds.zMax - (halfViewHeight / 2);

    // Posição ideal da câmera (centralizada no jogador)
    let cameraX = playerPosition.x;
    let cameraZ = playerPosition.z;

    // Aplicar limites para não mostrar área fora do mapa
    // Se o mapa é menor que o viewport, centraliza no mapa
    if (mapBounds.xMax - mapBounds.xMin <= cameraConfig.viewportWidth) {
      // Mapa menor que viewport - centraliza no centro do mapa
      cameraX = (mapBounds.xMin + mapBounds.xMax) / 2;
    } else {
      // Aplica clamping: mantém a câmera entre os limites
      cameraX = Math.max(minCameraX, Math.min(maxCameraX, cameraX));
    }

    if (mapBounds.zMax - mapBounds.zMin <= cameraConfig.viewportHeight) {
      // Mapa menor que viewport - centraliza no centro do mapa
      cameraZ = (mapBounds.zMin + mapBounds.zMax) / 2;
    } else {
      // Aplica clamping: mantém a câmera entre os limites
      cameraZ = Math.max(minCameraZ, Math.min(maxCameraZ, cameraZ));
    }

    return {
      x: cameraX,
      y: cameraConfig.height,
      z: cameraZ
    };
  }

  /**
   * Calcula a largura do viewport visível no chão baseado na altura e FOV da câmera
   *
   * @param cameraHeight - Altura da câmera
   * @param fov - Campo de visão em graus
   * @param aspect - Aspect ratio da tela (width/height)
   * @returns Largura do viewport no chão
   */
  static calculateViewportWidth(cameraHeight: number, fov: number, aspect: number): number {
    const fovRadians = (fov * Math.PI) / 180;
    const viewportHeight = 2 * cameraHeight * Math.tan(fovRadians / 2);
    return viewportHeight * aspect;
  }

  /**
   * Calcula a altura do viewport visível no chão baseado na altura e FOV da câmera
   *
   * @param cameraHeight - Altura da câmera
   * @param fov - Campo de visão em graus
   * @returns Altura do viewport no chão
   */
  static calculateViewportHeight(cameraHeight: number, fov: number): number {
    const fovRadians = (fov * Math.PI) / 180;
    return 2 * cameraHeight * Math.tan(fovRadians / 2);
  }

  /**
   * Cria uma configuração de câmera baseada nos parâmetros fornecidos
   *
   * @param height - Altura da câmera
   * @param fov - Campo de visão em graus
   * @param aspect - Aspect ratio da tela (width/height) - padrão 16/9
   * @returns Configuração completa da câmera
   */
  static createCameraConfig(
    height: number,
    fov: number,
    aspect: number = 16 / 9
  ): CameraConfig {
    return {
      height,
      fov,
      viewportWidth: this.calculateViewportWidth(height, fov, aspect),
      viewportHeight: this.calculateViewportHeight(height, fov)
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
