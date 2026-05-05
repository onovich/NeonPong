export function projectPoint(dimensions, config, x, y, z) {
  const clampedZ = Math.max(0, Math.min(1, z));
  const bottomWidth = dimensions.width * config.tableWidthBottom;
  const topWidth = dimensions.width * config.tableWidthTop;
  const currentWidth = bottomWidth + (topWidth - bottomWidth) * clampedZ;
  const bottomY = dimensions.height * config.tableYBottom;
  const topY = dimensions.height * config.tableYTop;
  const baseSy = bottomY + (topY - bottomY) * clampedZ;
  const scale = currentWidth / bottomWidth;
  const sx = dimensions.width / 2 + x * (currentWidth / 2);
  const sy = baseSy - y * dimensions.height * 0.4 * scale;

  return {
    sx,
    sy,
    baseSy,
    scale,
  };
}