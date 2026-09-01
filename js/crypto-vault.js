const te=new TextEncoder();
const td=new TextDecoder();
export const CRYPTO_VERSION=1;
export const KDF_ITERATIONS=600000;
let masterBytes=null;
let lastActivity=Date.now();
let lockTimer=null;
const derivedCache=new Map();

export const b64u=bytes=>{
  const arr=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  let s='';for(let i=0;i<arr.length;i+=0x8000)s+=String.fromCharCode(...arr.subarray(i,i+0x8000));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
export const unb64u=str=>{
  const clean=String(str||'').replace(/-/g,'+').replace(/_/g,'/');
  const pad=clean+'='.repeat((4-clean.length%4)%4);const s=atob(pad);const out=new Uint8Array(s.length);for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out;
};
export const randomBytes=n=>crypto.getRandomValues(new Uint8Array(n));
export const recoveryCode=bytes=>b64u(bytes).match(/.{1,6}/g).join('-');
export const parseRecoveryCode=code=>unb64u(String(code||'').replace(/[^A-Za-z0-9_-]/g,''));
export const vaultUnlocked=()=>Boolean(masterBytes);
export const clearVault=()=>{masterBytes=null;derivedCache.clear();window.dispatchEvent(new CustomEvent('noor:vault-lock'));};
export const setMasterBytes=bytes=>{masterBytes=new Uint8Array(bytes);derivedCache.clear();touch();window.dispatchEvent(new CustomEvent('noor:vault-unlock'));};
export const getMasterBytes=()=>{if(!masterBytes)throw new Error('NOOR encrypted vault is locked.');touch();return new Uint8Array(masterBytes);};

function touch(){lastActivity=Date.now();if(lockTimer)clearTimeout(lockTimer);lockTimer=setTimeout(()=>{if(Date.now()-lastActivity>=30*60*1000)clearVault();},30*60*1000);}
['pointerdown','keydown','touchstart'].forEach(ev=>globalThis.addEventListener?.(ev,touch,{passive:true}));

async function importAes(raw,usages=['encrypt','decrypt']){return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,usages);}
export async function derivePassphraseKey(passphrase,saltB64,iterations=KDF_ITERATIONS){
  const base=await crypto.subtle.importKey('raw',te.encode(passphrase),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:unb64u(saltB64),iterations,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function deriveKey(rawBytes,info,salt='NOOR-v1'){
  const cacheKey=`${b64u(rawBytes)}|${salt}|${info}`;if(derivedCache.has(cacheKey))return derivedCache.get(cacheKey);
  const base=await crypto.subtle.importKey('raw',rawBytes,'HKDF',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:te.encode(salt),info:te.encode(info)},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  derivedCache.set(cacheKey,key);return key;
}
export const masterWrapKey=()=>deriveKey(getMasterBytes(),'master-wrap','NOOR-master-v1');
export const deriveExperimentKey=(workspaceBytes,localId)=>deriveRawKey(workspaceBytes,`experiment:${localId}`,'NOOR-experiment-v1');
async function deriveRawKey(rawBytes,info,salt){
  const base=await crypto.subtle.importKey('raw',rawBytes,'HKDF',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt:te.encode(salt),info:te.encode(info)},base,256);
  return new Uint8Array(bits);
}
export async function encryptRawBytes(bytes,key,aad=''){
  const iv=randomBytes(12);const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:te.encode(aad),tagLength:128},key,data);
  return {cipherBytes:new Uint8Array(ct),nonce:b64u(iv)};
}
export async function decryptRawBytes(cipherBytes,nonce,key,aad=''){
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64u(nonce),additionalData:te.encode(aad),tagLength:128},key,cipherBytes instanceof Uint8Array?cipherBytes:new Uint8Array(cipherBytes));
  return new Uint8Array(plain);
}
export async function encryptBytes(bytes,key,aad=''){const r=await encryptRawBytes(bytes,key,aad);return {ciphertext:b64u(r.cipherBytes),nonce:r.nonce};}
export async function decryptBytes(ciphertext,nonce,key,aad=''){return decryptRawBytes(unb64u(ciphertext),nonce,key,aad);}
export async function encryptJSON(value,key,aad=''){return encryptBytes(te.encode(JSON.stringify(value)),key,aad);}
export async function decryptJSON(ciphertext,nonce,key,aad=''){return JSON.parse(td.decode(await decryptBytes(ciphertext,nonce,key,aad)));}
export async function wrapRawKey(rawBytes,wrappingKey,aad=''){return encryptBytes(rawBytes,wrappingKey,aad);}
export async function unwrapRawKey(ciphertext,nonce,wrappingKey,aad=''){return decryptBytes(ciphertext,nonce,wrappingKey,aad);}
export async function wrapWithSecret(rawBytes,secretBytes,aad=''){return wrapRawKey(rawBytes,await importAes(secretBytes),aad);}
export async function unwrapWithSecret(ciphertext,nonce,secretBytes,aad=''){return unwrapRawKey(ciphertext,nonce,await importAes(secretBytes),aad);}
export async function createVaultProfile(userId,passphrase){
  if(String(passphrase||'').length<12)throw new Error('Use at least 12 characters for the NOOR vault passphrase.');
  const master=randomBytes(32),salt=randomBytes(16),recovery=randomBytes(32);
  const passKey=await derivePassphraseKey(passphrase,b64u(salt),KDF_ITERATIONS);
  const wrapped=await wrapRawKey(master,passKey,`vault:${userId}:v1`);
  const recKey=await importAes(recovery);const recWrapped=await wrapRawKey(master,recKey,`recovery:${userId}:v1`);
  setMasterBytes(master);
  return {profile:{user_id:userId,kdf_salt:b64u(salt),kdf_iterations:KDF_ITERATIONS,wrapped_master_key:wrapped.ciphertext,wrap_nonce:wrapped.nonce,recovery_wrapped_master_key:recWrapped.ciphertext,recovery_nonce:recWrapped.nonce,crypto_version:CRYPTO_VERSION},recovery:recoveryCode(recovery)};
}
export async function unlockVaultProfile(userId,profile,passphrase){
  const passKey=await derivePassphraseKey(passphrase,profile.kdf_salt,profile.kdf_iterations);
  let master;try{master=await unwrapRawKey(profile.wrapped_master_key,profile.wrap_nonce,passKey,`vault:${userId}:v1`);}catch{throw new Error('Incorrect vault passphrase.');}
  if(master.length!==32)throw new Error('Vault key is invalid.');setMasterBytes(master);return true;
}
export async function recoverVaultProfile(userId,profile,code,newPassphrase){
  if(String(newPassphrase||'').length<12)throw new Error('Use at least 12 characters for the new vault passphrase.');
  const secret=parseRecoveryCode(code);if(secret.length!==32)throw new Error('Recovery code format is invalid.');
  let master;try{master=await unwrapRawKey(profile.recovery_wrapped_master_key,profile.recovery_nonce,await importAes(secret),`recovery:${userId}:v1`);}catch{throw new Error('Recovery code is incorrect.');}
  const salt=randomBytes(16);const passKey=await derivePassphraseKey(newPassphrase,b64u(salt),KDF_ITERATIONS);const wrapped=await wrapRawKey(master,passKey,`vault:${userId}:v1`);setMasterBytes(master);
  return {kdf_salt:b64u(salt),kdf_iterations:KDF_ITERATIONS,wrapped_master_key:wrapped.ciphertext,wrap_nonce:wrapped.nonce,crypto_version:CRYPTO_VERSION};
}
