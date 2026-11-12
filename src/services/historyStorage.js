/**
 * IndexedDB storage engine for local generation history.
 *
 * Saves full generation metadata and image blobs locally in the browser
 * so previous outputs are never lost, without overloading localStorage limits.
 */

const DB_NAME = 'morphlens_db';
const DB_VERSION = 1;
const STORE_NAME = 'generations';
const MAX_SAVED_GENERATIONS = 50;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Fetch a URL (blob: or data:) and return it as a pure Blob for compact DB storage
 */
async function toBlob(sourceUrl) {
  if (!sourceUrl) return null;
  try {
    const res = await fetch(sourceUrl);
    return await res.blob();
  } catch {
    return null;
  }
}

/**
 * Save a new generation record into IndexedDB
 *
 * @param {object} item
 * @param {string} item.originalImage
 * @param {string} item.generatedImage
 * @param {string} item.prompt
 * @param {string} [item.styleId]
 * @param {number} [item.likeness]
 * @param {number} [item.seed]
 * @param {string} [item.model]
 * @param {string} [item.framingMode]
 * @returns {Promise<string>} Saved record ID
 */
export async function saveGenerationRecord({
  originalImage,
  generatedImage,
  prompt,
  styleId = '',
  likeness = 0.85,
  seed = null,
  model = '',
  framingMode = 'headshot',
}) {
  try {
    const db = await openDB();
    const [origBlob, genBlob] = await Promise.all([
      toBlob(originalImage),
      toBlob(generatedImage),
    ]);

    const id = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = {
      id,
      timestamp: Date.now(),
      prompt,
      styleId,
      likeness,
      seed,
      model,
      framingMode,
      originalBlob: origBlob || null,
      generatedBlob: genBlob || null,
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Prune oldest if over capacity
    pruneOldGenerations(db).catch(() => {});
    return id;
  } catch (err) {
    console.warn('Could not save generation to history:', err);
    return null;
  }
}

/**
 * Prune history to MAX_SAVED_GENERATIONS
 */
async function pruneOldGenerations(db) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const countReq = store.count();

    countReq.onsuccess = () => {
      const total = countReq.result;
      if (total <= MAX_SAVED_GENERATIONS) {
        resolve();
        return;
      }

      const toDelete = total - MAX_SAVED_GENERATIONS;
      let deleted = 0;
      const cursorReq = index.openCursor(); // oldest first

      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor && deleted < toDelete) {
          cursor.delete();
          deleted += 1;
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => resolve();
    };
    countReq.onerror = () => resolve();
  });
}

/**
 * Retrieve all saved generation records sorted by most recent first
 */
export async function getAllGenerations() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const req = index.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        // Map Blobs to temporary ObjectURLs for React display
        const mapped = list.map((item) => {
          let origUrl = null;
          let genUrl = null;
          if (item.originalBlob) origUrl = URL.createObjectURL(item.originalBlob);
          if (item.generatedBlob) genUrl = URL.createObjectURL(item.generatedBlob);
          return {
            ...item,
            originalUrl: origUrl || item.originalImage || null,
            generatedUrl: genUrl || item.generatedImage || null,
          };
        });
        // Descending order (newest first)
        mapped.reverse();
        resolve(mapped);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not load history from IndexedDB:', err);
    return [];
  }
}

/**
 * Delete a single generation by ID
 */
export async function deleteGenerationRecord(id) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete generation:', err);
    return false;
  }
}

/**
 * Clear all generation history
 */
export async function clearAllGenerations() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not clear history:', err);
    return false;
  }
}
