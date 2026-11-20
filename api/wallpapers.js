import {readFile} from 'node:fs/promises';
import {discoverWallpapers} from '../server/wallpaper-source.mjs';
import {createWallpaperService} from '../server/wallpaper-service.mjs';
const baseline=readFile(new URL('../concepts/motion-lab/wallpapers/catalog.json',import.meta.url),'utf8').then(JSON.parse).catch(()=>[]);
const service=createWallpaperService({load:async()=>discoverWallpapers({baseline:await baseline})});
const PAGE_SIZE=500;
export function createWallpaperHandler(source=service){return async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body))};
  if(req.method!=='GET'){res.setHeader('Allow','GET');return send(405,{error:'Method not allowed'})}
  const url=new URL(req.url,'http://localhost'),pageValue=url.searchParams.get('page')||'1';
  if(!/^[1-9]\d{0,3}$/.test(pageValue)){res.setHeader('Cache-Control','no-store');return send(400,{error:'Invalid page'})}
  try{
    const snapshot=await source.get(),page=Number(pageValue),pages=Math.max(1,Math.ceil(snapshot.items.length/PAGE_SIZE));
    const revision=url.searchParams.get('revision');
    if(revision&&revision!==snapshot.revision){res.setHeader('Cache-Control','no-store');return send(409,{error:'Catalog changed during refresh'})}
    if(page>pages){res.setHeader('Cache-Control','no-store');return send(404,{error:'Page not found'})}
    res.setHeader('Cache-Control','public, max-age=0, s-maxage='+(snapshot.stale?'15':'60'));
    return send(200,{complete:true,revision:snapshot.revision,checkedAt:snapshot.checkedAt,stale:snapshot.stale,page,pages,total:snapshot.items.length,items:snapshot.items.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE)});
  }catch(error){console.error('Wallpaper sync unavailable:',error.message);res.setHeader('Cache-Control','no-store');res.setHeader('Retry-After','60');return send(503,{error:'Wallpaper refresh temporarily unavailable'})}
}};
export default createWallpaperHandler();
