import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import portuguese from '../concepts/motion-lab/locales/pt-BR.js';
import content from '../concepts/motion-lab/content.js';
import photomodes from '../concepts/motion-lab/photomodes-data.js';
import {createFavourites, favouritesKey} from '../concepts/motion-lab/wallpapers/favourites.mjs';
import {languageKey, languageUrl, normalizeLanguage, resolveLanguage, translate, translateDocument, localizeContent} from '../concepts/motion-lab/i18n-core.mjs';

const root = new URL('../concepts/motion-lab/', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const pages = ['index.html', 'wallpapers/index.html', 'photomodes/index.html'];
const unchanged = new Set(['DANNY', 'SIMAS', 'SIMAS.', 'DANNY SIMAS', 'Danny Simas', 'Menu', 'CLAIR OBSCUR: EXPEDITION 33', '@dannysimas']);

test('explicit language wins; saved choice and disabled storage have predictable fallbacks', () => {
  const storage = {getItem: () => 'pt-BR'};
  assert.equal(resolveLanguage('https://dannysimas.com/', storage), 'pt-BR');
  assert.equal(resolveLanguage('https://dannysimas.com/?lang=en', storage), 'en');
  assert.equal(resolveLanguage('https://dannysimas.com/?lang=pt-br'), 'pt-BR');
  assert.equal(resolveLanguage('https://dannysimas.com/?lang=fr'), 'en');
  assert.equal(resolveLanguage('https://dannysimas.com/', {getItem() {throw Error('blocked');}}), 'en');
  const url = new URL(languageUrl('https://dannysimas.com/wallpapers/?wallpaper=abc#library', 'pt-BR'));
  assert.equal(url.searchParams.get('wallpaper'), 'abc');
  assert.equal(url.searchParams.get('lang'), 'pt-BR');
  assert.equal(url.hash, '#library');
});

test('every translation preserves its interpolation values', () => {
  const tokens = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const [english, pt] of Object.entries(portuguese)) assert.deepEqual(tokens(pt), tokens(english), english);
  assert.equal(translate('Download {game} photomode', {game: 'Kingdom Hearts 3'}, 'pt-BR'), 'Baixar modo foto de Kingdom Hearts 3');
  assert.equal(translate('Copy this link: {url}', {url: 'https://example.com/{game}'}, 'pt-BR'), 'Copie este link: https://example.com/{game}');
  assert.equal(translate('constructor', {}, 'pt-BR'), 'constructor');
});

test('browser preference order selects Portuguese regional variants and preserves explicit choices', () => {
  const url = 'https://dannysimas.com/';
  for (const locale of ['pt', 'pt-BR', 'pt-PT', 'pt-AO', 'PT-br']) {
    assert.equal(resolveLanguage(url, undefined, [locale, 'en-US']), 'pt-BR');
  }
  assert.equal(resolveLanguage(url, undefined, ['en-GB', 'pt-BR']), 'en');
  assert.equal(resolveLanguage(url, undefined, ['fr-FR', 'pt-PT', 'en']), 'pt-BR');
  assert.equal(resolveLanguage(url, undefined, ['fr-FR', 'de-DE']), 'en');
  assert.equal(resolveLanguage(url, undefined, []), 'en');
  assert.equal(resolveLanguage(url, {getItem() {throw Error('blocked');}}, ['pt-BR']), 'pt-BR');
  assert.equal(resolveLanguage(url, {getItem: () => 'en'}, ['pt-BR']), 'en');
  assert.equal(resolveLanguage(url, {getItem: () => 'pt-BR'}, ['en-US']), 'pt-BR');
  assert.equal(resolveLanguage(url + '?lang=en', {getItem: () => 'pt-BR'}, ['pt-BR']), 'en');
  assert.equal(resolveLanguage(url + '?lang=pt-BR', {getItem: () => 'en'}, ['en-US']), 'pt-BR');
  assert.equal(resolveLanguage(url + '?lang=fr', {getItem: () => 'invalid'}, ['pt-BR']), 'pt-BR');
});

