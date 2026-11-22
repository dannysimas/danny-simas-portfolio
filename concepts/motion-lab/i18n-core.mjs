import portuguese from './locales/pt-BR.js';

export const languageKey = 'dannysimas-language';
export const normalizeLanguage = value => /^pt(?:-br)?$/i.test(value || '') ? 'pt-BR' : value === 'en' ? 'en' : null;

export function resolveLanguage(url, storage, browserLanguages = []) {
  const explicit = normalizeLanguage(new URL(url).searchParams.get('lang'));
  if (explicit) return explicit;
  try {
    const saved = normalizeLanguage(storage?.getItem(languageKey));
    if (saved) return saved;
  } catch { /* Browser preferences still work when storage is disabled. */ }
  // Match the visitor's preferred supported language, in browser preference order.
  // All Portuguese regional variants use the site's Brazilian Portuguese edition.
  for (const locale of browserLanguages) {
    if (/^pt(?:-|$)/i.test(locale)) return 'pt-BR';
    if (/^en(?:-|$)/i.test(locale)) return 'en';
  }
  return 'en';
}

export function languageUrl(url, language) {
  const next = new URL(url);
  next.searchParams.set('lang', normalizeLanguage(language) || 'en');
  return next.href;
}

export function translate(message, values = {}, language = 'en') {
  const template = language === 'pt-BR' && Object.hasOwn(portuguese, message) ? portuguese[message] : message;
  // Values are inserted only once; callers escape them when producing HTML.
  return template.replace(/\{(\w+)\}/g, (token, key) => Object.hasOwn(values, key) ? String(values[key]) : token);
}

export function localizeContent(content, language) {
  const t = text => translate(text, {}, language);
  return {
    ...content,
    folders: content.folders.map(folder => ({...folder, type: t(folder.type)})),
    about: content.about.map(t),
    collabs: content.collabs.map(([label, names]) => [t(label), names]),
    stats: content.stats.map(([value, label, icon]) => [t(value), t(label), icon]),
    wins: content.wins.map(win => ({...win, label: t(win.label), text: t(win.text)})),
    faqs: content.faqs.map(({question, answer}) => ({question: t(question), answer: t(answer)})),
    media: content.media.map(([title, items]) => [t(title), items.map(t)])
  };
}

// Translate authored static text once, before page animations split headings into words.
// Inline emphasis, icons, form values, URLs and event targets retain their original nodes.
export function translateDocument(root, language) {
  if (language !== 'pt-BR') return;
  root.normalize();
  const attributes = ['aria-label', 'aria-description', 'title', 'alt', 'placeholder'];
  function walk(node) {
    if (node.nodeType === 3) {
      const source = node.textContent;
      const key = source.trim();
      if (Object.hasOwn(portuguese, key)) node.textContent = source.replace(key, () => portuguese[key]);
      return;
    }
    if (node.nodeType === 1) {
      if (['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT'].includes(node.tagName) || node.getAttribute('translate') === 'no') return;
      for (const attribute of attributes) {
        if (node.hasAttribute(attribute)) node.setAttribute(attribute, translate(node.getAttribute(attribute), {}, language));
      }
      if (node.tagName === 'META' && ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'].includes(node.getAttribute('name') || node.getAttribute('property'))) {
        node.setAttribute('content', translate(node.getAttribute('content'), {}, language));
      }
    }
    for (const child of [...node.childNodes]) walk(child);
  }
  walk(root);
}
