// Import only public image originals from Danny's shared wallpaper vault.
// Run from the project root: node --use-system-ca concepts/motion-lab/wallpapers/import-dropbox.mjs
// Public share metadata is read without account credentials. Only curated file metadata is saved.
import { mkdir, readFile, writeFile, rename, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const dir = dirname(fileURLToPath(import.meta.url));
const rootUrl = 'https://www.dropbox.com/scl/fo/0bsc2st5y0wg8spgdb4sp/AHljdX9bm0UpCSD2-wZwE00?rlkey=fkyymnse9fio3rx2kp85f8g5b&dl=0';
const base = '/wallpapers/assets/';
const limit = Number(process.env.WALLPAPER_IMPORT_LIMIT || Infinity);
const cookies = new Map();
const inventory = { source: rootUrl, importedAt: new Date().toISOString(), complete: false, folders: [], excluded: [], errors: [], imageCount: 0 };
const catalog = [];
let old = [];
try { old = JSON.parse(await readFile(join(dir, 'catalog.json'), 'utf8')); } catch {}
const oldItems = new Map(old.map(x => [x.id, x]));
const images = new Map();
let publishing = Promise.resolve();

function rememberCookies(response) {
  for (const value of response.headers.getSetCookie()) {
    const pair = value.split(';')[0], i = pair.indexOf('=');
    cookies.set(pair.slice(0, i), pair.slice(i + 1));
  }
}
async function request(url, options = {}) {
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (e) { error = e; }
  }
  throw error;
}
async function listFolder(url) {
  const parsed = new URL(url), parts = parsed.pathname.split('/').filter(Boolean);
  let voucher, entries = [], pages = 0;
  do {
    const body = new URLSearchParams({ link_key: parts[2], link_type: 'c', secure_hash: parts[3], sub_path: parts.slice(4).map(decodeURIComponent).join('/'), rlkey: parsed.searchParams.get('rlkey'), t: cookies.get('t') || '' });
    if (voucher) body.set('voucher', typeof voucher === 'string' ? voucher : JSON.stringify(voucher));
    const response = await request('https://www.dropbox.com/list_shared_link_folder_entries', { method: 'POST', body, headers: { Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '), Referer: url } });
    rememberCookies(response);
    const data = await response.json();
    if (!Array.isArray(data.entries)) throw new Error('Invalid folder response');
    entries.push(...data.entries);
    voucher = data.has_more_entries ? data.next_request_voucher : null;
    pages++;
    if (data.has_more_entries && !voucher) throw new Error('Pagination voucher missing');
    if (pages > 100) throw new Error('Unexpected pagination length');
  } while (voucher);
  return { entries, pages };
}
function publicPath(url) { return new URL(url).pathname.split('/').slice(5).map(decodeURIComponent); }
function stableId(entry) { return createHash('sha256').update(entry.file_id || new URL(entry.href).pathname).digest('hex').slice(0, 18); }
function variants(entry) {
  const content = entry.preview?.content || {};
  const list = (content.src_set || '').split(/,\s+/).map(s => { const m = s.match(/^(https:\/\/\S+)\s+(\d+)w$/); return m && { url: m[1], width: +m[2] }; }).filter(Boolean);
  list.sort((a, b) => a.width - b.width);
  const choose = width => list.find(x => x.width >= width) || list.at(-1);
  const dimensions = entry.preview?.dimensions || {};
  const ratio = dimensions.width && dimensions.height ? Math.min(1, dimensions.width / dimensions.height) : 1;
  return { thumbnail: choose(800 * ratio)?.url || content.default_src || entry.preview?.preview_url, preview: choose(1600 * ratio)?.url || content.default_src || entry.preview?.preview_url };
}
async function atomicWrite(path, data) {
  const temporary = path + '.importing';
  await writeFile(temporary, data);
  for (let attempt=0;;attempt++) {
    try { await rename(temporary,path); return; }
    catch(error) {
      if (!['EPERM','EACCES','EBUSY'].includes(error.code) || attempt>=12) throw error;
      await new Promise(resolve=>setTimeout(resolve,100+attempt*100));
    }
  }
}
async function usableAsset(url) {
  if (!url?.startsWith(base)) return false;
  const name = url.slice(base.length);
  if (!/^[a-f0-9]{18}-(thumb|preview)\.(jpe?g|png|webp|avif|gif)$/.test(name)) return false;
  try {
    const bytes = await readFile(join(dir, 'assets', name));
    if (bytes.length < 100) return false;
    if (bytes[0] === 255 && bytes[1] === 216) {
      let offset = 2;
      while (offset < bytes.length - 8) {
        while (bytes[offset] === 255) offset++;
        const marker = bytes[offset++];
        if (marker === 217 || marker === 218) break;
        if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) return bytes.readUInt16BE(offset + 3) >= 16 && bytes.readUInt16BE(offset + 5) >= 16;
        const length = bytes.readUInt16BE(offset);
        if (length < 2) return false;
        offset += length;
      }
      return false;
    }
    return true;
  } catch { return false; }
}
async function canReuse(entry, previous, hasAsset = usableAsset) {
  const modified = entry.ts ? new Date(entry.ts * 1000).toISOString() : null;
  if (!previous || previous.modified !== modified || previous.bytes !== (entry.bytes || null)) return false;
  return (await Promise.all([hasAsset(previous.thumbnail), hasAsset(previous.preview)])).every(Boolean);
}
async function downloadImage(url, stem) {
  if (!url) throw new Error('No image preview available');
  const response = await request(url);
  const type = (response.headers.get('content-type') || '').split(';')[0];
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }[type];
  if (!ext) throw new Error(`Preview returned ${type}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100) throw new Error('Empty preview');
  const name = `${stem}.${ext}`;
  await atomicWrite(join(dir, 'assets', name), bytes);
  return name;
}
function titleFor(filename, game, position) {
  const name = filename.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const randomShortName = /^[A-Za-z0-9]{7}$/.test(name) && /[A-Z]/.test(name.slice(1)) && !/^[A-Z]+$/.test(name);
  if (randomShortName || /^[a-f0-9]{8}-[a-f0-9]{4}-/i.test(name) || /\d{1,2} \d{1,2} 20\d{2}|\d{1,2}\/\d{1,2}\/20\d{2}/.test(name)) return `${game} · ${String(position).padStart(2, '0')}`;
  return name;
}
function publish() {
  publishing = publishing.catch(() => {}).then(async () => {
    // Keep a previous usable catalog online throughout refresh, including failures.
    const combined = inventory.complete ? catalog : [...new Map([...oldItems, ...catalog.map(x => [x.id, x])]).values()];
    const sorted = combined.sort((a, b) => a.game.localeCompare(b.game) || a.collection.localeCompare(b.collection) || a.filename.localeCompare(b.filename));
    inventory.imageCount = catalog.length;
    await atomicWrite(join(dir, 'catalog.json'), JSON.stringify(sorted, null, 2) + '\n');
    await atomicWrite(join(dir, 'source-inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
  });
  return publishing;
}
async function importImage(entry, position) {
  const id = stableId(entry), parts = publicPath(entry.href), game = parts[0] || 'Danny Vault';
  const collection = parts.slice(1, -1).join(' / ') || 'Wallpapers';
  const source = new URL(entry.href); source.searchParams.delete('dl'); source.searchParams.set('dl', '1');
  const ext = (entry.filename.match(/\.([^.]+)$/)?.[1] || 'jpg').toLowerCase();
  const format = ext === 'jpg' ? 'JPEG' : ext.toUpperCase();
  const width = entry.preview?.dimensions?.width || null, height = entry.preview?.dimensions?.height || null;
  const previous = oldItems.get(id);
  // Reuse optimized JPEG derivatives for unchanged originals on later imports.
  const reusing = await canReuse(entry, previous);
  const urls = variants(entry);
  let thumbName, previewName;
  if (reusing) {
    thumbName = previous.thumbnail.split('/').at(-1);
    previewName = previous.preview.split('/').at(-1);
  } else if (urls.thumbnail === urls.preview) {
    // Some Dropbox entries expose only one rendition; transfer it just once.
    previewName = await downloadImage(urls.preview, `${id}-preview`);
    thumbName = previewName.replace('-preview.', '-thumb.');
    await copyFile(join(dir, 'assets', previewName), join(dir, 'assets', thumbName));
  } else {
    [thumbName, previewName] = await Promise.all([downloadImage(urls.thumbnail, `${id}-thumb`), downloadImage(urls.preview, `${id}-preview`)]);
  }
  const item = { id, title: titleFor(entry.filename, game, position), game, collection, filename: entry.filename, width, height, bytes: entry.bytes || null, format, orientation: width && height ? width > height ? 'landscape' : height > width ? 'portrait' : 'square' : 'unknown', thumbnail: base + thumbName, preview: base + previewName, download: source.href, modified: entry.ts ? new Date(entry.ts * 1000).toISOString() : null };
  if (reusing && previous.previewOptimized) { item.previewOptimized = true; if (previous.previewOptimizationVersion) item.previewOptimizationVersion = previous.previewOptimizationVersion; }
  catalog.push(item);
  if (catalog.length <= 6 || catalog.length % 20 === 0) { await publish(); console.log(`Cached ${catalog.length} originals`); }
}

export { canReuse, variants, titleFor };

async function run() {
await mkdir(join(dir, 'assets'), { recursive: true });
const hello = await request(rootUrl); rememberCookies(hello); await hello.body.cancel();
const queue = [rootUrl], seen = new Set();
while (queue.length) {
  const batch = queue.splice(0, 6).filter(url => !seen.has(url)); batch.forEach(url => seen.add(url));
  await Promise.all(batch.map(async url => {
    try {
      const { entries, pages } = await listFolder(url);
      const path = publicPath(url).join('/') || '/';
      inventory.folders.push({ path, url, entries: entries.length, pages, complete: true });
      for (const entry of entries) {
        if (entry.is_dir) queue.push(entry.href);
        else if (/\.(jpe?g|png|webp|avif|gif)$/i.test(entry.filename)) images.set(stableId(entry), entry);
        else inventory.excluded.push({ path: [...publicPath(url), entry.filename].join('/'), reason: 'Not a supported wallpaper image' });
      }
      console.log(`Listed ${path}: ${entries.length} entries (${pages} page${pages === 1 ? '' : 's'})`);
    } catch (error) { inventory.errors.push({ url, error: error.message }); console.error(`Folder failed: ${publicPath(url).join('/')}: ${error.message}`); }
  }));
  await publish();
}
console.log(`Inventory: ${inventory.folders.length} folders, ${images.size} image originals, ${inventory.excluded.length} excluded files`);
const todo = [...images.values()].sort((a, b) => {
  const aa = publicPath(a.href), bb = publicPath(b.href);
  return aa[0].localeCompare(bb[0]) || aa.slice(1, -1).join('/').localeCompare(bb.slice(1, -1).join('/')) || a.filename.localeCompare(b.filename);
}).slice(0, limit);
const gamePositions = new Map(), positions = new Map();
for (const entry of todo) { const game = publicPath(entry.href)[0]; const position = (gamePositions.get(game) || 0) + 1; gamePositions.set(game, position); positions.set(stableId(entry), position); }
for (let i = 0; i < todo.length; i += 16) {
  await Promise.all(todo.slice(i, i + 16).map(entry => importImage(entry, positions.get(stableId(entry))).catch(error => { inventory.errors.push({ path: publicPath(entry.href).join('/'), error: error.message }); console.error(`Image failed: ${entry.filename}: ${error.message}`); })));
}
inventory.complete = inventory.errors.length === 0 && catalog.length === images.size;
inventory.discoveredImageCount = images.size;
inventory.importedAt = new Date().toISOString();
await publish();
console.log(JSON.stringify({ imported: catalog.length, complete: inventory.complete, folders: inventory.folders.length, discoveredImages: images.size, excluded: inventory.excluded.length, errors: inventory.errors.length }));
}

async function reconcileLocalCache() {
  const summary=JSON.parse(await readFile(join(dir,'source-inventory.json'),'utf8'));
  const expected=summary.folders.reduce((n,f)=>n+f.entries,0)-(summary.folders.length-1)-summary.excluded.length;
  if(expected!==old.length || !summary.folders.every(f=>f.complete)) throw new Error('Source inventory incomplete');
  let repaired=0;
  for(const item of old) {
    for(const kind of ['thumbnail','preview']) {
      if(await usableAsset(item[kind])) continue;
      const suffix=kind==='thumbnail'?'thumb':'preview';
      let replacement;
      for(const ext of ['jpg','jpeg','png','webp','avif','gif']) {
        const candidate=base+item.id+'-'+suffix+'.'+ext;
        if(await usableAsset(candidate)) { replacement=candidate; break; }
      }
      if(!replacement) throw new Error('No valid cached '+kind+': '+item.filename);
      item[kind]=replacement; repaired++;
    }
    if(item.previewOptimizationVersion!==2) { delete item.previewOptimized; delete item.previewOptimizationVersion; }
  }
  summary.imageCount=old.length;
  summary.discoveredImageCount=expected;
  summary.complete=summary.errors.length===0;
  summary.importedAt=new Date().toISOString();
  await atomicWrite(join(dir,'catalog.json'),JSON.stringify(old,null,2)+'\n');
  await atomicWrite(join(dir,'source-inventory.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({reconciled:old.length,repairedPaths:repaired,complete:summary.complete}));
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.includes('--reconcile-local-cache')) await reconcileLocalCache();
  else await run();
}