for (const page of pages) test(`${page}: all authored static text has Portuguese coverage; links and control values survive`, () => {
  const {document} = parseHTML(read(page));
  document.normalize();
  const nodes = [];
  function visit(node) {
    if (['SCRIPT', 'STYLE'].includes(node.tagName)) return;
    if (node.nodeType === 3 && /[A-Za-z]/.test(node.textContent)) {
      const text = node.textContent.trim();
      assert.ok(Object.hasOwn(portuguese, text) || unchanged.has(text), `Missing: ${text}`);
      nodes.push([node, text]);
    }
    if (node.nodeType === 1) for (const key of ['aria-label', 'alt', 'title', 'placeholder']) {
      const text = node.getAttribute(key);
      if (text) assert.ok(Object.hasOwn(portuguese, text) || unchanged.has(text), `Missing ${key}: ${text}`);
    }
    for (const child of node.childNodes) visit(child);
  }
  visit(document);
  const links = [...document.querySelectorAll('[href]')].map(node => [node, node.getAttribute('href')]);
  const values = [...document.querySelectorAll('option')].map(node => [node, node.value]);
  translateDocument(document.documentElement, 'pt-BR');
  for (const [node, english] of nodes) assert.equal(node.textContent.trim(), portuguese[english] ?? english);
  for (const [node, href] of links) assert.equal(node.getAttribute('href'), href);
  for (const [node, value] of values) assert.equal(node.value, value);
  assert.ok(document.querySelector('title').textContent.includes('Danny Simas'));
  if (page.includes('photomodes')) {
    const notes = document.querySelector('.photomode-terms').textContent;
    assert.match(notes, /obrigatório dar crédito a @dannysimas como criador/);
    assert.match(notes, /Correções e futuras atualizações não são garantidas/);
    assert.match(notes, /arquivo README incluído/);
  }
});

test('portfolio data is fully translated while names, art and destinations remain unchanged', () => {
  const translated = localizeContent(content, 'pt-BR');
  assert.deepEqual(translated.socials, content.socials);
  const text = [...content.about, ...content.folders.map(x => x.type), ...content.stats.flatMap(x => x.slice(0, 2)), ...content.collabs.map(x => x[0]), ...content.wins.flatMap(x => [x.label, x.text]), ...content.faqs.flatMap(x => [x.question, x.answer]), ...content.media.flatMap(([title, items]) => [title, ...items])];
  for (const value of text) assert.ok(Object.hasOwn(portuguese, value), value);
  translated.folders.forEach((folder, i) => {assert.equal(folder.title, content.folders[i].title);assert.deepEqual(folder.images, content.folders[i].images);});
  translated.wins.forEach((win, i) => assert.equal(win.title, content.wins[i].title));
  assert.deepEqual(localizeContent(content, 'en'), content);
});

// DOM integration checks, without a browser or network: execute the real rendering
// and interaction code. Only layout/animation, network and unsupported DOM APIs are stubbed.
function pageContext(page, lang, {languages = ['en-US'], browserLanguage = 'en-US', savedLanguage, storageBlocked = false} = {}) {
  const {document, window} = parseHTML(read(page));
  const location = new URL(`https://dannysimas.com/${page.replace('index.html', '')}${lang ? '?lang=' + lang : ''}`);
  for (const link of document.querySelectorAll('a[href]')) link.href = new URL(link.getAttribute('href'), location).href;
  for (const select of document.querySelectorAll('select')) {
    Object.defineProperty(select, 'value', {
      configurable: true,
      get() {return this.querySelector('option[selected]')?.value ?? this.querySelector('option')?.value ?? '';},
      set(value) {for (const option of this.querySelectorAll('option')) {if (option.value === value) option.setAttribute('selected', '');else option.removeAttribute('selected');}}
    });
  }
  for (const node of document.querySelectorAll('*')) {node.scrollTo = () => {};node.focus = () => {};}
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.showModal = () => {dialog.open = true;};
    dialog.close = () => {dialog.open = false;dialog.dispatchEvent(new window.Event('close'));};
  }
  document.fonts = {ready: {then() {}}};
  const saved = new Map(savedLanguage ? [[languageKey, savedLanguage]] : []);
  const localStorage = {
    getItem: key => {if (storageBlocked) throw Error('blocked');return saved.get(key);},
    setItem: (key, value) => {if (storageBlocked) throw Error('blocked');saved.set(key, value);}
  };
  const context = vm.createContext({document, location, URL, console, localStorage,
    languageKey, languageUrl, normalizeLanguage, resolveLanguage, translate, translateDocument, localizeContent, createFavourites, favouritesKey,
    sourceContent: content, content, photomodes, socialIcons: {},
    innerWidth: 390, innerHeight: 844, scrollY: 0, performance,
    addEventListener() {}, requestAnimationFrame() {}, scrollTo() {}, scrollBy() {},
    matchMedia: () => ({matches: false, addEventListener() {}}),
    IntersectionObserver: class {observe() {} unobserve() {} disconnect() {}},
    ResizeObserver: class {observe() {}}, MutationObserver: class {observe() {}},
    Image: class {}, setupHeroStack: () => ({render: () => false}), setupMarquee() {},
    readWallpaperCache: () => null, writeWallpaperCache() {}, catalogSignature: x => JSON.stringify(x),
    startWallpaperSync: options => {context.syncOptions = options;return {flush() {}};},
    navigator: {languages, language: browserLanguage, clipboard: {writeText: async () => {}}},
    history: {replaceState: (_, __, url) => {context.location = new URL(url);}},
    source: JSON.parse(read('wallpapers/catalog.json')),
    AbortSignal, FormData: class {}, fetch: async () => ({ok: true})
  });
  context.window = context;
  const run = file => {
    const script = read(file).replace(/^\uFEFF?import .*;\r?$/gm, '').replace(/^export /gm, '');
    vm.runInContext(file === 'i18n.js' ? script : `(() => {${script}\n})();`, context, {filename: file});
  };
  run('i18n.js');
  return {context, document, window, run, saved};
}

