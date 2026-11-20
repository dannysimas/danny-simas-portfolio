import {defineConfig} from 'vite';
import {cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const projectRoot=fileURLToPath(new URL('.',import.meta.url));
const siteRoot=resolve(projectRoot,'concepts/motion-lab');
const outputDir=resolve(projectRoot,'dist');
// Run the same read-only Dropbox endpoint locally and on Vercel.
function wallpaperApi(){
 async function attach(server){
  const {default:handler}=await import('./api/wallpapers.js');
  server.middlewares.use((req,res,next)=>{
   const pathname=req.url?.split('?')[0];
   if(pathname==='/concepts/motion-lab'||pathname?.startsWith('/concepts/motion-lab/')){res.statusCode=308;res.setHeader('Location',req.url.replace('/concepts/motion-lab','')||'/');res.end();return}
   if(!/^\/api\/wallpapers\/?$/.test(pathname||''))return next();
   Promise.resolve(handler(req,res)).catch(error=>{console.error('Wallpaper endpoint failed:',error.message);if(!res.headersSent){res.statusCode=503;res.setHeader('Content-Type','application/json');res.end('{"error":"Wallpaper refresh temporarily unavailable"}')}else res.end()});
  });
 }
 return {name:'wallpaper-live-api',configureServer:attach,configurePreviewServer:attach};
}
function wallpaperAssets(){return {
 name:'wallpaper-preview-assets',
 async writeBundle(options){
  // Copy only the generated public JPEG derivatives, never the importer or inventory.
  const destination=resolve(options.dir);
  if(destination!==outputDir)throw Error('Unexpected wallpaper build destination');
  await cp(resolve(siteRoot,'wallpapers/assets'),resolve(destination,'wallpapers/assets'),{recursive:true,filter:source=>!source.includes('.')||/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(source)||source===resolve(siteRoot,'wallpapers/assets')});
 }
}}
export default defineConfig({
 root:siteRoot,
 publicDir:resolve(projectRoot,'public'),
 envDir:projectRoot,
 cacheDir:resolve(projectRoot,'node_modules/.vite'),
 appType:'mpa',
 plugins:[wallpaperApi(),wallpaperAssets()],
 build:{outDir:outputDir,emptyOutDir:true,rollupOptions:{input:{home:resolve(siteRoot,'index.html'),wallpapers:resolve(siteRoot,'wallpapers/index.html'),photomodes:resolve(siteRoot,'photomodes/index.html')}}}
});
