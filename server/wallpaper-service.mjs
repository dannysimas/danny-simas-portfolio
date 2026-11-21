// Keep the last complete snapshot and share one refresh between concurrent requests.
export function createWallpaperService({load,now=Date.now,ttlMs=60000,retryMs=60000,cache=null,defer=null}){
  let snapshot=null,expires=0,pending=null,retryAt=0,lastError=null,restored=!cache,restoring=null;
  async function restore(){
    if(restored)return;
    if(!restoring)restoring=Promise.resolve().then(async()=>{
      try{
        const saved=await cache.get(),checkedAt=Date.parse(saved?.checkedAt),age=now()-checkedAt;
        if(saved?.complete&&Array.isArray(saved.items)&&age>=0&&age<86400000){snapshot=saved;expires=checkedAt+ttlMs}
      }catch{/* A cache outage must not prevent Dropbox fallback. */}
      finally{restored=true}
    });
    await restoring;
  }
  return {async get(){
    await restore();
    if(snapshot&&now()<expires)return {...snapshot,stale:false};
    if(pending)return snapshot&&defer?{...snapshot,stale:true}:pending;
    if(now()<retryAt){if(snapshot)return {...snapshot,stale:true};throw lastError}
    pending=Promise.resolve().then(async()=>{
      try{
        const next=await load();if(!next.complete||!Array.isArray(next.items))throw Error('Incomplete wallpaper refresh');snapshot=next;expires=now()+ttlMs;retryAt=0;
        try{await cache?.set(next)}catch{/* Keep serving fresh results if the shared cache is unavailable. */}
        return {...snapshot,stale:false};
      }
      catch(error){lastError=error;retryAt=now()+retryMs;if(snapshot)return {...snapshot,stale:true};throw error}
      finally{pending=null}
    });
    if(snapshot&&defer){defer(pending);return {...snapshot,stale:true}}
    return pending;
  }};
}