for (const page of pages) test(`${page}: browser detection translates first visits without saving an automatic choice`, () => {
  const {document, window, saved} = pageContext(page, undefined, {languages: ['pt-PT', 'en-US']});
  assert.equal(document.documentElement.lang, 'pt-BR');
  assert.equal(saved.has(languageKey), false);
  assert.equal(document.querySelector('.language-switch [aria-current]').textContent, 'PT-BR');
  assert.ok([...document.querySelectorAll('a[href]')].filter(link => {
    const url = new URL(link.href, 'https://dannysimas.com');
    return url.origin === 'https://dannysimas.com' && !link.closest('.language-switch');
  }).every(link => !new URL(link.href, 'https://dannysimas.com').searchParams.has('lang')));
  // Selecting even the detected language is now a deliberate, remembered choice.
  const selected = document.querySelector('.language-switch [aria-current]');
  const click = new window.Event('click', {cancelable: true});
  selected.dispatchEvent(click);
  assert.equal(saved.get(languageKey), 'pt-BR');
  assert.equal(click.defaultPrevented, false);
  assert.equal(new URL(selected.href).searchParams.get('lang'), 'pt-BR');
  const returning = pageContext(page, undefined, {languages: ['pt-BR'], savedLanguage: 'en'});
  assert.equal(returning.document.documentElement.lang, 'en');
  const english = pageContext(page, undefined, {languages: ['en-US', 'pt-BR']});
  assert.equal(english.document.documentElement.lang, 'en');
});

test('single-language browsers and disabled storage still support automatic language and manual links', () => {
  const {document, window, saved} = pageContext('index.html', undefined, {languages: [], browserLanguage: 'pt-BR', storageBlocked: true});
  assert.equal(document.documentElement.lang, 'pt-BR');
  const english = document.querySelector('.language-switch a[lang="en"]');
  english.dispatchEvent(new window.Event('click', {cancelable: true}));
  assert.equal(new URL(english.href).searchParams.get('lang'), 'en');
  assert.equal(saved.size, 0);
  const next = pageContext('index.html', 'en', {languages: ['pt-BR'], storageBlocked: true});
  assert.equal(next.document.documentElement.lang, 'en');
  assert.equal(new URL(next.document.querySelector('a[href*="/wallpapers/"]').href).searchParams.get('lang'), 'en');
});

