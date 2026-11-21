import '../navigation.js';
import '../graphic-details.js';
import {startWallpaperSync,catalogSignature} from './live-sync.mjs';
import source from './catalog.json';
import content from '../content.js';
import {socialIcons} from '../social-icons.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const downloadIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>';
const items=(Array.isArray(source)?source:source.items).map(x=>({...x,width:Number(x.width)||0,height:Number(x.height)||0,bytes:Number(x.bytes)||0}));
const itemMap=new Map(items.map(x=>[x.id,x]));
const formatBytes=bytes=>bytes?(bytes/1048576<1?`${Math.round(bytes/1024)} KB`:`${(bytes/1048576).toFixed(1)} MB`):'';
const screen=x=>x.width&&x.height?(x.width>x.height?'landscape':x.height>x.width?'portrait':'square'):(x.orientation||'unknown');
const screenLabel=x=>({landscape:'Desktop',portrait:'Phone',square:'Square'}[screen(x)]||'Original');
const details=x=>[x.width&&x.height?`${x.width.toLocaleString()} \u00d7 ${x.height.toLocaleString()}`:null,x.format?.toUpperCase(),formatBytes(x.bytes)].filter(Boolean).join(' \u00b7 ');
function updateCatalogControls(){
 const games=[...new Set(items.map(item=>item.game).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const selected=$('#game-filter').value;
 $('#game-filter').innerHTML='<option value="all">All games</option>'+games.map(game=>'<option value="'+escape(game)+'">'+escape(game)+'</option>').join('');
 $('#game-filter').value=games.includes(selected)?selected:'all';
 $('.vault-count').textContent=items.length.toLocaleString()+' originals / '+games.length+' game collections';
 $$('[data-orientation]').forEach(button=>button.querySelector('span').textContent=items.filter(item=>button.dataset.orientation==='all'||screen(item)===button.dataset.orientation).length.toLocaleString());
}
updateCatalogControls();
$$('.social-links').forEach(el=>el.innerHTML=content.socials.map(([name,url])=>`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(name)}" title="${escape(name)}">${el.classList.contains('social-icons')?socialIcons[name]:escape(name)}</a>`).join(''));
let orientation='all',visibleCount=24,filtered=[],activeItem=null,returnFocus=null,loadVersion=0;
const grid=$('#wallpaper-grid'),viewer=$('#wallpaper-viewer'),menu=$('#site-menu'),fullImage=$('#wallpaper-image'),visual=$('.wallpaper-visual');
function card(x,i){return `<article class="wallpaper-card" style="--i:${i%24}"><button class="wallpaper-art" type="button" data-open="${escape(x.id)}" aria-label="Open ${escape(x.game)} wallpaper"><img src="${escape(x.thumbnail)}" alt="${escape(x.game)} artwork by Danny Simas" ${x.width&&x.height?`width="${x.width}" height="${x.height}"`:''} loading="lazy" decoding="async"><span class="screen-badge">${screenLabel(x)}</span><span class="open-label">Open wallpaper \u2197</span></button><div class="wallpaper-info"><h2>${escape(x.game)}</h2><p class="file-meta">${escape(details(x))}</p><a class="card-download" data-download="${escape(x.id)}" href="${escape(x.download)}" download="${escape(x.filename)}" target="_blank" rel="noopener noreferrer" aria-label="Download original ${escape(x.game)} wallpaper">Download original ${downloadIcon}</a></div></article>`}
function render(reset=true){
 if(reset)visibleCount=24;
 const query=$('#wallpaper-search').value.trim().toLowerCase(),game=$('#game-filter').value,min=Number($('#resolution-filter').value)||0,sort=$('#sort-filter').value;
 filtered=items.filter(x=>(orientation==='all'||screen(x)===orientation)&&(game==='all'||x.game===game)&&Math.max(x.width,x.height)>=min&&(!query||`${x.title} ${x.game} ${x.collection} ${x.filename}`.toLowerCase().includes(query)));
 filtered.sort((a,b)=>{
  if(sort==='newest'||sort==='oldest'){
   const aDate=Date.parse(a.modified),bDate=Date.parse(b.modified),aDated=Number.isFinite(aDate),bDated=Number.isFinite(bDate);
   // Keep undated images last in either direction, and break date ties by name.
   if(aDated!==bDated)return aDated?-1:1;
   if(aDated&&aDate!==bDate)return sort==='newest'?bDate-aDate:aDate-bDate;
  }
  return `${a.game} ${a.title}`.localeCompare(`${b.game} ${b.title}`,undefined,{numeric:true});
 });
 grid.dataset.orientation=orientation;grid.innerHTML=filtered.slice(0,visibleCount).map(card).join('');
 $('#result-count').textContent=`${filtered.length.toLocaleString()} wallpaper${filtered.length===1?'':'s'}${game==='all'?'':` / ${game}`}`;
 $('#empty-state').hidden=filtered.length>0;$('#load-more').hidden=visibleCount>=filtered.length;
 $('.load-more-wrap').hidden=!filtered.length;$('#loaded-count').textContent=`Showing ${Math.min(visibleCount,filtered.length).toLocaleString()} of ${filtered.length.toLocaleString()}`;
}
function reset(){orientation='all';$('#wallpaper-search').value='';$('#game-filter').value='all';$('#resolution-filter').value='all';$('#sort-filter').value='newest';$$('[data-orientation]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.orientation==='all')));render()}
$$('[data-orientation]').forEach(button=>button.addEventListener('click',()=>{orientation=button.dataset.orientation;$$('[data-orientation]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render()}));
$('#wallpaper-search').addEventListener('input',()=>render());['game-filter','resolution-filter','sort-filter'].forEach(id=>$('#'+id).addEventListener('change',()=>render()));
$('#reset-filters').addEventListener('click',reset);$('#empty-reset').addEventListener('click',reset);
$('#load-more').addEventListener('click',()=>{const previous=visibleCount;visibleCount+=24;render(false);grid.querySelectorAll('[data-open]')[previous]?.focus({preventScroll:true})});
grid.addEventListener('click',event=>{const button=event.target.closest('[data-open]');if(button)openWallpaper(button.dataset.open,button)});
function lock(){document.body.classList.toggle('modal-open',!!$('dialog[open]'))}
function setUrl(id){const url=new URL(location.href);if(id)url.searchParams.set('wallpaper',id);else url.searchParams.delete('wallpaper');history.replaceState(null,'',url)}
function zoom(next){visual.classList.toggle('zoomed',next);$('#zoom-wallpaper').setAttribute('aria-pressed',String(next));$('#zoom-wallpaper').textContent=next?'Fit to screen':'Zoom preview';visual.scrollTo(0,0)}
function openWallpaper(id,trigger){
 const x=itemMap.get(id);if(!x)return;
 if(!viewer.open){returnFocus=trigger||document.activeElement;viewer.showModal();lock()}
 activeItem=x;const version=++loadVersion;zoom(false);$('#zoom-wallpaper').disabled=true;
 $('#wallpaper-title').textContent=x.game;$('#wallpaper-details').textContent=details(x);$('#wallpaper-filename').textContent=x.filename;
 $('#download-wallpaper').href=x.download;$('#download-wallpaper').download=x.filename;$('#download-wallpaper').textContent=`Download original${x.bytes?` \u00b7 ${formatBytes(x.bytes)}`:''}`;
 $('#share-status').textContent='';fullImage.alt=`${x.game} artwork by Danny Simas`;fullImage.src=x.thumbnail;
 $('#image-loading').hidden=false;$('#image-loading').textContent='Loading preview\u2026';
 const sequence=filtered.some(i=>i.id===id)?filtered:items;$('#wallpaper-position').textContent=`${sequence.findIndex(i=>i.id===id)+1} / ${sequence.length}`;
 $('#previous-wallpaper').disabled=sequence.length<2;$('#next-wallpaper').disabled=sequence.length<2;
 const image=new Image();image.onload=()=>{if(version!==loadVersion||!viewer.open)return;fullImage.src=image.src;$('#image-loading').hidden=true;$('#zoom-wallpaper').disabled=false};image.onerror=()=>{if(version!==loadVersion||!viewer.open)return;$('#image-loading').textContent='Preview unavailable. You can still download the original.'};image.src=x.preview;
 setUrl(id);viewer.scrollTo(0,0);
}
function step(amount){if(!activeItem)return;const sequence=filtered.some(x=>x.id===activeItem.id)?filtered:items;const index=sequence.findIndex(x=>x.id===activeItem.id);openWallpaper(sequence[(index+amount+sequence.length)%sequence.length].id)}
$('#previous-wallpaper').addEventListener('click',()=>step(-1));$('#next-wallpaper').addEventListener('click',()=>step(1));$('#close-wallpaper').addEventListener('click',()=>viewer.close());$('#zoom-wallpaper').addEventListener('click',()=>zoom(!visual.classList.contains('zoomed')));
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}});
viewer.addEventListener('close',()=>{++loadVersion;activeItem=null;setUrl(null);lock();returnFocus?.focus({preventScroll:true})});
$('#copy-wallpaper').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#share-status').textContent='Link copied'}catch{$('#share-status').textContent=`Copy this link: ${location.href}`}});
$('#menu-toggle').addEventListener('click',()=>{menu.showModal();lock()});$('#close-menu').addEventListener('click',()=>menu.close());menu.addEventListener('close',()=>{lock();$('#menu-toggle').focus({preventScroll:true})});$$('#site-menu nav a').forEach(a=>a.addEventListener('click',()=>menu.close()));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}));
const preference=matchMedia('(prefers-reduced-motion: reduce)');
function setMotion(reduced){document.body.classList.toggle('reduced',reduced)}
setMotion(preference.matches);preference.addEventListener('change',e=>setMotion(e.matches));
window.addEventListener('scroll',()=>$('header').classList.toggle('scrolled',scrollY>40),{passive:true});
render();let pendingSharedId=new URL(location.href).searchParams.get('wallpaper');
if(itemMap.has(pendingSharedId)){openWallpaper(pendingSharedId);pendingSharedId=null}

$('#filter-toggle').addEventListener('click',()=>{const expanded=$('#filter-toggle').getAttribute('aria-expanded')!=='true';$('#filter-toggle').setAttribute('aria-expanded',String(expanded));$('#advanced-filters').classList.toggle('expanded',expanded);$('#filter-toggle span').textContent=expanded?'\u2212':'+'});
$('header').classList.toggle('scrolled',scrollY>40);

// Update in place without resetting filters, load-more state, or an open preview.
let lastCatalogSignature=catalogSignature(items);
function applyCatalog(snapshot){
 const signature=catalogSignature(snapshot.items),changed=signature!==lastCatalogSignature;
 const focused=document.activeElement,focusedId=focused?.dataset.open||focused?.dataset.download,downloadFocused=!!focused?.dataset.download;
 const anchor=[...grid.querySelectorAll('.wallpaper-card')].find(card=>{const rect=card.getBoundingClientRect();return rect.bottom>130&&rect.top<innerHeight});
 const anchorId=anchor?.querySelector('[data-open]')?.dataset.open,anchorTop=anchor?.getBoundingClientRect().top;
 items.splice(0,items.length,...snapshot.items);itemMap.clear();items.forEach(item=>itemMap.set(item.id,item));
 if(!changed){
  grid.querySelectorAll('[data-open]').forEach(button=>{const item=itemMap.get(button.dataset.open),image=button.querySelector('img');if(item&&image&&image.getAttribute('src')!==item.thumbnail)image.src=item.thumbnail});
  return;
 }
 lastCatalogSignature=signature;updateCatalogControls();render(false);
 if(anchorId){const replacement=grid.querySelector('[data-open="'+anchorId+'"]')?.closest('.wallpaper-card');if(replacement){const delta=replacement.getBoundingClientRect().top-anchorTop;if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'})}}
 if(pendingSharedId&&itemMap.has(pendingSharedId)){openWallpaper(pendingSharedId);pendingSharedId=null;return}
 if(focusedId){const replacement=grid.querySelector('['+(downloadFocused?'data-download':'data-open')+'="'+focusedId+'"]');(replacement||grid).focus({preventScroll:true})}
}
const liveSync=startWallpaperSync({onUpdate:applyCatalog,canApply:()=>!document.querySelector('dialog[open]')});
viewer.addEventListener('close',()=>liveSync.flush());menu.addEventListener('close',()=>liveSync.flush());
