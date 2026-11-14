// 盤局筆記：以 IndexedDB 儲存在本機瀏覽器（文字＋圖片），每個盤一份
const DB_NAME = 'qimen-notes';
const STORE = 'notes';

function pad(n) { return String(n).padStart(2, '0'); }

/** 同一排盤系統、同一時間（命盤另含性別）視為同一個盤 */
export function buildNoteKey(result) {
    const { solar, chartType, gender } = result;
    const time = `${solar.year}-${pad(solar.month)}-${pad(solar.day)}T${pad(solar.hour)}:${pad(solar.minute)}`;
    return chartType === '命盤' ? `${chartType}|${time}|${gender}` : `${chartType}|${time}`;
}

export function buildNoteTitle(result) {
    const { solar, chartType, yinYang, juNum } = result;
    return `${chartType}｜${solar.year}/${pad(solar.month)}/${pad(solar.day)} ${pad(solar.hour)}:${pad(solar.minute)}｜${yinYang}${juNum}局`;
}

let dbPromise = null;
function openDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { dbPromise = null; reject(req.error); };
        });
    }
    return dbPromise;
}

async function run(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req?.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

export function getNote(key) {
    return run('readonly', store => store.get(key));
}

/** 文字與圖片皆為空時刪除整筆筆記 */
export function saveNote(note) {
    if (!note.text.trim() && note.images.length === 0) return deleteNote(note.key);
    return run('readwrite', store => store.put({ ...note, updatedAt: Date.now() }));
}

export function deleteNote(key) {
    return run('readwrite', store => store.delete(key));
}

/** 上傳前壓縮：長邊最多 1600px、JPEG，避免占滿瀏覽器儲存空間 */
export async function compressImage(file, maxSide = 1600) {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('圖片處理失敗'))), 'image/jpeg', 0.85));
}
