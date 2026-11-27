import {inject} from '@vercel/analytics';

// Keep local previews and temporary deployments out of the public site's totals.
if(import.meta.env.PROD && ['dannysimas.com','www.dannysimas.com'].includes(window.location.hostname)){
  inject({mode:'production'});
}