for (const lang of ['en', 'pt-BR']) {
  test(`${lang}: language links preserve the current preview and remember the choice`, () => {
    const {context, document, window, saved} = pageContext('wallpapers/index.html', lang);
    const other = lang === 'en' ? 'pt-BR' : 'en';
    assert.equal(document.documentElement.lang, lang);
    assert.equal(saved.get(languageKey), lang);
    context.location.searchParams.set('wallpaper', 'shared-image');
    const link = [...document.querySelectorAll('.language-switch a')].find(node => node.lang === other);
    link.dispatchEvent(new window.Event('click', {cancelable: true}));
    assert.equal(new URL(link.href).searchParams.get('wallpaper'), 'shared-image');
    assert.equal(new URL(link.href).searchParams.get('lang'), other);
    assert.equal(saved.get(languageKey), other);
  });

  test(`${lang}: photomode downloads keep their exact URLs and game names`, () => {
    const {document, run} = pageContext('photomodes/index.html', lang);
    run('photomodes.js');
    assert.equal(document.querySelectorAll('.photomode-card').length, photomodes.length);
    photomodes.forEach(mode => {
      const card = document.getElementById('photomode-' + mode.id);
      assert.equal(card.querySelector('h3').getAttribute('aria-label'), mode.game);
      for (const link of card.querySelectorAll('.photomode-cover-link,.photomode-download')) {
        assert.equal(link.href, mode.downloadUrl);
        assert.equal(link.getAttribute('aria-label'), translate('Download {game} photomode', {game: mode.game}, lang));
      }
    });
    assert.match(document.querySelector('.photomode-cover-title').textContent, lang === 'pt-BR' ? /BAIXAR/ : /DOWNLOAD/);
  });

  test(`${lang}: favourites work on cards, in previews and with existing game filters`, () => {
    const {document, window, run, saved} = pageContext('wallpapers/index.html', lang);
    run('wallpapers/main.js');
    const select = document.querySelector('#game-filter');
    select.value = 'Resident Evil';select.dispatchEvent(new window.Event('change'));
    const button = document.querySelector('[data-favourite]'), id = button.dataset.favourite;
    button.dispatchEvent(new window.Event('click', {bubbles: true}));
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('#wallpaper-viewer').open, undefined);
    assert.ok(JSON.parse(saved.get(favouritesKey)).ids.includes(id));
    document.querySelector('#favourites-filter').dispatchEvent(new window.Event('click'));
    assert.equal(document.querySelectorAll('.wallpaper-card').length, 1);
    document.querySelector('[data-open]').dispatchEvent(new window.Event('click', {bubbles: true}));
    const preview = document.querySelector('#favourite-wallpaper');
    assert.equal(preview.getAttribute('aria-pressed'), 'true');
    preview.dispatchEvent(new window.Event('click'));
    assert.equal(preview.getAttribute('aria-pressed'), 'false');
    assert.equal(document.querySelectorAll('.wallpaper-card').length, 0);
    assert.equal(document.querySelector('#empty-state h2').textContent, translate('No favourites to show.', {}, lang));
    assert.equal(select.value, 'Resident Evil');
    assert.equal(document.querySelector('#wallpaper-viewer').open, true);
    document.querySelector('#close-wallpaper').dispatchEvent(new window.Event('click'));
    document.querySelector('#empty-reset').dispatchEvent(new window.Event('click'));
    assert.equal(document.querySelector('#favourites-filter').getAttribute('aria-pressed'), 'false');
    assert.ok(document.querySelectorAll('.wallpaper-card').length > 1);
  });

  test(`${lang}: wallpaper game filtering, preview, zoom, reset and live refresh stay functional`, () => {
    const {context, document, window, run} = pageContext('wallpapers/index.html', lang);
    run('wallpapers/main.js');
    const select = document.querySelector('#game-filter');
    assert.equal(select.querySelector('option').textContent, translate('All games', {}, lang));
    select.value = 'Resident Evil';
    select.dispatchEvent(new window.Event('change'));
    const titles = [...document.querySelectorAll('.wallpaper-info h2')];
    assert.ok(titles.length > 0);
    assert.ok(titles.every(node => node.textContent === 'Resident Evil'));
    context.syncOptions.onUpdate({items: context.source});
    assert.equal(select.value, 'Resident Evil');
    const image = document.querySelector('[data-open]');
    image.dispatchEvent(new window.Event('click', {bubbles: true}));
    assert.equal(document.querySelector('#wallpaper-title').textContent, 'Resident Evil');
    const item = context.source.find(item => item.id === image.dataset.open);
    assert.equal(new URL(document.querySelector('#download-wallpaper').getAttribute('href')).href, new URL(item.download).href);
    assert.equal(context.location.searchParams.get('lang'), lang);
    document.querySelector('#zoom-wallpaper').dispatchEvent(new window.Event('click'));
    assert.equal(document.querySelector('#zoom-wallpaper').textContent, translate('Fit to screen', {}, lang));
    document.querySelector('#reset-filters').dispatchEvent(new window.Event('click'));
    assert.equal(select.value, 'all');
  });

  test(`${lang}: portfolio, collections, navigation and form feedback are localized`, async () => {
    const {context, document, window, run} = pageContext('index.html', lang);
    run('navigation.js');
    // main.js declares its own content binding from the localized source.
    run('main.js');
    assert.equal(document.querySelector('.menu-text').textContent, translate('Selected work', {}, lang));
    assert.equal(document.querySelectorAll('.language-switch').length, 2);
    assert.equal(document.querySelector('.faq-list summary').firstChild.textContent, translate(content.faqs[0].question, {}, lang));
    document.querySelector('.piece').dispatchEvent(new window.Event('click'));
    assert.equal(document.querySelector('#collection-title').textContent, content.folders[0].title);
    assert.match(document.querySelector('#collection-meta').textContent, lang === 'pt-BR' ? /imagens/ : /images/);
    const form = document.querySelector('#contact-form');form.reset = () => {};
    form.dispatchEvent(new window.Event('submit', {cancelable: true}));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(document.querySelector('.form-status').textContent, translate('Message sent. I’ll get back to you soon.', {}, lang));
    context.fetch = async () => {throw Error('offline');};
    form.dispatchEvent(new window.Event('submit', {cancelable: true}));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(document.querySelector('.form-status').textContent, translate('Something went wrong. Please try again, or contact me through Instagram.', {}, lang));
    assert.equal(form.querySelector('[type=submit]').disabled, false);
  });
}
