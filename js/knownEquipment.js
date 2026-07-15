let cache = null;

export async function loadKnownEquipments() {
  if (cache) return cache;
  try {
    const res = await fetch("data/known-equipments.json");
    cache = await res.json();
  } catch (e) {
    console.error("loadKnownEquipments:", e);
    cache = {};
  }
  return cache;
}

export function lookupKnownEquipment(known, serial) {
  if (!serial) return null;
  const key = serial.trim().toUpperCase().replace(/\s+/g, "");
  return known[key] || null;
}