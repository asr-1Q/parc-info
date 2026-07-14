export function isDuplicateSerial(equipments, serial) {
  if (!serial) return null;
  const val = serial.trim().toLowerCase();
  if (!val) return null;
  return equipments.find(e => e.numeroSerie && e.numeroSerie.trim().toLowerCase() === val) || null;
}

export function validateRequired(data) {
  const errors = [];
  if (!data.equipement) errors.push({ field: "equipement", message: "Type d'équipement requis." });
  return { valid: errors.length === 0, errors };
}

export function debounce(fn, delay = 300) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}