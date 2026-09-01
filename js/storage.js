const DB_NAME='noor-eln';
const DB_VERSION=4;
export const STORES=['experiments','protocols','syntheses','discussions','plates','calculations','tasks','timers','settings','attachments','projects','samples','instruments','literature','decisions','analyses','handwriting'];

function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;for(const s of STORES)if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:'id'});};req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db);};req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('NOOR storage upgrade is blocked by another open tab. Close other NOOR tabs and reload.'));});}
async function tx(store,mode='readonly'){const db=await openDB();if(!db.objectStoreNames.contains(store))throw new Error(`Unknown NOOR store: ${store}`);return db.transaction(store,mode).objectStore(store)}
export async function put(store,value){const os=await tx(store,'readwrite');return new Promise((resolve,reject)=>{const r=os.put(value);r.onsuccess=()=>resolve(value);r.onerror=()=>reject(r.error);});}
export async function get(store,id){const os=await tx(store);return new Promise((resolve,reject)=>{const r=os.get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function all(store){const os=await tx(store);return new Promise((resolve,reject)=>{const r=os.getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
export async function remove(store,id){const os=await tx(store,'readwrite');return new Promise((resolve,reject)=>{const r=os.delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
export async function clearStore(store){const os=await tx(store,'readwrite');return new Promise((resolve,reject)=>{const r=os.clear();r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
export function uid(prefix='rec'){return `${prefix}_${Date.now().toString(36)}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`}
export async function migrateLegacy(){for(const [key,store] of [['noor.experiments','experiments'],['noor.tasks','tasks']]){try{const raw=localStorage.getItem(key);if(!raw)continue;const arr=JSON.parse(raw);if(Array.isArray(arr)){for(const item of arr){if(!item.id)item.id=uid(store.slice(0,3));await put(store,item);}localStorage.removeItem(key);}}catch{}}}

function blobToDataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
function dataURLToBlob(dataUrl){const [header,data]=String(dataUrl).split(',');const mime=(header.match(/data:([^;]+)/)||[])[1]||'application/octet-stream';const bytes=atob(data);const array=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)array[i]=bytes.charCodeAt(i);return new Blob([array],{type:mime});}

export async function exportAll(){const payload={schema:'noor-backup',version:4,exportedAt:new Date().toISOString(),stores:{}};for(const s of STORES){const records=await all(s);if(s==='attachments'){payload.stores[s]=await Promise.all(records.map(async item=>{const copy={...item};if(copy.blob instanceof Blob){copy.dataUrl=await blobToDataURL(copy.blob);delete copy.blob;}return copy;}));}else payload.stores[s]=records;}return payload;}
export async function importAll(payload,{replace=false}={}){if(!payload||payload.schema!=='noor-backup'||!payload.stores)throw new Error('This is not a valid NOOR backup.');for(const s of STORES){if(replace)await clearStore(s);for(const original of payload.stores[s]||[]){const item={...original};if(s==='attachments'&&item.dataUrl&&!item.blob){item.blob=dataURLToBlob(item.dataUrl);delete item.dataUrl;}await put(s,item);}}return true;}
export async function requestPersistence(){if(!navigator.storage?.persist)return false;return navigator.storage.persist();}
export async function estimateStorage(){if(!navigator.storage?.estimate)return null;return navigator.storage.estimate();}
