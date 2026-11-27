import './navigation.js';
import './analytics.js';
import './graphic-details.js';
import {setupHeroStack} from './hero-stack.js';
import { socialIcons } from './social-icons.js';
import { setupMarquee } from './marquee.js';
﻿import sourceContent from './content.js';
import {t,language,formatNumber} from './i18n.js';
import {localizeContent} from './i18n-core.mjs';
const content=localizeContent(sourceContent,language);
// Keep the earlier preview link working after moving this library to its own page.
if(location.hash==='#photomodes')location.replace(new URL('./photomodes/',location.href));
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t, ease=t=>t*t*(3-2*t);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {folders,collabs,stats,wins,faqs,socials,about,media}=content;
const track=$('.track'), gallery=$('.gallery-window'), work=$('.work'), intro=$('.intro'), hero=$('.hero-art'), copy=$('.hero-copy'), caption=$('.hero-caption'), statement=$('.statement');
track.innerHTML=folders.map(f=>`<button class="piece" type="button" aria-label="${escape(t('Explore {game} collection, {count} images',{game:f.title,count:formatNumber(f.images.length)}))}"><span class="art-image"><img src="${f.images[0].thumb}" alt="${escape(t('{game} artwork by Danny Simas',{game:f.title}))}" loading="lazy" draggable="false"><span class="view-art">${t('Explore collection')}</span><span class="piece-count">${t('{count} images',{count:formatNumber(f.images.length)})}</span></span><span class="art-caption"><strong>${escape(f.title)}</strong><span>${escape(f.type)}</span></span></button>`).join('');
$('#about-copy').innerHTML=about.map(p=>`<p class="description">${escape(p)}</p>`).join('');
$('.stats-grid').innerHTML=stats.map(([value,label,icon],i)=>`<div class="stat reveal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icon}"/></svg><p ${i===0?'aria-label="'+t('80K+')+'"':''}><span ${i===0?'id="audience-count" aria-hidden="true"':''}>${value}</span></p><span>${escape(label)}</span></div>`).join('');
$('.partner-filters').innerHTML=[t('All partners'),...collabs.map(x=>x[0])].map((label,i)=>`<button aria-pressed="${i===0}" data-filter="${i-1}">${escape(label)}</button>`).join('');
$('.partner-groups').innerHTML=collabs.map(([title,items],i)=>`<div class="partner-group" data-group="${i}"><h3>${escape(title)}</h3><div>${items.map(item=>`<span>${escape(item)}</span>`).join('')}</div></div>`).join('');
const orderedWins=[wins.at(-1),...wins.slice(0,-1)];
$('.recognition-list').innerHTML=orderedWins.map((win,i)=>`<article class="recognition-row reveal ${i===0?'featured':''}"><p class="eyebrow">${escape(win.label)}</p><h3>${escape(win.title)}</h3><p>${escape(win.text)}</p></article>`).join('');
$('.media-grid').innerHTML=media.map(([title,items])=>`<div class="media-item reveal"><h3>${escape(title)}</h3><ul>${items.map(item=>`<li>${escape(item)}</li>`).join('')}</ul></div>`).join('');
$('.faq-list').innerHTML=faqs.map(({question,answer},i)=>`<details ${i===0?'open':''}><summary>${escape(question)}<span aria-hidden="true">+</span></summary><div><p>${escape(answer)}</p></div></details>`).join('');
$$('.social-links').forEach(el=>el.innerHTML=socials.map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${name}" title="${name}">${el.classList.contains('social-icons')?socialIcons[name]:name}</a>`).join(''));
const pieces=$$('.piece'),floats=$$('.floater'),wordHeading=statement.querySelector('h2'),words=wordHeading.textContent.split(' ');
wordHeading.setAttribute('aria-label',wordHeading.textContent);wordHeading.innerHTML=words.map(w=>`<span aria-hidden="true">${w}</span>`).join(' ');
const wordEls=[...wordHeading.children],preference=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=preference.matches,mobile=innerWidth<=700,gridMode=false,metrics={},y=scrollY,target=scrollY,px=0,py=0,tx=0,ty=0,frame=0,active=-1,drag=null,dragged=false;
const heroStack=setupHeroStack({hero,floats,caption,onFrame:tick});
function tick(){if(!frame)frame=requestAnimationFrame(render)}
function measure(){mobile=innerWidth<=700;metrics={intro:Math.max(1,intro.offsetHeight-innerHeight),workTop:work.getBoundingClientRect().top+scrollY,workTravel:Math.max(1,work.offsetHeight-innerHeight),trackTravel:Math.max(0,track.scrollWidth-gallery.clientWidth),statementTop:statement.getBoundingClientRect().top+scrollY,statementHeight:statement.offsetHeight};target=scrollY;$('#hint').textContent=t(gridMode?'Choose a collection to see every image':mobile||reduced?'Swipe or use the controls':'Scroll or drag to explore');tick()}
function setMotion(next){reduced=next;document.body.classList.toggle('reduced',reduced);[hero,copy,caption,...floats].forEach(el=>el.removeAttribute('style'));hero.querySelector('img').style.objectPosition='';$('.stage').style.removeProperty('--collage-shade');if(reduced)track.style.transform='';y=scrollY;measure()}
preference.addEventListener('change',e=>setMotion(e.matches));
function position(index){if(index===active)return;active=index;$('#position').textContent=`${index+1} / ${pieces.length}`;$('#previous').disabled=index===0;$('#next').disabled=index===pieces.length-1}
function render(){frame=0;y=reduced?target:lerp(y,target,.13);px=reduced?0:lerp(px,tx,.06);py=reduced?0:lerp(py,ty,.06);$('header').classList.toggle('scrolled',scrollY>40);document.body.classList.toggle('hero-menu-visible',scrollY<innerHeight*(reduced ? .7 : .25));$('.progress').style.transform=`scaleX(${clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))})`;
const p=reduced?0:clamp(y/metrics.intro),o=ease(clamp((p-.08)/.75)),shuffling=heroStack.render({progress:p,expansion:o,px,py,mobile,reduced});
if(!reduced){const exit=ease(clamp(p/.52));copy.style.transform='translate3d('+(-exit*45)+'px,'+(-exit*100)+'px,0) scale('+(1-exit*.12)+')';copy.style.opacity=1-exit;copy.style.visibility=exit>=.999?'hidden':'visible';$('.stage').style.setProperty('--collage-shade',String(1-o));const c=ease(clamp((p-.66)/.22));caption.style.opacity=c;caption.style.transform='translateY('+((1-c)*35)+'px)';const sp=clamp((y-metrics.statementTop+innerHeight*.8)/(metrics.statementHeight*.7));wordEls.forEach((el,i)=>el.classList.toggle('lit',i/words.length<sp))}
if(!mobile&&!reduced&&!gridMode){const p=clamp((y-metrics.workTop)/metrics.workTravel);track.style.transform=`translate3d(${-p*metrics.trackTravel}px,0,0)`;$('.track-progress i').style.transform=`scaleX(${.03+p*.97})`;position(Math.round(p*(pieces.length-1)))}
if(shuffling||Math.abs(y-target)>.2||Math.abs(px-tx)>.002||Math.abs(py-ty)>.002)tick()}
function go(index){index=clamp(index,0,pieces.length-1);const behavior=reduced?'instant':'smooth';if(mobile||reduced)gallery.scrollTo({left:pieces[index].offsetLeft-innerWidth*.08,behavior});else scrollTo({top:metrics.workTop+index/(pieces.length-1)*metrics.workTravel,behavior})}
$('#previous').addEventListener('click',()=>go(active-1));$('#next').addEventListener('click',()=>go(active+1));
$('#layout-toggle').addEventListener('click',()=>{gridMode=!gridMode;work.classList.toggle('grid-mode',gridMode);$('#layout-toggle').textContent=t(gridMode?'Motion view':'Grid view');$('#layout-toggle').setAttribute('aria-pressed',String(gridMode));track.style.transform='';gallery.scrollLeft=0;measure();scrollTo({top:metrics.workTop,behavior:'instant'});y=scrollY;position(0)});
gallery.addEventListener('scroll',()=>{if((!mobile&&!reduced)||gridMode)return;const p=clamp(gallery.scrollLeft/Math.max(1,gallery.scrollWidth-gallery.clientWidth));position(Math.round(p*(pieces.length-1)));$('.track-progress i').style.transform=`scaleX(${.03+p*.97})`},{passive:true});
track.addEventListener('pointerdown',e=>{dragged=false;if(mobile||reduced||gridMode||e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,y:scrollY}});
window.addEventListener('pointermove',e=>{if(drag){const d=e.clientX-drag.x;if(Math.abs(d)>6)dragged=true;if(dragged)scrollTo({top:clamp(drag.y-d/Math.max(1,metrics.trackTravel)*metrics.workTravel,metrics.workTop,metrics.workTop+metrics.workTravel),behavior:'instant'})}if(!reduced&&!mobile){tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;tick()}},{passive:true});
window.addEventListener('pointerup',()=>{drag=null});window.addEventListener('pointercancel',()=>{drag=null});window.addEventListener('scroll',()=>{target=scrollY;tick()},{passive:true});window.addEventListener('resize',measure,{passive:true});
pieces.forEach((piece,index)=>{piece.addEventListener('click',()=>{if(dragged){dragged=false;return}openCollection(index)});piece.addEventListener('pointermove',e=>{if(reduced||mobile||drag)return;const r=piece.getBoundingClientRect();piece.style.setProperty('--tx',`${((e.clientX-r.left)/r.width-.5)*7}deg`);piece.style.setProperty('--ty',`${-((e.clientY-r.top)/r.height-.5)*5}deg`)});piece.addEventListener('pointerleave',()=>{piece.style.setProperty('--tx','0deg');piece.style.setProperty('--ty','0deg')})});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});$$('.reveal').forEach(el=>observer.observe(el));
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const selected=Number(button.dataset.filter);$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$$('[data-group]').forEach(group=>group.hidden=selected!==-1&&Number(group.dataset.group)!==selected);measure()}));
$$('.faq-list details').forEach(el=>el.addEventListener('toggle',measure));
const statObserver=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;statObserver.disconnect();if(reduced)return;const start=performance.now();function count(now){const p=clamp((now-start)/1500);$('#audience-count').textContent=t('{count}K+',{count:Math.round(80*(1-Math.pow(1-p,3)))});if(p<1&&!reduced)requestAnimationFrame(count);else $('#audience-count').textContent=t('80K+')}requestAnimationFrame(count)},{threshold:.4});statObserver.observe($('.audience'));
const collection=$('#collection'),viewer=$('#viewer'),menu=$('#site-menu');let folderIndex=0,imageIndex=0,collectionTrigger=null,imageTrigger=null,menuTrigger=null;
function lock(){document.body.classList.toggle('modal-open',!!$('dialog[open]'))}
function renderCollection(index){folderIndex=index;const f=folders[index];$('#collection-title').textContent=f.title;$('#collection-meta').textContent=`${f.type} · ${t('{count} images',{count:formatNumber(f.images.length)})}`;
$('.collection-tabs').innerHTML=folders.map((folder,i)=>`<button data-collection="${i}" aria-pressed="${i===index}">${escape(folder.title)}</button>`).join('');
$('.collection-grid').innerHTML=f.images.map((img,i)=>`<button data-image="${i}" aria-label="${escape(t('Open {game} image {number} of {count}',{game:f.title,number:i+1,count:f.images.length}))}"><img src="${img.thumb}" alt="${escape(t('{game} artwork {number}',{game:f.title,number:i+1}))}" loading="lazy"><span>${t('View image {number}',{number:i+1})}</span></button>`).join('');
$$('[data-collection]').forEach(b=>b.addEventListener('click',()=>{renderCollection(Number(b.dataset.collection));collection.scrollTo({top:0,behavior:'instant'});$(`[data-collection="${folderIndex}"]`).focus({preventScroll:true})}));
$$('[data-image]').forEach(b=>b.addEventListener('click',()=>{imageTrigger=b;showImage(Number(b.dataset.image));viewer.showModal();lock()}));}
function openCollection(index){collectionTrigger=document.activeElement;renderCollection(index);collection.showModal();collection.scrollTop=0;lock()}
function showImage(index){const folder=folders[folderIndex];imageIndex=(index+folder.images.length)%folder.images.length;const img=folder.images[imageIndex];$('#image-error').hidden=true;$('#viewer-image').src=img.full;$('#viewer-image').alt=t('{game} artwork {number} by Danny Simas',{game:folder.title,number:imageIndex+1});$('#viewer-title').textContent=folder.title;$('#image-position').textContent=`${imageIndex+1} / ${folder.images.length}`;$('#download-image').href=img.full;$('#download-image').download=`Danny-Simas-${folder.title.replace(/[^a-z0-9]+/gi,'-')}-${imageIndex+1}.webp`}
$('#viewer-image').addEventListener('error',()=>$('#image-error').hidden=false);
$('#close-collection').addEventListener('click',()=>collection.close());$('#close-viewer').addEventListener('click',()=>viewer.close());$('#viewer-next').addEventListener('click',()=>showImage(imageIndex+1));$('#viewer-previous').addEventListener('click',()=>showImage(imageIndex-1));
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();showImage(imageIndex+1)}if(e.key==='ArrowLeft'){e.preventDefault();showImage(imageIndex-1)}});
let touchStart=null;$('#viewer-image').addEventListener('touchstart',e=>{touchStart={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});$('#viewer-image').addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)showImage(imageIndex+(dx<0?1:-1));touchStart=null},{passive:true});
viewer.addEventListener('close',()=>{lock();imageTrigger?.focus({preventScroll:true})});collection.addEventListener('close',()=>{lock();collectionTrigger?.focus({preventScroll:true});measure()});
$$('#menu-toggle,[data-open-menu]').forEach(button=>button.addEventListener('click',()=>{menuTrigger=button;menu.showModal();lock()}));$('#close-menu').addEventListener('click',()=>menu.close());menu.addEventListener('close',()=>{lock();(menuTrigger||$('#menu-toggle')).focus({preventScroll:true})});
$$('#site-menu nav a').forEach(a=>a.addEventListener('click',()=>menu.close()));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}));
$('#contact-form').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type="submit"]'),status=form.querySelector('.form-status');if(button.disabled)return;button.disabled=true;button.textContent=t('Sending…');status.textContent='';try{const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('Submission failed');form.reset();status.textContent=t('Message sent. I’ll get back to you soon.');status.className='form-status success'}catch{status.textContent=t('Something went wrong. Please try again, or contact me through Instagram.');status.className='form-status error'}finally{button.disabled=false;button.textContent=t('Send Message');measure()}});
setMotion(reduced);position(0);document.fonts.ready.then(measure);window.addEventListener('load',measure,{once:true});

// Re-measure after the embedded feed adjusts its own height.
new ResizeObserver(measure).observe(document.querySelector('.instagram-shell'));

setupMarquee(document.querySelector('.ribbon'));
