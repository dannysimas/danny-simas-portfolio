import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {analyticsChoiceKey,createGoogleTracker,setupGoogleAnalytics} from '../concepts/motion-lab/google-analytics.mjs';
import {translate} from '../concepts/motion-lab/i18n-core.mjs';
import pt from '../concepts/motion-lab/locales/pt-BR.js';

const id='G-TEST123456';
function environment(choice){
  const {document:doc,window}=parseHTML('<html><head></head><body><footer><div class="footer-bottom"></div></footer></body></html>');
  const values=new Map(choice?[[analyticsChoiceKey,choice]]:[]),listeners=new Map();
  const win={location:{hostname:'dannysimas.com'},localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},addEventListener:(name,fn)=>listeners.set(name,fn)};
  return {doc,win,values,listeners,click:element=>element.dispatchEvent(new window.Event('click'))};
}
const commands=win=>(win.dataLayer||[]).map(args=>Array.from(args));

test('Google sends nothing before consent, starts once, and revoking consent disables the tag and removes only its cookies',()=>{
  const {doc,win}=environment();
  const cookies=[];
  Object.defineProperty(doc,'cookie',{get:()=> 'ds_ga=abc; ds_ga_TEST123456=def; favourite=keep',set:value=>cookies.push({value,disabled:win['ga-disable-'+id]})});
  const tracker=createGoogleTracker({id,win,doc});
  assert.equal(doc.querySelectorAll('script').length,0);assert.equal(win.dataLayer,undefined);
  tracker.setConsent(false);assert.equal(doc.querySelectorAll('script').length,0);
  tracker.setConsent(true);tracker.setConsent(true);
  assert.equal(doc.querySelectorAll('script').length,1);
  assert.equal(doc.querySelector('script').src,'https://www.googletagmanager.com/gtag/js?id='+id);
  const calls=commands(win);
  assert.equal(calls[0][0],'consent');assert.equal(calls[0][1],'default');
  assert.ok(Object.values(calls[0][2]).every(value=>value==='denied'));
  assert.equal(calls[1][2].analytics_storage,'granted');assert.equal(calls[1][2].ad_storage,'denied');
  const config=calls.find(call=>call[0]==='config');assert.equal(config[1],id);
  assert.equal(config[2].allow_google_signals,false);assert.equal(config[2].allow_ad_personalization_signals,false);
  tracker.setConsent(false);
  assert.equal(win['ga-disable-'+id],true);assert.equal(commands(win).at(-1)[2].analytics_storage,'denied');
  assert.ok(cookies.length>0);assert.ok(cookies.every(cookie=>cookie.disabled&&cookie.value.startsWith('ds_ga')&&cookie.value.includes('Max-Age=0')));
  tracker.setConsent(true);assert.equal(win['ga-disable-'+id],false);
  assert.equal(doc.querySelectorAll('script').length,1);assert.equal(commands(win).filter(call=>call[0]==='config').length,1);
});

for(const language of ['en','pt-BR'])test(`${language}: cookie choices persist, reopen, revoke, and follow changes in other tabs`,()=>{
  const env=environment(),t=message=>translate(message,{},language);
  const ui=setupGoogleAnalytics({id,...env,t});
  assert.equal(ui.panel.hidden,false);assert.equal(env.doc.querySelectorAll('script').length,0);
  assert.equal(ui.allow.textContent,t('Allow analytics'));assert.equal(ui.decline.textContent,t('Decline'));
  env.click(ui.decline);assert.equal(env.values.get(analyticsChoiceKey),'decline');assert.equal(ui.panel.hidden,true);
  assert.equal(env.doc.querySelectorAll('script').length,0);
  env.click(ui.preferences);assert.equal(ui.panel.hidden,false);
  env.click(ui.allow);assert.equal(env.values.get(analyticsChoiceKey),'allow');assert.equal(env.doc.querySelectorAll('script').length,1);
  env.click(ui.preferences);env.click(ui.decline);assert.equal(env.win['ga-disable-'+id],true);
  env.values.set(analyticsChoiceKey,'allow');env.listeners.get('storage')({key:analyticsChoiceKey});assert.equal(env.win['ga-disable-'+id],false);
  env.values.clear();env.listeners.get('storage')({key:null});assert.equal(env.win['ga-disable-'+id],true);assert.equal(ui.panel.hidden,false);
  assert.equal(setupGoogleAnalytics({id,...env,t}),null);assert.equal(env.doc.querySelectorAll('#analytics-preferences').length,1);
});

test('remembered consent works on the next page; unknown, blocked storage and missing IDs fail without enabling Google',()=>{
  for(const choice of ['allow','decline','invalid',null]){
    const env=environment(choice),ui=setupGoogleAnalytics({id,...env});
    assert.equal(env.doc.querySelectorAll('script').length,choice==='allow'?1:0);
    assert.equal(ui.panel.hidden,choice==='allow'||choice==='decline');
  }
  const env=environment();Object.defineProperty(env.win,'localStorage',{get(){throw Error('storage blocked')}});
  const ui=setupGoogleAnalytics({id,...env});env.click(ui.allow);assert.equal(ui.panel.hidden,true);
  env.click(ui.preferences);env.click(ui.decline);assert.equal(env.win['ga-disable-'+id],true);
  for(const invalid of [undefined,'','123456','G-<script>','G-EXAMPLE ID']){
    const other=environment();assert.equal(setupGoogleAnalytics({id:invalid,...other}),null);assert.equal(other.doc.querySelectorAll('script,aside,button').length,0);
  }
});

test('all analytics preference text has Brazilian Portuguese translations',()=>{
  const source=fs.readFileSync(new URL('../concepts/motion-lab/google-analytics.mjs',import.meta.url),'utf8');
  for(const [,message]of source.matchAll(/\bt\('([^']+)'\)/g))assert.ok(Object.hasOwn(pt,message),message);
});

test('declining still succeeds when the browser blocks cookie access',()=>{
  const env=environment('allow');
  Object.defineProperty(env.doc,'cookie',{get(){throw Error('cookies blocked')},set(){throw Error('cookies blocked')}});
  const ui=setupGoogleAnalytics({id,...env});
  env.click(ui.preferences);env.click(ui.decline);
  assert.equal(env.win['ga-disable-'+id],true);assert.equal(ui.panel.hidden,true);
  assert.equal(env.values.get(analyticsChoiceKey),'decline');
});
