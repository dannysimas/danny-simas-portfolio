export const analyticsChoiceKey='dannysimas-google-analytics-choice-v1';
export const validMeasurementId=id=>/^G-[A-Z0-9]{5,20}$/.test(id||'');
const denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};

export function readAnalyticsChoice(win){
  try{const value=win.localStorage.getItem(analyticsChoiceKey);return ['allow','decline'].includes(value)?value:null}catch{return null}
}

function clearAnalyticsCookies(win,doc){
  // This integration uses its own prefix so other site cookies are untouched.
  try{
  const names=(doc.cookie||'').split(';').map(cookie=>cookie.trim().split('=')[0]).filter(name=>/^ds_ga(?:_|$)/.test(name));
  const domains=['',win.location.hostname,'.'+win.location.hostname,'.dannysimas.com'];
  for(const name of names)for(const domain of domains){
    doc.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure${domain?'; Domain='+domain:''}`;
  }
  }catch{/* The disable flag still blocks Google when browser cookie access is unavailable. */}
}

export function createGoogleTracker({id,win,doc}){
  if(!validMeasurementId(id))return null;
  let started=false,allowed=false;
  win['ga-disable-'+id]=true;
  return {
    setConsent(allow){
      allow=allow===true;
      if(allow===allowed){if(!allow)clearAnalyticsCookies(win,doc);return}
      allowed=allow;
      win['ga-disable-'+id]=!allow;
      if(!allow){
        if(started)win.gtag('consent','update',{...denied});
        clearAnalyticsCookies(win,doc);
        return;
      }
      if(!started){
        win.dataLayer=win.dataLayer||[];
        win.gtag=win.gtag||function(){win.dataLayer.push(arguments)};
        win.gtag('consent','default',{...denied});
        win.gtag('consent','update',{...denied,analytics_storage:'granted'});
        win.gtag('js',new Date());
        win.gtag('config',id,{
          allow_google_signals:false,
          allow_ad_personalization_signals:false,
          cookie_prefix:'ds',
          cookie_flags:'SameSite=Lax;Secure'
        });
        const script=doc.createElement('script');
        script.async=true;
        script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
        doc.head.append(script);
        started=true;
      }else{
        win.gtag('consent','update',{...denied,analytics_storage:'granted'});
      }
    }
  };
}

export function setupGoogleAnalytics({id,win,doc,t=message=>message}){
  if(!validMeasurementId(id)||doc.getElementById('analytics-preferences'))return null;
  const tracker=createGoogleTracker({id,win,doc});
  const panel=doc.createElement('aside');
  panel.id='analytics-preferences';panel.className='analytics-consent';
  panel.setAttribute('aria-labelledby','analytics-consent-title');
  const copy=doc.createElement('div');copy.className='analytics-consent-copy';
  const title=doc.createElement('h2');title.id='analytics-consent-title';title.textContent=t('A little insight. A better website.');
  const description=doc.createElement('p');description.textContent=t('Allow Google Analytics cookies to help me understand visits and improve the website? You can change your choice anytime in Analytics preferences.');
  const details=doc.createElement('details');
  const summary=doc.createElement('summary');summary.textContent=t('About these analytics');
  const explanation=doc.createElement('p');explanation.textContent=t('Google Analytics measures visits, pages viewed, devices, and traffic sources. Advertising personalization is off. Vercel also provides cookie-free visitor statistics independently of this choice.');
  const policy=doc.createElement('a');policy.href='https://policies.google.com/technologies/partner-sites';policy.target='_blank';policy.rel='noopener noreferrer';policy.textContent=t('How Google uses this information');
  details.append(summary,explanation,policy);copy.append(title,description,details);
  const actions=doc.createElement('div');actions.className='analytics-consent-actions';
  const decline=doc.createElement('button'),allow=doc.createElement('button');
  decline.type=allow.type='button';decline.textContent=t('Decline');allow.textContent=t('Allow analytics');
  actions.append(decline,allow);panel.append(copy,actions);doc.body.append(panel);
  const preferences=doc.createElement('button');preferences.type='button';preferences.className='analytics-preferences-link';
  preferences.textContent=t('Analytics preferences');preferences.setAttribute('aria-controls',panel.id);preferences.setAttribute('aria-expanded','false');
  (doc.querySelector('.footer-bottom')||doc.body).append(preferences);
  let openedFromPreferences=false;
  function apply(choice){
    tracker.setConsent(choice==='allow');panel.hidden=choice!==null;
    preferences.setAttribute('aria-expanded',String(!panel.hidden));
  }
  function choose(choice){
    try{win.localStorage.setItem(analyticsChoiceKey,choice)}catch{/* Keep the choice for this page when storage is unavailable. */}
    apply(choice);
    if(openedFromPreferences)preferences.focus({preventScroll:true});
    openedFromPreferences=false;
  }
  decline.addEventListener('click',()=>choose('decline'));
  allow.addEventListener('click',()=>choose('allow'));
  preferences.addEventListener('click',()=>{
    panel.hidden=false;openedFromPreferences=true;
    preferences.setAttribute('aria-expanded','true');decline.focus({preventScroll:true});
  });
  win.addEventListener('storage',event=>{
    if(event.key===analyticsChoiceKey||event.key===null)apply(readAnalyticsChoice(win));
  });
  apply(readAnalyticsChoice(win));
  return {panel,preferences,allow,decline};
}
