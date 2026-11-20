import fs from 'node:fs';
const source = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const extract = name => {
  const match = source.match(new RegExp('const ' + name + ' = (\\[[\\s\\S]*?\\n\\]);'));
  if (!match) throw new Error('Missing source content: ' + name);
  return match[1];
};
const factory = source.slice(source.indexOf('function makeGalleryImages'), source.indexOf('const nav'));
const folders = new Function(factory + '; return folders;')();
const data = { folders };
for (const name of ['collabs', 'stats', 'wins']) data[name] = new Function('return ' + extract(name))();
const faqSource = extract('faqs').replace(/\(\s*<>[\s\S]*?<\/ >\s*\)/g, '').replace(/\(\s*<>([\s\S]*?)<\/>\s*\)/g, (_, text) => JSON.stringify(text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()));
data.faqs = new Function('return ' + faqSource)();
data.socials = [...extract('socials').matchAll(/\["([^"]+)", "([^"]+)"/g)].map(([, name, url]) => [name, url]);
const about = source.match(/<section id="about"[\s\S]*?<div className="tag-row">/)[0];
data.about = [...about.matchAll(/<p>\s*([\s\S]*?)\s*<\/p>/g)].map(([, text]) => text.replace(/\s+/g, ' ').trim());
const media = source.match(/<div className="media-grid">\s*\{(\[[\s\S]*?\])\.map/)[1];
data.media = new Function('return ' + media)();
for (const folder of folders) for (const image of folder.images) for (const path of Object.values(image)) {
  if (!fs.existsSync(new URL('../../public' + path, import.meta.url))) throw new Error('Missing artwork ' + path);
}
fs.writeFileSync(new URL('content.js', import.meta.url), '// Derived from src/App.jsx by sync-content.mjs.\nexport default ' + JSON.stringify(data, null, 2) + ';\n');
console.log('Preserved:', folders.length, 'collections;', folders.reduce((n, f) => n + f.images.length, 0), 'images;', data.collabs.flatMap(x => x[1]).length, 'collaborators;', data.wins.length, 'recognition items;', data.faqs.length, 'FAQs;', data.socials.length, 'social links.');
