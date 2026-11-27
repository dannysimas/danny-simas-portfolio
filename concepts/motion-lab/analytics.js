import {inject} from '@vercel/analytics';
import {setupGoogleAnalytics} from './google-analytics.mjs';
import {t} from './i18n.js';
import './analytics.css';

// Keep local previews and temporary deployments out of the public site's totals.
if(import.meta.env.PROD && ['dannysimas.com','www.dannysimas.com'].includes(window.location.hostname)){
  inject({mode:'production'});
  setupGoogleAnalytics({id:import.meta.env.VITE_GOOGLE_ANALYTICS_ID,win:window,doc:document,t});
}
