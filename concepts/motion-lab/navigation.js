// Full-screen navigation with artwork previews; existing open/close handlers are retained.
import {t,createLanguageSwitch} from './i18n.js';
const menu=document.querySelector('#site-menu');
if(menu){
  const trigger=document.querySelector('#menu-toggle'),close=document.querySelector('#close-menu');
  trigger.innerHTML='<span class="trigger-desktop">'+t('Explore')+'</span><span class="trigger-compact">Menu</span><span class="menu-glyph" aria-hidden="true"><i></i><i></i></span>';
  trigger.setAttribute('aria-label',t('Open navigation menu'));trigger.setAttribute('aria-controls','site-menu');
  close.innerHTML=t('Close')+' <span class="close-glyph" aria-hidden="true"></span>';close.setAttribute('aria-label',t('Close menu'));
  const configs={
    work:{label:'Selected work',image:'/images/gallery/expedition-33/full/01.webp',caption:'Worlds in frame.',detail:'Cinematic artwork. Worlds worth a closer look.'},
    wallpapers:{label:'Wallpapers',image:'/images/gallery/resident-evil/thumbs/01.webp',caption:'Make it your world.',detail:'Find your next wallpaper. Take it with you.'},
    photomodes:{label:'Photomodes',image:"/wallpapers/assets/50c0311f08252293aa-preview.jpg",caption:'Your lens. Your world.',detail:'Custom photomodes created by Danny Simas.'},
    about:{label:'About me',image:'/images/about/about-danny.webp',caption:'Behind the frame.',detail:'An artist\'s eye. A creator\'s reach.'},
    collabs:{label:'Collaborations',image:'/images/gallery/god-of-war/thumbs/01.webp',caption:'Shared ambition.',detail:'Studios. Publishers. Gaming hardware.'},
    'media-kit':{label:'Media kit',image:'/images/gallery/dmc/thumbs/01.webp',caption:'Beyond the frame.',detail:'Reach, audience, and ways to collaborate.'},
    faq:{label:'Quick answers',image:'/images/gallery/tomb-raider/thumbs/01.webp',caption:'A closer look.',detail:'The details behind the work.'},
    contact:{label:'Let\'s talk',image:'/images/gallery/pragmata/thumbs/01.webp',caption:'Make an impact.',detail:'Let\'s make something impossible to ignore.'}
  };
  const links=[...menu.querySelectorAll('nav a')];
  const primary=document.createElement('nav');primary.className='menu-primary';primary.setAttribute('aria-label',t('Main navigation'));
  const secondary=document.createElement('nav');secondary.className='menu-secondary';secondary.setAttribute('aria-label',t('More to explore'));
  let index=0;
  for(const link of links){
    const url=new URL(link.href);const key=url.pathname.match(/\/(wallpapers|photomodes)\/?$/)?.[1]||url.hash.slice(1);
    const config=configs[key];
    if(!config){secondary.append(link);continue}
    link.dataset.preview=key;link.style.setProperty('--item',index);link.replaceChildren();
    const number=document.createElement('span');number.className='menu-index';number.textContent=String(++index).padStart(2,'0');number.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.className='menu-text';label.textContent=t(config.label);link.append(number,label);primary.append(link);
  }
  const art=document.createElement('div');art.className='menu-art';art.setAttribute('aria-hidden','true');art.innerHTML='<img alt="" class="is-visible"><img alt=""><div class="menu-art-caption"><strong></strong><p></p></div>';
  const body=document.createElement('div');body.className='menu-body';body.append(primary);
  const bottom=document.createElement('div');bottom.className='menu-bottom';const bottomLeft=document.createElement('div');bottomLeft.className='menu-bottom-left';
  const socials=menu.querySelector('.social-links'),head=menu.querySelector('.menu-head');
  socials.classList.add('social-icons');bottomLeft.append(secondary,createLanguageSwitch());bottom.append(bottomLeft,socials);menu.replaceChildren(art,head,body,bottom);
  const images=[...art.querySelectorAll('img')],caption=art.querySelector('strong'),detail=art.querySelector('p');let front=0,version=0,selected='',preloaded=false;
  function preview(key){
    if(key===selected)return;selected=key;const config=configs[key],token=++version,next=1-front,img=images[next];
    caption.textContent=t(config.caption);detail.textContent=t(config.detail);
    primary.querySelectorAll('a').forEach(a=>a.classList.toggle('is-previewed',a.dataset.preview===key));
    img.onload=()=>{if(token!==version)return;images[front].classList.remove('is-visible');img.classList.add('is-visible');front=next};
    img.src=config.image;
  }
  primary.querySelectorAll('a').forEach(link=>{link.addEventListener('pointerenter',()=>preview(link.dataset.preview));link.addEventListener('focus',()=>preview(link.dataset.preview))});
  function current(){
    const page=location.pathname.match(/\/(wallpapers|photomodes)\/?$/)?.[1];if(page)return page;
    let key='work';for(const link of primary.querySelectorAll('a')){const url=new URL(link.href),section=url.pathname===location.pathname&&url.hash?document.getElementById(url.hash.slice(1)):null;if(section&&section.getBoundingClientRect().top<=180)key=link.dataset.preview}return key;
  }
  new MutationObserver(()=>{
    document.querySelectorAll('#menu-toggle,[data-open-menu]').forEach(button=>button.setAttribute('aria-expanded',String(menu.open)));
    if(menu.open){const key=current();primary.querySelectorAll('a').forEach(a=>{if(a.dataset.preview===key)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});preview(key);if(!preloaded){preloaded=true;Object.values(configs).forEach(config=>{const image=new Image();image.src=config.image})}}
  }).observe(menu,{attributes:true,attributeFilter:['open']});
  trigger.setAttribute('aria-expanded','false');preview(current());
}
