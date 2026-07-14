export function extractScreenSizeFromModel(modele) {
  if (!modele) return null;
  const match = modele.match(/(\d{2})/);
  if (!match) return null;
  const size = parseInt(match[1], 10);
  if (size < 10 || size > 55) return null; // garde-fou : plage réaliste d'écran
  return size;
}