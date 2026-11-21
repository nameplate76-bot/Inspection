/* M1.3.13 offline shell cache. No Supabase API responses or private documents cached here. */
const CACHE='ttoktti-static-m1318';
const SHELL=['./','./index.html','./checklist.html','./assets/app-version.js','./assets/account.js','./assets/cloud-sync.js','./assets/sync-refresh-button.js','./assets/legacy-checklist-engine.js','./assets/permission-gate.js','./assets/legacy-editor.css','./assets/module.css','./assets/account.css','./assets/home.css','./assets/check-templates.js','./assets/criteria-layout.js','./assets/offline-xlsx.js','./vendor/jszip.min.js','./assets/legacy-recovery.js','./assets/ttoktti-help.js','./assets/ttoktti-help.css','./assets/ttoktti-help-knowledge.json','./assets/check-writing-focus.css','./assets/check-writing-focus.js','./assets/ttoktti-ai-test-config.js','./assets/home-motion.js','./assets/home-cta-cue.js','./assets/ttoktti-i-official-locked.png','./assets/ttoktti-check-wordmark-locked.png','../supabase-config.js'];
const SUPABASE_CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
self.addEventListener('install',event=>{event.waitUntil((async()=>{const c=await caches.open(CACHE);await Promise.allSettled(SHELL.map(x=>c.add(new Request(x,{cache:'reload'}))));try{const response=await fetch(SUPABASE_CDN);if(response.ok)await c.put(SUPABASE_CDN,response)}catch{} await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('ttoktti-static-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET')return;
  const isCdn=url.origin==='https://cdn.jsdelivr.net'&&url.pathname==='/npm/@supabase/supabase-js@2';
  const ownStatic=url.origin===self.location.origin&&(url.pathname.startsWith(new URL('./',self.location.href).pathname)||url.pathname.endsWith('/supabase-config.js'));
  if(!isCdn&&!ownStatic)return;
  // Never persist API responses, Auth, AI results, or URL parameters containing credentials.
  if(url.pathname.includes('/functions/')||url.pathname.includes('/rest/')||url.pathname.includes('/auth/'))return;
  event.respondWith((async()=>{const c=await caches.open(CACHE);const normalized=isCdn?SUPABASE_CDN:(url.origin+url.pathname);const saved=await c.match(normalized,{ignoreSearch:true});
    if(!navigator.onLine&&saved)return saved;
    try{const network=await fetch(req);if(network.ok&&(network.type==='basic'||isCdn))await c.put(normalized,network.clone());return network}catch(e){if(saved)return saved;throw e}
  })());
});
