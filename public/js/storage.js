// public/js/storage.js
/**
 * @module storage
 * Interface simples para gravar/ler JSON no IndexedDB.
 */

const DB_NAME = "PreventivaDB";
const STORE_NAME = "preventivaState";
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Abre (ou cria) o IndexedDB e retorna a instância.
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

/**
 * Grava um objeto qualquer no IndexedDB sob a chave `key`.
 * @param {string} key 
 * @param {any} value – será serializado como JSON
 * @returns {Promise<void>}
 */
export async function setItem(key, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(JSON.stringify(value), key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Lê o valor armazenado sob a chave `key` no IndexedDB.
 * @param {string} key 
 * @returns {Promise<any|null>} – objeto desserializado ou null se não existir
 */
export async function getItem(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => {
      const result = req.result;
      resolve(result ? JSON.parse(result) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Remove o item sob a chave `key`.
 * @param {string} key 
 * @returns {Promise<void>}
 */
export async function removeItem(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
