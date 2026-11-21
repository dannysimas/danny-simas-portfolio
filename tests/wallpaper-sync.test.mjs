import test from 'node:test';
import assert from 'node:assert/strict';
import {SHARED_FOLDER,discoverWallpapers,catalogFromEntries,sharedUrl} from '../server/wallpaper-source.mjs';
import {createWallpaperService} from '../server/wallpaper-service.mjs';
import {createWallpaperCache} from '../server/wallpaper-cache.mjs';
import {createWallpaperHandler} from '../api/wallpapers.js';
import {fetchWallpaperSnapshot,startWallpaperSync,catalogSignature,readWallpaperCache,writeWallpaperCache} from '../concepts/motion-lab/wallpapers/live-sync.mjs';
const revision='a'.repeat(24),revision2='b'.repeat(24);
const href=path=>{const u=new URL(SHARED_FOLDER);u.pathname+='/'+path;return u.href};
const entry=(name='art.jpg',path='Game/'+name)=>({file_id:name,filename:name,href:href(path),ts:1700000000,bytes:1000000,preview:{dimensions:{width:2160,height:3840},content:{src_set:'https://previews.dropbox.com/small.jpg 480w, https://previews.dropbox.com/large.jpg 960w'}}});
const item=(n=1)=>({...catalogFromEntries([entry()])[0],id:n.toString(16).padStart(18,'0')});
const snap=(items=[item()],rev=revision)=>({items,revision:rev,checkedAt:'2026-11-20T00:00:00Z',complete:true});
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const page=(items=[item()],extra={})=>({...snap(items),page:1,pages:1,total:items.length,stale:false,...extra});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function apiRequest(handler,url='/api/wallpapers',method='GET'){
 const headers={};let result;
 const res={setHeader(key,value){headers[key]=value},end(body){result={status:this.statusCode,headers,body:JSON.parse(body)}}};
 return handler({url,method},res).then(()=>result);
}

test('new and changed originals use fresh previews; unchanged originals reuse cached previews',()=>{
 const original=entry(),first=catalogFromEntries([original])[0];
 const cached={...first,title:'Curated title',thumbnail:'/wallpapers/assets/'+first.id+'-thumb.jpg',preview:'/wallpapers/assets/'+first.id+'-preview.jpg'};
 const same=catalogFromEntries([original],[cached])[0];
 assert.equal(same.thumbnail,cached.thumbnail);assert.equal(same.title,cached.title);
 const changed=catalogFromEntries([{...original,ts:original.ts+1}],[cached])[0];
 assert.equal(changed.id,cached.id);assert.match(changed.thumbnail,/^https:/);
 const updated=catalogFromEntries([original,entry('new.png','New Game/new.png')],[cached]);
 assert.equal(updated.length,2);assert.equal(updated[1].game,'New Game');assert.match(updated[1].download,/dl=1/);
 assert.equal(catalogFromEntries([entry('root.jpg','root.jpg')])[0].game,'Danny Vault');
});

test('crawler follows nested folders and pagination, excludes video and deduplicates directories',async()=>{
 const visits=[];
 const fetchImpl=async(url,options)=>{
  if(!options.method)return new Response('',{headers:{'Set-Cookie':'t=anonymous; Secure'}});
  const path=options.body.get('sub_path'),voucher=options.body.get('voucher');visits.push(path+':'+(voucher||''));
  assert.match(options.headers.Cookie,/t=anonymous/);
  if(!path)return response({entries:[{is_dir:true,href:href('Game')},{is_dir:true,href:href('Game')}],has_more_entries:false});
  if(path==='Game'&&!voucher)return response({entries:[entry(),{filename:'clip.mp4'}],has_more_entries:true,next_request_voucher:'second'});
  if(path==='Game')return response({entries:[{is_dir:true,href:href('Game/Phone')}],has_more_entries:false});
  return response({entries:[entry('second.png','Game/Phone/second.png')],has_more_entries:false});
 };
 const result=await discoverWallpapers({fetchImpl});
 assert.equal(result.items.length,2);assert.equal(result.folders,3);assert.equal(result.excluded,1);assert.equal(result.complete,true);
 assert.equal(visits.filter(path=>path==='Game:').length,1);
 assert.equal(result.items.find(x=>x.filename==='second.png').collection,'Phone');
});

