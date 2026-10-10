import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
import { firebaseConfig } from '../../firebase-config.js';
export const NUMBER_PATTERN = /^FD-[0-9]{8}-[A-F0-9]{32}$/;
let database;
function db() {
  if (database) return database;
  const local=location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname);
  const emulator=local&&new URLSearchParams(location.search).get('emulator')==='1';
  if (!emulator && (!firebaseConfig.projectId||!firebaseConfig.apiKey)) throw new Error('Online order lookup is not configured.');
  const app=getApps().find(a=>a.name==='order-numbers')||initializeApp(emulator?{projectId:'demo-furniture-discounters',apiKey:'emulator-only',appId:'emulator-only'}:firebaseConfig,'order-numbers');
  database=getFirestore(app);
  if(emulator) connectFirestoreEmulator(database,'127.0.0.1',8080);
  return database;
}
export function newOrderNumber() {
  const now=new Date(), date=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const random=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  return `FD-${date}-${random}`;
}
export function decodePublicOrder(data) {
  return { ...data, items:Object.values(data.items).map(line=>{const i=line.split('\t');return {productId:i[0],name:i[1],sku:i[2],priceCents:Number(i[3]),quantity:1};}) };
}
export async function findPublicOrder(number) {
  number=number.trim().toUpperCase();
  if(!NUMBER_PATTERN.test(number)) return null;
  const snapshot=await getDoc(doc(db(),'pickupRequests',number));
  return snapshot.exists()?decodePublicOrder(snapshot.data()):null;
}
export async function submitPublicOrder(number,products) {
  if(!NUMBER_PATTERN.test(number)||!products.length||products.length>20) throw new Error('Choose one to twenty products before submitting.');
  if(products.some(p=>/[\t\r\n]/.test(p.name+p.sku))) throw new Error('Product names and SKUs must use a single line.');
  const reference=doc(db(),'pickupRequests',number);
  const existing=await getDoc(reference);
  if(existing.exists()) {
    const ids=decodePublicOrder(existing.data()).items.map(i=>i.productId).sort().join(',');
    if(ids!==products.map(p=>p.id).sort().join(',')) throw new Error('This number belongs to another selection. Refresh your selection before retrying.');
    return decodePublicOrder(existing.data());
  }
  const data={number,items:Object.fromEntries(products.map((p,i)=>[String(i),[p.id,p.name,p.sku,String(p.priceCents)].join('\t')])),createdAt:serverTimestamp()};
  try { await setDoc(reference,data); }
  catch(error) {
    // A competing tab may have created this same immutable request. Reuse only matching items.
    try { const saved=await getDoc(reference); if(saved.exists()&&decodePublicOrder(saved.data()).items.map(i=>i.productId).sort().join(',')===products.map(p=>p.id).sort().join(',')) return decodePublicOrder(saved.data()); } catch { /* Preserve the original failure. */ }
    throw error;
  }
  return decodePublicOrder((await getDoc(reference)).data());
}
