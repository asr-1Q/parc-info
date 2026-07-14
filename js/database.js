const DB_NAME = "parc-info-db";
const DB_VERSION = 1;
let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      if (!db.objectStoreNames.contains("equipments")) db.createObjectStore("equipments", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("customModels")) db.createObjectStore("customModels");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
}

export function idbGet(store, key) {
  return tx(store, "readonly").then(s => new Promise((res, rej) => {
    const r = s.get(key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}

export function idbSet(store, key, value) {
  return tx(store, "readwrite").then(s => new Promise((res, rej) => {
    const r = key === undefined ? s.put(value) : s.put(value, key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}

export function idbDelete(store, key) {
  return tx(store, "readwrite").then(s => new Promise((res, rej) => {
    const r = s.delete(key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  }));
}

export function idbGetAll(store) {
  return tx(store, "readonly").then(s => new Promise((res, rej) => {
    const r = s.getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}

export function idbClear(store) {
  return tx(store, "readwrite").then(s => new Promise((res, rej) => {
    const r = s.clear();
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  }));
}