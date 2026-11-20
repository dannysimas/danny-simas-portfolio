import {createHash} from 'node:crypto';
export const SHARED_FOLDER='https://www.dropbox.com/scl/fo/0bsc2st5y0wg8spgdb4sp/AHljdX9bm0UpCSD2-wZwE00?rlkey=fkyymnse9fio3rx2kp85f8g5b&dl=0';
const root=new URL(SHARED_FOLDER),rootKey=root.pathname.split('/')[3];
const imagePattern=/\.(jpe?g|png|webp|avif|gif)$/i;
export function sharedUrl(value){
  const url=new URL(value);
  if(url.protocol!=='https:'||url.hostname!=='www.dropbox.com'||url.username||url.password||url.port||!url.pathname.startsWith('/scl/fo/'+rootKey+'/'))throw Error('Unexpected shared-folder URL');
  return url;
}
function parts(value){return sharedUrl(value).pathname.split('/').slice(5).map(decodeURIComponent)}
export function imageId(entry){return createHash('sha256').update(entry.file_id||sharedUrl(entry.href).pathname).digest('hex').slice(0,18)}
function imageUrl(value){
  if(typeof value!=='string'||value.length>2048)return null;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&(/(^|\.)dropboxusercontent\.com$/.test(url.hostname)||/(^|\.)dropbox\.com$/.test(url.hostname))?url.href:null}catch{return null}
}
function renditions(entry){
  const content=entry.preview?.content||{},dimensions=entry.preview?.dimensions||{};
  const list=(content.src_set||'').split(/,\s+/).map(s=>{const m=s.match(/^(https:\/\/\S+)\s+(\d+)w$/);return m&&imageUrl(m[1])?{url:m[1],width:Number(m[2])}:null}).filter(Boolean).sort((a,b)=>a.width-b.width);
  const ratio=dimensions.width&&dimensions.height?Math.min(1,dimensions.width/dimensions.height):1;
  const choose=edge=>(list.find(item=>item.width>=edge*ratio)||list.at(-1))?.url||imageUrl(content.default_src)||imageUrl(entry.preview?.preview_url);
  return {thumbnail:choose(800),preview:choose(1600)};
}
function titleFor(filename,game,position){
  const name=filename.replace(/\.[^.]+$/,'').replace(/_+/g,' ').replace(/\s+/g,' ').trim();
  const random=/^[A-Za-z0-9]{7}$/.test(name)&&/[A-Z]/.test(name.slice(1))&&!/^[A-Z]+$/.test(name);
  return random||/^[a-f0-9]{8}-[a-f0-9]{4}-/i.test(name)||/\d{1,2} \d{1,2} 20\d{2}|\d{1,2}\/\d{1,2}\/20\d{2}/.test(name)?game+' \u00b7 '+String(position).padStart(2,'0'):name;
}
function cachedPath(value){return typeof value==='string'&&/^\/wallpapers\/assets\/[a-f0-9]{18}-(thumb|preview)\.jpg$/.test(value)}
export function catalogFromEntries(entries,baseline=[]){
  const previous=new Map(baseline.map(item=>[item.id,item])),positions=new Map();
  const sorted=[...entries].sort((a,b)=>parts(a.href).join('/').localeCompare(parts(b.href).join('/'),'en'));
  return sorted.map(entry=>{
    const id=imageId(entry),path=parts(entry.href),game=path.length>1?path[0]:'Danny Vault',filename=String(entry.filename||'').slice(0,500),collection=path.slice(1,-1).join(' / ')||'Wallpapers';
    const position=(positions.get(game)||0)+1;positions.set(game,position);
    const modified=entry.ts?new Date(entry.ts*1000).toISOString():null,bytes=Number(entry.bytes)||null;
    const old=previous.get(id),same=old&&modified&&old.modified===modified&&old.bytes===bytes;
    const previews=same&&cachedPath(old.thumbnail)&&cachedPath(old.preview)?{thumbnail:old.thumbnail,preview:old.preview}:renditions(entry);
    if(!previews.thumbnail||!previews.preview)throw Error('Missing safe image preview');
    const width=Number(entry.preview?.dimensions?.width)||null,height=Number(entry.preview?.dimensions?.height)||null;
    const download=sharedUrl(entry.href);download.searchParams.set('dl','1');
    const ext=filename.split('.').at(-1).toUpperCase();
    return {id,title:same&&old.filename===filename&&old.game===game?old.title:titleFor(filename,game,position),game,collection,filename,width,height,bytes,format:ext==='JPG'?'JPEG':ext,orientation:width&&height?(width>height?'landscape':height>width?'portrait':'square'):'unknown',...previews,download:download.href,modified};
  });
}
export async function discoverWallpapers({baseline=[],fetchImpl=fetch,signal=AbortSignal.timeout(45000),maxFolders=500,maxImages=20000,onProgress=()=>{}}={}){
  const cookies=new Map();
  function remember(response){for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0],at=pair.indexOf('=');if(at>0)cookies.set(pair.slice(0,at),pair.slice(at+1))}}
  async function request(url,options={}){
    let failure;
    for(let attempt=0;attempt<2;attempt++){
      signal.throwIfAborted();
      try{const response=await fetchImpl(url,{...options,signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});if(!response.ok){await response.body?.cancel();throw Error('Dropbox HTTP '+response.status)}remember(response);return response}catch(error){failure=error}
    }
    throw failure;
  }
  const hello=await request(SHARED_FOLDER);await hello.body?.cancel();
  async function folder(url){
    const parsed=sharedUrl(url),path=parsed.pathname.split('/').filter(Boolean),entries=[],vouchers=new Set();let voucher,pages=0;
    do{
      const body=new URLSearchParams({link_key:path[2],link_type:'c',secure_hash:path[3],sub_path:path.slice(4).map(decodeURIComponent).join('/'),rlkey:root.searchParams.get('rlkey'),t:cookies.get('t')||''});
      if(voucher)body.set('voucher',typeof voucher==='string'?voucher:JSON.stringify(voucher));
      const response=await request('https://www.dropbox.com/list_shared_link_folder_entries',{method:'POST',redirect:'error',body,headers:{Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),Referer:parsed.href}});
      const data=await response.json();if(!Array.isArray(data.entries))throw Error('Invalid Dropbox listing');
      entries.push(...data.entries);voucher=data.has_more_entries?data.next_request_voucher:null;
      if(data.has_more_entries){const key=JSON.stringify(voucher);if(!voucher||vouchers.has(key))throw Error('Invalid Dropbox pagination');vouchers.add(key)}
      if(++pages>100)throw Error('Folder pagination limit exceeded');
    }while(voucher);
    return entries;
  }
  const queue=[SHARED_FOLDER],seen=new Set(),images=new Map();let folders=0,excluded=0;
  while(queue.length){
    const batch=queue.splice(0,6).filter(url=>{const path=sharedUrl(url).pathname;if(seen.has(path))return false;seen.add(path);return true});
    if(seen.size>maxFolders)throw Error('Wallpaper folder limit exceeded');
    const listings=await Promise.all(batch.map(folder));
    for(const entries of listings){
      ++folders;
      for(const entry of entries){
        if(entry.is_dir){sharedUrl(entry.href);queue.push(entry.href)}
        else if(imagePattern.test(entry.filename||'')){sharedUrl(entry.href);images.set(imageId(entry),entry)}else ++excluded;
      }
      if(images.size>maxImages)throw Error('Wallpaper image limit exceeded');
    }
    onProgress({folders,images:images.size});
  }
  const items=catalogFromEntries([...images.values()],baseline);
  const revision=createHash('sha256').update(JSON.stringify(items.map(({thumbnail,preview,...item})=>item))).digest('hex').slice(0,24);
  return {items,revision,checkedAt:new Date().toISOString(),complete:true,folders,excluded};
}
