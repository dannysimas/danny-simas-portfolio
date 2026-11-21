import '../navigation.js';
import '../graphic-details.js';
import '../photomodes.js';
import content from '../content.js';
import {socialIcons} from '../social-icons.js';
const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
$$('.social-links').forEach(group=>{
  for(const [name,url] of content.socials){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',name);link.title=name;link.innerHTML=socialIcons[name];group.append(link)}
});
$('#photomode-count').textContent=String($$('.photomode-card').length).padStart(2,'0')+' PHOTOMODES';
const menu=$('#site-menu'),trigger=$('#menu-toggle');
trigger.addEventListener('click',()=>{menu.showModal();document.body.classList.add('modal-open')});
$('#close-menu').addEventListener('click',()=>menu.close());
menu.addEventListener('close',()=>{document.body.classList.remove('modal-open');trigger.focus({preventScroll:true})});
$$('#site-menu nav a').forEach(link=>link.addEventListener('click',()=>menu.close()));
const preference=matchMedia('(prefers-reduced-motion: reduce)');
function setMotion(reduced){document.body.classList.toggle('reduced',reduced)}
setMotion(preference.matches);preference.addEventListener('change',event=>setMotion(event.matches));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.08});
$$('.reveal').forEach(card=>observer.observe(card));
function updateHeader(){$('header').classList.toggle('scrolled',scrollY>40)}
window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();