test('crawler rejects a broken child folder instead of returning a partial library',async()=>{
 const fetchImpl=async(url,options)=>!options.method?new Response(''):options.body.get('sub_path')?response({},503):response({entries:[entry(),{is_dir:true,href:href('Broken')}],has_more_entries:false});
 await assert.rejects(discoverWallpapers({fetchImpl}),/Dropbox HTTP 503/);
});

test('crawler detects repeated pagination and rejects links outside the shared folder',async()=>{
 const fetchImpl=async(url,options)=>!options.method?new Response(''):response({entries:[],has_more_entries:true,next_request_voucher:'repeat'});
 await assert.rejects(discoverWallpapers({fetchImpl}),/pagination/);
 assert.throws(()=>sharedUrl('https://example.com/private'),/Unexpected/);
 assert.throws(()=>catalogFromEntries([{...entry(),preview:{content:{default_src:'https://example.com/image.jpg'}}}]),/safe image preview/);
});

test('concurrent visitors share a crawl, then additions and removals appear after cache expiry',async()=>{
 let time=0,calls=0,release;
 const gate=new Promise(resolve=>release=resolve);
 const service=createWallpaperService({now:()=>time,ttlMs:10,load:async()=>{calls++;await gate;return calls===1?snap():snap([item(2)],revision2)}});
 const first=service.get(),second=service.get();await tick();assert.equal(calls,1);release();
 assert.deepEqual(await first,await second);await service.get();assert.equal(calls,1);
 time=11;const updated=await service.get();assert.equal(calls,2);assert.deepEqual(updated.items.map(x=>x.id),[item(2).id]);
});

test('failed or incomplete refresh keeps the last complete catalog, throttles retries, and recovers',async()=>{
 let time=0,calls=0;
 const service=createWallpaperService({now:()=>time,ttlMs:10,retryMs:20,load:async()=>{calls++;if(calls===2)return {complete:false,items:[]};return snap(calls===1?[item()]:[item(),item(2)])}});
 await service.get();time=11;const stale=await service.get();assert.equal(stale.stale,true);assert.equal(stale.items.length,1);
 time=12;await service.get();assert.equal(calls,2);time=32;const updated=await service.get();assert.equal(updated.items.length,2);assert.equal(updated.stale,false);
});

test('even a synchronous source failure can recover after retry cooldown',async()=>{
 let time=0,calls=0;
 const service=createWallpaperService({now:()=>time,retryMs:10,load:()=>{if(++calls===1)throw Error('offline');return snap()}});
 await assert.rejects(service.get(),/offline/);time=11;assert.equal((await service.get()).items.length,1);
});

test('API paginates complete snapshots and prevents mixing revisions',async()=>{
 const items=Array.from({length:501},(_,i)=>item(i+1));
 const handler=createWallpaperHandler({get:async()=>({...snap(items),stale:false})});
 const first=await apiRequest(handler);assert.equal(first.status,200);assert.equal(first.body.items.length,500);assert.equal(first.body.pages,2);
 const last=await apiRequest(handler,'/api/wallpapers?page=2&revision='+revision);assert.equal(last.body.items.length,1);
 assert.equal((await apiRequest(handler,'/api/wallpapers?page=2&revision='+revision2)).status,409);
 assert.equal((await apiRequest(handler,'/api/wallpapers?page=0')).status,400);
 assert.equal((await apiRequest(handler,'/api/wallpapers?page=3')).status,404);
 assert.equal((await apiRequest(handler,'/api/wallpapers','POST')).status,405);
});

test('browser reads the entire feed and sends the revision on later pages',async()=>{
 const calls=[];
 const result=await fetchWallpaperSnapshot({fetchImpl:async url=>{calls.push(url);return response(page([item(calls.length)],{page:calls.length,pages:2,total:2}))}});
 assert.equal(result.items.length,2);assert.match(calls[1],new RegExp('revision='+revision));
});

