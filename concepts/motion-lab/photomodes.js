import photomodes from './photomodes-data.js';
const list=document.querySelector('#photomode-list');
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el}
function safeUrl(value){if(!value)return null;try{const url=new URL(value,location.href);return ['http:','https:'].includes(url.protocol)?url:null}catch{return null}}
function configureDownload(link,url,mode){link.href=url.href;link.setAttribute('aria-label','Download '+mode.game+' photomode');if(url.origin===location.origin){link.download=mode.fileName||''}else{link.target='_blank';link.rel='noopener noreferrer'}}
if(list){
  photomodes.forEach((mode,index)=>{
    const number=String(index+1).padStart(2,'0');
    const article=element('article','photomode-card reveal');article.id='photomode-'+mode.id;article.setAttribute('aria-labelledby',article.id+'-title');
    const download=safeUrl(mode.downloadUrl);
    const visual=element(download?'a':'div','photomode-visual');if(download){visual.classList.add('photomode-cover-link');configureDownload(visual,download,mode)}else{visual.setAttribute('aria-hidden','true')}
    const preview=safeUrl(mode.preview);
    if(preview){visual.classList.add('photomode-cover');const img=element('img');img.src=preview.href;img.alt='';img.width=600;img.height=900;img.loading='lazy';img.decoding='async';visual.append(img)}
    else{visual.classList.add('photomode-abstract');visual.append(element('span','photomode-number',number),element('span','photomode-reticle'),element('span','photomode-visual-label','PM / '+number),element('span','photomode-visual-caption','DANNY SIMAS / PHOTOMODES'));}
    if(download){const overlay=element('span','photomode-cover-overlay'),label=element('span','photomode-cover-cta','Download photomode');overlay.setAttribute('aria-hidden','true');label.append(element('span','photomode-cover-icon','\u2193'));overlay.append(label);visual.append(overlay)}
    const body=element('div','photomode-card-body');body.append(element('p','eyebrow','CUSTOM PHOTOMODE'));
    const title=element('h3');title.id=article.id+'-title';title.setAttribute('aria-label',mode.game);
    (mode.lines||[mode.game]).forEach(line=>title.append(element('span','',line)));body.append(title);
    const meta=[mode.platform,mode.version?('Version '+mode.version):null].filter(Boolean);
    if(meta.length)body.append(element('p','photomode-meta',meta.join(' / ')));
    if(download){
      const link=element('a','photomode-download','Download photomode');configureDownload(link,download,mode);
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
