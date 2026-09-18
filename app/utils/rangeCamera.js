/** Câmera vertical: enquadra o círculo inteiro, inclusive com look-ahead e tremor. */
export function rangeCameraHeight(range, aspect, offsetX = 0, offsetZ = 0, fov = 25) {
  const portrait = aspect < 1;
  // Em retrato, o alcance ocupa quase toda a largura útil.
  const radius = Math.max(0, range) + (portrait ? .75 : 2);
  const halfHeight = Math.max(radius + Math.abs(offsetZ), (radius + Math.abs(offsetX)) / Math.max(.1, aspect));
  return Math.max(52, halfHeight / ((portrait ? .99 : .9) * Math.tan(fov * Math.PI / 360)));
}

export function targetInsideView(position, view) {
  if (!view || !(view.width > 0 && view.height > 0)) return false;
  return Math.abs(position.x - view.x) < view.width / 2 - .6
    && Math.abs(position.z - view.z) < view.height / 2 - .6;
}