test('browser restarts once if the library changes during pagination',async()=>{
 let calls=0;
 const result=await fetchWallpaperSnapshot({fetchImpl:async url=>{
  calls++;if(calls===1)return response(page([item()],{pages:2,total:2}));if(calls===2)return response({},409);
  assert.match(url,/retry=1/);return response(page([item(3)],{revision:revision2}));
 }});
 assert.deepEqual(result.items.map(x=>x.id),[item(3).id]);assert.equal(calls,3);
});

test('browser rejects partial, duplicate, unsafe, and unavailable feeds',async()=>{
 for(const data of [page([item()],{total:2}),page([item(),item()]),page([{...item(),thumbnail:'https://evil.example/image.jpg'}]),page([item()],{complete:false})]){
  await assert.rejects(fetchWallpaperSnapshot({fetchImpl:async()=>response(data)}));
 }
 await assert.rejects(fetchWallpaperSnapshot({fetchImpl:async()=>response({},503)}));
});

test('signed preview changes alone do not rearrange the gallery',()=>{
 assert.equal(catalogSignature([item()]),catalogSignature([{...item(),preview:'https://previews.dropbox.com/new-token.jpg'}]));
 assert.notEqual(catalogSignature([item()]),catalogSignature([item(),item(2)]));
});

test('sync defers applying changes during an open viewer and skips hidden tabs',async()=>{
 const doc=Object.assign(new EventTarget(),{hidden:false}),win=new EventTarget(),updates=[];let calls=0,canApply=false;
 const sync=startWallpaperSync({documentObject:doc,windowObject:win,interval:100000,canApply:()=>canApply,onUpdate:value=>updates.push(value),request:async()=>{calls++;return snap([item(),item(2)])}});
 try{
  await tick();assert.equal(calls,1);assert.equal(updates.length,0);canApply=true;sync.flush();assert.equal(updates[0].items.length,2);
  doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));await sync.refresh();assert.equal(calls,1);
  doc.hidden=false;await sync.refresh();assert.equal(calls,2);
 }finally{sync.stop()}
});


test('scheduled polling brings new uploads into an already open gallery without a manual refresh',async()=>{
 const doc=Object.assign(new EventTarget(),{hidden:false}),win=new EventTarget();let calls=0,sync;
 const result=await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{sync.stop();reject(Error('Automatic polling did not run'))},1000);
  sync=startWallpaperSync({documentObject:doc,windowObject:win,interval:5,request:async()=>snap(++calls===1?[item()]:[item(),item(2)]),onUpdate:value=>{if(value.items.length===2){clearTimeout(timeout);sync.stop();resolve(value)}}});
 });
 assert.equal(calls,2);assert.equal(result.items[1].id,item(2).id);
});

test('a cold function restores a fresh shared catalog without another Dropbox scan',async()=>{
 const saved=snap(),time=Date.parse(saved.checkedAt)+1000;let loads=0,reads=0;
 const cache={get:async()=>{reads++;return saved}};
 const service=createWallpaperService({now:()=>time,cache,load:async()=>{loads++;return snap()}});
 const [first,second]=await Promise.all([service.get(),service.get()]);
 assert.equal(reads,1);assert.equal(loads,0);assert.equal(first.stale,false);assert.deepEqual(first,second);
});

test('a stale shared gallery returns immediately while one background scan updates it',async()=>{
 const saved=snap(),time=Date.parse(saved.checkedAt)+60001,background=[],writes=[];let loads=0,release;
 const gate=new Promise(resolve=>release=resolve);
 const service=createWallpaperService({now:()=>time,cache:{get:async()=>saved,set:async value=>writes.push(value)},defer:task=>background.push(task),load:async()=>{loads++;await gate;return {...snap([item(),item(2)],revision2),checkedAt:new Date(time).toISOString()}}});
 try{
  const result=await Promise.race([service.get(),tick().then(()=>null)]);
  assert.ok(result,'Visitors must not wait for Dropbox when a complete cached gallery exists');
  assert.equal(result.stale,true);assert.equal(result.items.length,1);
  assert.equal((await service.get()).items.length,1);assert.equal(loads,1);assert.equal(background.length,1);
 }finally{release();await Promise.all(background)}
 const updated=await service.get();assert.equal(updated.items.length,2);assert.equal(updated.stale,false);assert.equal(writes.length,1);
});

