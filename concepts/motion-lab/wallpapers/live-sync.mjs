// Read a complete, consistent feed before replacing anything visitors can see.
export const SYNC_INTERVAL=60000;
function mediaUrl(value){
  if(typeof value!=='string')return false;
  if(/^\/wallpapers\/assets\/[a-f0-9]{18}-(thumb|preview)\.(jpg|jpeg|png|webp|avif|gif)$/.test(value))return true;
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(/(^|\.)dropboxusercontent\.com$/.test(u.hostname)||/(^|\.)dropbox\.com$/.test(u.hostname))}catch{return false}
}
function validItem(item){
  if(!item||!(/^[a-f0-9]{18}$/).test(item.id)||!['title','game','filename','collection','format'].every(key=>typeof item[key]==='string'&&item[key].length<=2000))return false;
  if(!['width','height','bytes'].every(key=>item[key]===null||(Number.isFinite(item[key])&&item[key]>0)))return false;
  if(!mediaUrl(item.thumbnail)||!mediaUrl(item.preview))return false;
  try{const url=new URL(item.download);return url.protocol==='https:'&&url.hostname==='www.dropbox.com'&&!url.username&&!url.password&&url.pathname.startsWith('/scl/fo/')}catch{return false}
}
export function catalogSignature(items){return JSON.stringify(items.map(({id,title,game,collection,filename,width,height,bytes,format,download,modified})=>({id,title,game,collection,filename,width,height,bytes,format,download,modified})))}
export async function fetchWallpaperSnapshot({fetchImpl=fetch,signal=AbortSignal.timeout(65000)}={}){
  for(let attempt=0;attempt<2;attempt++){
    let first,all=[];
    try{
      for(let page=1;page<=(first?.pages||1);page++){
        const query=new URLSearchParams({page:String(page)});if(first)query.set('revision',first.revision);if(attempt)query.set('retry','1');
        const response=await fetchImpl('/api/wallpapers?'+query,{signal,cache:'no-cache',headers:{Accept:'application/json'}});
        if(response.status===409){const error=Error('Catalog changed');error.restart=true;throw error}
        if(!response.ok)throw Error('Wallpaper refresh unavailable');
        const data=await response.json();
        if(data.complete!==true||!(/^[a-f0-9]{24}$/).test(data.revision)||!Number.isInteger(data.total)||data.total<0||data.total>20000||!Number.isInteger(data.pages)||data.pages<1||data.pages>40||data.page!==page||!Array.isArray(data.items)||data.items.length>500||!data.items.every(validItem))throw Error('Invalid wallpaper feed');
        if(first&&(data.revision!==first.revision||data.total!==first.total||data.pages!==first.pages))throw Error('Inconsistent wallpaper feed');
        if(!first)first=data;all.push(...data.items);
      }
      if(all.length!==first.total||new Set(all.map(item=>item.id)).size!==all.length)throw Error('Incomplete wallpaper feed');
      return {items:all,revision:first.revision,checkedAt:first.checkedAt,stale:first.stale===true};
    }catch(error){if(!error.restart||attempt)throw error}
  }
}
export function startWallpaperSync({onUpdate,canApply=()=>true,request=fetchWallpaperSnapshot,interval=SYNC_INTERVAL,documentObject=document,windowObject=window}){
  let timer=null,controller=null,pending=null,lastChecked=0,stopped=false;
  function schedule(){clearTimeout(timer);if(!stopped&&!documentObject.hidden)timer=setTimeout(refresh,interval)}
  function flush(){if(pending&&!documentObject.hidden&&canApply()){const next=pending;pending=null;onUpdate(next)}}
  async function refresh(){
    if(stopped||controller||documentObject.hidden)return;
    controller=new AbortController();
    try{pending=await request({signal:AbortSignal.any([controller.signal,AbortSignal.timeout(65000)])});lastChecked=Date.now();flush()}
    catch(error){if(error.name!=='AbortError')console.warn('Keeping the current wallpaper gallery; automatic refresh will retry.');}
    finally{controller=null;schedule()}
  }
  function resume(){if(documentObject.hidden){clearTimeout(timer);controller?.abort();return}flush();if(Date.now()-lastChecked>60000)refresh();else schedule()}
  function hide(){clearTimeout(timer);controller?.abort()}
  documentObject.addEventListener('visibilitychange',resume);windowObject.addEventListener('online',resume);windowObject.addEventListener('pagehide',hide);windowObject.addEventListener('pageshow',resume);
  refresh();
  return {refresh,flush,stop(){stopped=true;clearTimeout(timer);controller?.abort();documentObject.removeEventListener('visibilitychange',resume);windowObject.removeEventListener('online',resume);windowObject.removeEventListener('pagehide',hide);windowObject.removeEventListener('pageshow',resume)}};
}
