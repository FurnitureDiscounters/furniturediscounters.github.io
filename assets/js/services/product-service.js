import { collectionPhotoPath } from '../collection-photos.js';
import { readFirebaseCatalog, cloudPhoto, clearCloudPhotos } from './firebase-catalog.js';
import { validateDatabase, filterProducts } from '../catalog-model.js';
export const PAGE_SIZE = 24;
let database,loading,catalogRevision,epoch=0,watching;
const localCatalog=()=>['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('catalog')==='local';
async function catalog(){
  if(loading)return loading;const version=epoch;
  loading=(localCatalog()?fetch('assets/data/catalog.json',{cache:'no-cache'}).then(async r=>{if(!r.ok)throw new Error('The collection is temporarily unavailable. Please try again later.');return validateDatabase(await r.json(),{publicOnly:true});}):readFirebaseCatalog().then(result=>{if(version===epoch)catalogRevision=result.revision;return result.database;})).then(value=>{if(version!==epoch)return catalog();database=value;return value;}).catch(error=>{if(version!==epoch)return catalog();loading=null;throw error;});
  return loading;
}
export function startCatalogUpdates(){
  if(localCatalog())return Promise.resolve();
  return watching||=(import('./catalog-updates.js').then(({subscribeCatalogRevision})=>subscribeCatalogRevision(revision=>{
    if(revision===catalogRevision)return;catalogRevision=revision;epoch++;loading=null;clearCloudPhotos();window.dispatchEvent(new Event('catalog-updated'));
  })).catch(()=>{watching=null;}));
}
const localPhotos=()=>['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('catalog')==='local';
async function withPhotos(product,full=false){const image=await photoURL(product.images[0]||'');return {...displayProduct(product),image,images:full?await Promise.all(product.images.map(photoURL)):product.images};}
export async function photoURL(path) { return localPhotos()?path||'':path?await cloudPhoto(path):''; }
export function categoryName(id) { return database?.categories.find(c => c.id === id)?.name || 'Furniture'; }
export function subcategoryName(id) { return database?.subcategories.find(c => c.id === id)?.name || ''; }
export async function getCategories() { const data=await catalog(),categories=data.categories.filter(c=>c.active).sort((a,b)=>a.sortOrder-b.sortOrder);return Promise.all(categories.map(async c=>({...c,image:await photoURL(collectionPhotoPath(data,c))}))); }
export async function getSubcategories(category='all') { const data=await catalog();return Promise.all(data.subcategories.filter(s => s.active && (category==='all'||s.category===category)).map(async s=>({...s,image:await photoURL(collectionPhotoPath(data,s,'subcategory'))}))); }
export function displayProduct(data, id=data.id) {
  const purchasable=data.active&&data.available&&data.stock>0;
  return { ...data,id,image:data.images[0]||'',price:data.priceCents/100,purchasable,availability:purchasable?'Ask about pickup availability':'Currently unavailable' };
}
export async function getProductPage(options={}) {
  const data=await catalog(), visibleCats = new Set(data.categories.filter(c=>c.active).map(c=>c.id)), visibleSubs = new Set(data.subcategories.filter(s=>s.active).map(s=>s.id));
  const rows=filterProducts({products:data.products.filter(p=>visibleCats.has(p.category)&&(!p.subcategory||visibleSubs.has(p.subcategory)))},options);
  const start=options.cursor||0;
  return { products:await Promise.all(rows.slice(start,start+PAGE_SIZE).map(p=>withPhotos(p))), cursor:start+PAGE_SIZE, hasMore:start+PAGE_SIZE<rows.length };
}
export async function getFeaturedProducts() { const data=await catalog(); return Promise.all(filterProducts(data).filter(p=>p.featured).slice(0,4).map(p=>withPhotos(p))); }
export async function getProduct(id,{fullPhotos=true}={}) { const data=await catalog(), p=data.products.find(p=>p.id===id && p.active); return p?await withPhotos(p,fullPhotos):null; }
export async function getSettings() { return (await catalog()).settings; }
