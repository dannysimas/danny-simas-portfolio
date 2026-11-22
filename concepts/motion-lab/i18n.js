import {languageKey, languageUrl, normalizeLanguage, resolveLanguage, translate, translateDocument} from './i18n-core.mjs';

let storage;
try { storage = window.localStorage; } catch { /* Query links also work without storage. */ }
const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
export const language = resolveLanguage(location.href, storage, browserLanguages);
export const t = (message, values) => translate(message, values, language);
export const formatNumber = number => Number(number).toLocaleString(language === 'en' ? 'en-US' : language);

document.documentElement.lang = language;
translateDocument(document.documentElement, language);
// Remember explicit choices, not an automatically detected starting language.
let preference = normalizeLanguage(new URL(location.href).searchParams.get('lang'));
try {
  if (preference) storage?.setItem(languageKey, preference);
  else preference = normalizeLanguage(storage?.getItem(languageKey));
} catch { /* Query links also carry the choice when storage is disabled. */ }

export function createLanguageSwitch() {
  const group = document.createElement('div');
  group.className = 'language-switch';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Language / Idioma');
  group.setAttribute('translate', 'no');
  for (const [code, label, name] of [['en', 'EN', 'English'], ['pt-BR', 'PT-BR', 'Português (Brasil)']]) {
    const link = document.createElement('a');
    link.textContent = label;
    link.lang = code;
    link.hreflang = code;
    link.title = name;
    link.setAttribute('aria-label', name);
    link.href = languageUrl(location.href, code);
    if (code === language) link.setAttribute('aria-current', 'true');
    link.addEventListener('click', event => {
      // A wallpaper preview may have added its ID to the URL since initialization.
      link.href = languageUrl(location.href, code);
      try { storage?.setItem(languageKey, code); } catch { /* URL remains the fallback. */ }
      if (code === language && new URL(location.href).searchParams.get('lang') === code) event.preventDefault();
    });
    group.append(link);
  }
  return group;
}

document.querySelector('.header-actions')?.prepend(createLanguageSwitch());

// Preserve the explicit choice across pages, including when localStorage is unavailable.
for (const link of document.querySelectorAll('a[href]')) {
  const url = new URL(link.href, location.href);
  if (url.origin === location.origin && /^\/(?:wallpapers\/|photomodes\/)?$/.test(url.pathname) && !link.closest('.language-switch')) {
    if (preference) link.href = languageUrl(url, language);
  }
}