test('cache outages do not discard a successful Dropbox result',async()=>{
 const service=createWallpaperService({cache:{get:async()=>{throw Error('cache offline')},set:async()=>{throw Error('quota')}},load:async()=>snap()});
 const result=await service.get();assert.equal(result.stale,false);assert.equal(result.items.length,1);
});

test('an expired shared snapshot cannot remain the startup gallery indefinitely',async()=>{
 const saved=snap();let loads=0;
 const service=createWallpaperService({now:()=>Date.parse(saved.checkedAt)+86400001,cache:{get:async()=>saved,set:async()=>{}},defer:()=>{},load:async()=>{loads++;return snap([item(2)],revision2)}});
 assert.equal((await service.get()).items[0].id,item(2).id);assert.equal(loads,1);
});

test('shared cache compresses full catalogs, cheaply renews checks, and refreshes signed previews',async()=>{
 const data=new Map(),writes=[];
 const store={get:async key=>data.get(key),set:async(key,value)=>{writes.push(key);data.set(key,value)}};
 const first=createWallpaperCache(store),saved=snap();await first.set(saved);
 const second=createWallpaperCache(store);assert.deepEqual(await second.get(),saved);
 const renewed={...saved,checkedAt:new Date(Date.parse(saved.checkedAt)+60000).toISOString()};await second.set(renewed);
 assert.equal(writes.length,3,'An unchanged scan should update only the small freshness marker');
 assert.deepEqual(await createWallpaperCache(store).get(),renewed);
 const refreshed={...renewed,checkedAt:new Date(Date.parse(saved.checkedAt)+900001).toISOString(),items:[{...item(),preview:'https://previews.dropbox.com/refreshed.jpg'}]};
 await second.set(refreshed);assert.equal(writes.length,5);assert.deepEqual(await createWallpaperCache(store).get(),refreshed);
});

test('stale API pages are not cached while their background refresh is pending',async()=>{
 const result=await apiRequest(createWallpaperHandler({get:async()=>({...snap(),stale:true})}));
 assert.equal(result.status,200);assert.equal(result.headers['Cache-Control'],'no-store');assert.equal(result.body.stale,true);
});

test('repeat visits can restore the last checked gallery without waiting for the network',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 const saved=snap([item(),item(2)],revision2),time=Date.parse(saved.checkedAt)+1000;
 writeWallpaperCache(saved,{storage,now:()=>time});
 assert.deepEqual(readWallpaperCache({storage,now:()=>time+1000}),saved);
 assert.equal(readWallpaperCache({storage,now:()=>time+900000}),null);
});

test('unsafe, corrupted, future-dated, or blocked browser storage cannot replace the fallback gallery',()=>{
 const time=Date.parse(snap().checkedAt)+1000;
 for(const value of ['not json',JSON.stringify({...snap(),items:[{...item(),thumbnail:'https://evil.example/x.jpg'}]}),JSON.stringify({...snap(),checkedAt:new Date(time+1000).toISOString()})])assert.equal(readWallpaperCache({storage:{getItem:()=>value},now:()=>time}),null);
 const blocked={getItem:()=>{throw Error('storage disabled')},setItem:()=>{throw Error('storage quota')}};
 assert.equal(readWallpaperCache({storage:blocked,now:()=>time}),null);
 assert.doesNotThrow(()=>writeWallpaperCache(snap(),{storage:blocked,now:()=>time}));
});

test('a background scan is checked again promptly instead of waiting another normal interval',async()=>{
 const doc=Object.assign(new EventTarget(),{hidden:false}),win=new EventTarget();let calls=0,sync;
 const result=await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{sync.stop();reject(Error('The stale gallery waited for the normal polling interval'))},1000);
  sync=startWallpaperSync({documentObject:doc,windowObject:win,interval:100000,retryInterval:5,request:async()=>({...snap(++calls===1?[item()]:[item(),item(2)]),stale:calls===1}),onUpdate:value=>{if(!value.stale){clearTimeout(timeout);sync.stop();resolve(value)}}});
 });
 assert.equal(calls,2);assert.equal(result.items.length,2);
});
