const CACHE='noor-v1.3.5-reference-fix';
const ASSETS=['./','./index.html','./styles.css','./manifest.webmanifest','./js/app.js','./js/config.js','./js/storage.js','./js/tools.js','./js/media.js','./js/reference-enhancements.js','./js/formula-formatting.js','./js/postdoc-workflow.js','./js/handwriting.js','./js/project-linking.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;
    if(event.request.mode==='navigate')return caches.match('./index.html');
    throw new Error('NOOR is offline and this resource is not cached.');
  }));
});
