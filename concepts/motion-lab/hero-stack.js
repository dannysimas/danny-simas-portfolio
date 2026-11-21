import './hero-card-details.css';
import './hero-responsive.css';

// Rotate actual artwork cards through the existing collage positions.
export function setupHeroStack({hero,floats,caption,onFrame}){
  const cards=[hero,...floats];
  const titles=['Clair Obscur: Expedition 33','Resident Evil','God of War','Tomb Raider','Devil May Cry'];
  const stack=document.createElement('div');stack.className='hero-stack';
  hero.before(stack);cards.forEach(card=>{card.classList.add('stack-card');stack.append(card)});
  const images=cards.map(card=>card.querySelector('img'));
  const frames=cards.map((card,index)=>{
    const details=document.createElement('span');
    details.className='hero-card-graphics';details.setAttribute('aria-hidden','true');
    details.innerHTML=`<span class="hero-card-sheen"></span><svg class="hero-card-frame" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><defs><linearGradient id="hero-frame-${index}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#67e8f9"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><path class="hero-frame-outline" stroke="url(#hero-frame-${index})"/><path class="hero-frame-cyan"/><path class="hero-frame-violet"/></svg><span class="hero-card-stamp">DS / ${String(index+1).padStart(2,'0')}</span><span class="hero-card-registration"></span><span class="hero-card-hatch"></span>`;
    card.append(details);
    return {outline:details.querySelector('.hero-frame-outline'),cyan:details.querySelector('.hero-frame-cyan'),violet:details.querySelector('.hero-frame-violet'),cut:null};
  });
  const desktop=[{x:57,y:12,w:33,h:78,r:6},{x:39,y:16,w:27,h:62,r:-12},{x:74,y:15,w:24,h:63,r:12},{x:45,y:38,w:27,h:58,r:-7},{x:68,y:39,w:27,h:55,r:9}];
  const phone=[{x:32,y:17,w:65,h:70,r:6},{x:4,y:20,w:53,h:55,r:-12},{x:54,y:18,w:49,h:55,r:12},{x:16,y:44,w:57,h:42,r:-7},{x:47,y:41,w:50,h:45,r:9}];
  const layers=[5,1,2,3,4],loads=new Map();
  const clamp=n=>Math.min(1,Math.max(0,n)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
  let front=0,transition=null,timer=null,eligible=false,generation=0;
  function describe(){
    stack.dataset.front=titles[front];caption.querySelector('.eyebrow').textContent=titles[front].toUpperCase();
    images.forEach((img,i)=>{img.alt=i===front?titles[i]+' artwork by Danny Simas':''});
    cards.forEach((card,i)=>card.classList.toggle('is-front',i===front));
  }
  function prepare(index){
    if(loads.has(index))return loads.get(index);
    const img=images[index],full=img.src.replace('/thumbs/','/full/');
    const ready=full===img.src?Promise.resolve():new Promise(resolve=>{
      const next=new Image();next.onload=()=>{img.src=full;resolve()};next.onerror=resolve;next.src=full;
    });
    loads.set(index,ready);return ready;
  }
  function schedule(){
    if(!eligible||transition||timer!==null)return;
    const next=(front+1)%cards.length,ready=prepare(next),token=++generation;
    timer=setTimeout(async()=>{
      await ready;
      if(token!==generation)return;
      timer=null;
      if(!eligible||document.hidden||document.body.classList.contains('modal-open'))return;
      transition={start:performance.now(),next};onFrame();
    },4600);
  }
  function cancelTimer(){if(timer!==null){clearTimeout(timer);timer=null;++generation}}
  function render({progress:p,expansion:o,px,py,mobile,reduced}){
    eligible=!reduced&&p<.025&&!document.hidden&&!document.body.classList.contains('modal-open');
    if(!eligible)cancelTimer();
    if(reduced&&transition){transition=null;stack.dataset.shuffling='false'}
    let amount=transition?clamp((performance.now()-transition.start)/1250):0;
    if(transition&&amount===1){front=transition.next;transition=null;amount=0;describe()}
    const t=ease(amount),slots=mobile?phone:desktop;
    function pose(slot){
      const s=slots[slot],lead=slot===0,sign=slot%2===1?-1:1;
      return {x:lead?mix(s.x,0,o):s.x,y:lead?mix(s.y,0,o):s.y,w:lead?mix(s.w,100,o):s.w,h:lead?mix(s.h,100,o):s.h,r:lead?mix(s.r,0,o):s.r+sign*p*8,dx:lead?px*12*(1-o):sign*p*innerWidth*.18+px*slot*7,dy:lead?py*9*(1-o):-p*(90+(slot-1)*45)+py*(slot+1)*5,opacity:lead?1:1-clamp(p*2),light:lead?1:.8,cut:lead?4*(1-o):0,focal:lead?mix(37,18,o):50};
    }
    cards.forEach((card,i)=>{
      const from=(i-front+cards.length)%cards.length,to=transition?(i-transition.next+cards.length)%cards.length:from;
      const a=pose(from),b=pose(to),value=key=>mix(a[key],b[key],t),lift=transition?Math.sin(amount*Math.PI)*(1-o):0;
      card.style.left=value('x')+'%';card.style.top=value('y')+'%';card.style.width=value('w')+'%';card.style.height=value('h')+'%';
      const dx=value('dx')+(from===0?lift*innerWidth*.045:0),dy=value('dy')-(to===0?lift*innerHeight*.04:0);
      card.style.transform='translate3d('+dx+'px,'+dy+'px,0) rotate('+value('r')+'deg)';
      card.style.opacity=value('opacity');card.style.zIndex=layers[amount<.44?from:to];
      const cut=value('cut');card.style.clipPath='polygon('+cut+'% 0,100% 0,'+(100-cut)+'% 100%,0 100%)';
      card.style.setProperty('--hero-detail-opacity',1-o);
      card.style.setProperty('--hero-card-cut',cut+'%');
      // Follow the existing slanted crop as cards shuffle and expand.
      const detail=frames[i],roundedCut=Math.round(cut*100)/100;
      if(detail.cut!==roundedCut){
        const left=y=>2+roundedCut*(1-y/100),right=y=>98-roundedCut*y/100;
        detail.outline.setAttribute('d',`M${left(2)} 2H${right(2)}L${right(98)} 98H${left(98)}Z`);
        detail.cyan.setAttribute('d',`M${left(14)} 14L${left(2)} 2H${left(2)+13}`);
        detail.violet.setAttribute('d',`M${right(86)} 86L${right(98)} 98H${right(98)-13}`);
        detail.cut=roundedCut;
      }
      card.style.setProperty('--card-light',value('light'));images[i].style.objectPosition='center '+value('focal')+'%';
    });
    stack.dataset.shuffling=String(!!transition);schedule();return !!transition;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){eligible=false;cancelTimer()}onFrame()});
  new MutationObserver(onFrame).observe(document.body,{attributes:true,attributeFilter:['class']});
  describe();return {render};
}
