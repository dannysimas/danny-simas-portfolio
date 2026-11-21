import {gzipSync,gunzipSync} from 'node:zlib';

// Shared between function instances/deployments. Keep the large payload separate
// from the tiny freshness marker so unchanged scans do not rewrite every image.
export function createWallpaperCache(store,{key='dannysimas:wallpapers:v1',ttl=86400,previewTtlMs=900000}={}){
  let persisted=null;
  const validMeta=value=>value&&/^[a-f0-9]{24}$/.test(value.revision)&&Number.isFinite(Date.parse(value.checkedAt))&&Number.isFinite(Date.parse(value.storedAt));
  async function bounded(operation){
    let timer;
    try{return await Promise.race([operation,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Wallpaper cache timeout')),1500)})])}
    finally{clearTimeout(timer)}
  }
  return {
    async get(){
      const meta=await bounded(store.get(key));if(!validMeta(meta))return null;
      const encoded=await bounded(store.get(key+':'+meta.revision));if(typeof encoded!=='string'||encoded.length>1900000)return null;
      const snapshot=JSON.parse(gunzipSync(Buffer.from(encoded,'base64'),{maxOutputLength:32000000}).toString('utf8'));
      if(snapshot.complete!==true||snapshot.revision!==meta.revision||!Array.isArray(snapshot.items)||snapshot.items.length>20000)return null;
      persisted=meta;
      return {...snapshot,checkedAt:meta.checkedAt};
    },
    async set(snapshot){
      const checkedAt=snapshot.checkedAt;
      let storedAt=persisted?.storedAt;
      if(!persisted||persisted.revision!==snapshot.revision||Date.parse(checkedAt)-Date.parse(storedAt)>=previewTtlMs){
        const encoded=gzipSync(JSON.stringify(snapshot)).toString('base64');
        if(encoded.length>1900000)return;
        await bounded(store.set(key+':'+snapshot.revision,encoded,{ttl}));storedAt=checkedAt;
      }
      const meta={revision:snapshot.revision,checkedAt,storedAt};
      await bounded(store.set(key,meta,{ttl}));persisted=meta;
    }
  };
}
