/* SG Satellite Monitor: network-first app shell, preserving orbital feed requests. */
const CACHE='sg-satellite-shell-v14';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./pwa-check.html'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await Promise.allSettled(ASSETS.map(async path=>{
      const response=await fetch(new Request(path,{cache:'reload'}));
      if(response.ok)await cache.put(path,response);
    }));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('sg-satellite-shell-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  const u=new URL(req.url);
  const isPage=u.pathname.endsWith('/sg-satellite-monitor/')||/\/sg-satellite-monitor\/(?:index|pwa-check)\.html$/.test(u.pathname);
  if(!isPage)return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(req);
      if(response.ok){
        const cache=await caches.open(CACHE);
        cache.put(req,response.clone()).catch(()=>{});
      }
      return response;
    }catch(e){
      const cache=await caches.open(CACHE);
      return await cache.match(req,{ignoreSearch:true})||await cache.match('./index.html')||await cache.match('./')||Response.error();
    }
  })());
});
