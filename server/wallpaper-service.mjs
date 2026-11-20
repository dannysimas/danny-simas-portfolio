// Keep the last complete snapshot and share one refresh between concurrent requests.
export function createWallpaperService({load,now=Date.now,ttlMs=60000,retryMs=60000}){
  let snapshot=null,expires=0,pending=null,retryAt=0,lastError=null;
  return {async get(){
    if(snapshot&&now()<expires)return {...snapshot,stale:false};
    if(pending)return pending;
    if(now()<retryAt){if(snapshot)return {...snapshot,stale:true};throw lastError}
    pending=Promise.resolve().then(async()=>{
      try{const next=await load();if(!next.complete||!Array.isArray(next.items))throw Error('Incomplete wallpaper refresh');snapshot=next;expires=now()+ttlMs;retryAt=0;return {...snapshot,stale:false}}
      catch(error){lastError=error;retryAt=now()+retryMs;if(snapshot)return {...snapshot,stale:true};throw error}
      finally{pending=null}
    });
    return pending;
  }};
}
