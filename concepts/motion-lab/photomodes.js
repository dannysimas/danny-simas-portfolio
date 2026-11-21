import photomodes from './photomodes-data.js';
const list=document.querySelector('#photomode-list');
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el}
function safeUrl(value){if(!value)return null;try{const url=new URL(value,location.href);return ['http:','https:'].includes(url.protocol)?url:null}catch{return null}}
if(list){
  photomodes.forEach((mode,index)=>{
    const number=String(index+1).padStart(2,'0');
    const article=element('article','photomode-card reveal');article.id='photomode-'+mode.id;article.setAttribute('aria-labelledby',article.id+'-title');
    const visual=element('div','photomode-visual');visual.setAttribute('aria-hidden','true');
    const preview=safeUrl(mode.preview);
    if(preview){visual.classList.add('photomode-cover');const img=element('img');img.src=preview.href;img.alt='';img.width=600;img.height=900;img.loading='lazy';img.decoding='async';visual.append(img)}
    else{visual.classList.add('photomode-abstract');visual.append(element('span','photomode-number',number),element('span','photomode-reticle'),element('span','photomode-visual-label','PM / '+number),element('span','photomode-visual-caption','DANNY SIMAS / PHOTOMODES'));}
    const body=element('div','photomode-card-body');body.append(element('p','eyebrow','CUSTOM PHOTOMODE'));
    const title=element('h3');title.id=article.id+'-title';title.setAttribute('aria-label',mode.game);
    (mode.lines||[mode.game]).forEach(line=>title.append(element('span','',line)));body.append(title);
    const meta=[mode.platform,mode.version?('Version '+mode.version):null].filter(Boolean);
    if(meta.length)body.append(element('p','photomode-meta',meta.join(' / ')));
    const download=safeUrl(mode.downloadUrl);
    if(download){
      const link=element('a','photomode-download','Download photomode');link.href=download.href;link.setAttribute('aria-label','Download '+mode.game+' photomode');
      if(download.origin===location.origin){link.download=mode.fileName||''}else{link.target='_blank';link.rel='noopener noreferrer'}
      const icon=element('span','','\u2193');icon.setAttribute('aria-hidden','true');link.append(icon);body.append(link);
    }else{
      const pending=element('p','photomode-pending');const dot=element('span','');dot.setAttribute('aria-hidden','true');pending.append(dot,document.createTextNode('Download coming soon'));body.append(pending);
    }
    if(mode.requirements?.length||mode.installation?.length){
      const details=element('details','photomode-setup'),summary=element('summary','','Setup & compatibility'),content=element('div','photomode-setup-content');
      const icon=element('span','','+');icon.setAttribute('aria-hidden','true');summary.append(icon);details.append(summary);
      if(mode.requirements?.length){content.append(element('h4','','Requirements'));const requirements=element('ul');mode.requirements.forEach(line=>requirements.append(element('li','',line)));content.append(requirements)}
      if(mode.installation?.length){content.append(element('h4','','Installation'));const steps=element('ol');mode.installation.forEach(line=>steps.append(element('li','',line)));content.append(steps)}
      details.append(content);body.append(details);
    }
    article.append(visual,body);list.append(article);
  });
}
