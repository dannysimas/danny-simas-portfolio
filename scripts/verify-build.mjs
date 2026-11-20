import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('dist');
function exists(url){const clean=url.split(/[?#]/)[0];const file=path.resolve(root,'.'+clean);assert.ok(file.startsWith(root+path.sep),'Asset must stay in the build');assert.ok(fs.existsSync(file),'Missing built file: '+url)}
for(const page of ['index.html','wallpapers/index.html','photomodes/index.html']){
 const html=fs.readFileSync(path.join(root,page),'utf8');
 assert.ok(!/noindex|127\.0\.0\.1|localhost/.test(html),'Development metadata in '+page);
 assert.match(html,/<link rel="canonical" href="https:\/\/dannysimas\.com/);
 for(const [,url]of html.matchAll(/(?:src|href)="(\/(?!\/)[^"]+)"/g))exists(url);
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(home,/EVERY FRAME/);assert.match(home,/google-site-verification/);
assert.match(home,/formspree\.io\/f\/xnjrobky/);assert.match(home,/\.\/wallpapers\//);assert.match(home,/\.\/photomodes\//);
const catalog=JSON.parse(fs.readFileSync('concepts/motion-lab/wallpapers/catalog.json','utf8'));
for(const item of catalog){exists(item.thumbnail);exists(item.preview)}
const content=(await import('../concepts/motion-lab/content.js')).default;
for(const collection of content.folders)for(const image of collection.images)for(const asset of Object.values(image))exists(asset);
for(const file of ['catalog.json','source-inventory.json','import-dropbox.mjs'])assert.ok(!fs.existsSync(path.join(root,'wallpapers',file)),'Maintenance file accidentally published');
exists('/robots.txt');exists('/sitemap.xml');exists('/favicon.png');
console.log('Production package verified: 3 pages, '+catalog.length*2+' wallpaper previews, all portfolio images, metadata, and contact form.');
