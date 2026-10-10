import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore/lite';
import { firebaseConfig } from '../../firebase-config.js';
export const NUMBER_PATTERN = /^(?:(?:[1-9][0-9]{3}|10000)|FD-[0-9]{8}-[A-F0-9]{32})$/;
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
export function weekStart(value=new Date()) {
  const parts=typeof value==='string'?null:new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
  const calendar=typeof value==='string'?value:['year','month','day'].map(key=>parts.find(p=>p.type===key).value).join('-');
  const date=new Date(calendar+'T12:00:00');
  if(!Number.isFinite(date.getTime()))throw new Error('Choose a valid order week.');
  date.setDate(date.getDate()-((date.getDay()+6)%7));
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function newOrderNumber() {
  const bytes=new Uint32Array(1),limit=Math.floor(2**32/9001)*9001;
  do{crypto.getRandomValues(bytes);}while(bytes[0]>=limit);
  return String(1000+bytes[0]%9001);
}
// The weekly internal key retains compatibility with deployed immutable-request rules.
export function requestKey(number,week=weekStart()){
  return /^(?:[1-9][0-9]{3}|10000)$/.test(number)?`FD-${weekStart(week).replaceAll('-','')}-${number.padStart(32,'0')}`:number;
}
function numberDetails(key){
  // Four-digit references have 28 leading zeros; 10000 has 27.
  if(/^FD-[0-9]{8}-0{27,28}(?:[1-9][0-9]{3}|10000)$/.test(key)){
    const date=key.slice(3,11);return {number:String(Number(key.slice(12))),week:`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6)}`,lookupKey:key};
  }
  return {number:key,lookupKey:key};
}
export function decodePublicOrder(data) {
  return { ...data, ...numberDetails(data.number), items:Object.values(data.items).map(line=>{const i=line.split('\t');return {productId:i[0],name:i[1],sku:i[2],priceCents:Number(i[3]),quantity:1};}) };
}
export async function findPublicOrder(number,week=weekStart()) {
  number=number.trim().toUpperCase();
  if(!NUMBER_PATTERN.test(number)) return null;
  const snapshot=await getDoc(doc(db(),'pickupRequests',requestKey(number,week)));
  return snapshot.exists()?decodePublicOrder(snapshot.data()):null;
}
export async function submitPublicOrder(number,products,week=weekStart(),reuse=true) {
  if(!NUMBER_PATTERN.test(number)||!products.length||products.length>20) throw new Error('Choose one to twenty products before submitting.');
  if(products.some(p=>/[\t\r\n]/.test(p.name+p.sku))) throw new Error('Product names and SKUs must use a single line.');
  const reference=doc(db(),'pickupRequests',requestKey(number,week));
  const data={number:requestKey(number,week),items:Object.fromEntries(products.map((p,i)=>[String(i),[p.id,p.name,p.sku,String(p.priceCents)].join('\t')])),createdAt:serverTimestamp()};
  await runTransaction(db(),async transaction=>{
    const existing=await transaction.get(reference);
    if(existing.exists()){
      if(!reuse){const error=new Error('That number is already in use this week.');error.code='order-number-collision';throw error;}
      const ids=decodePublicOrder(existing.data()).items.map(i=>i.productId).sort().join(',');
      if(ids!==products.map(p=>p.id).sort().join(','))throw new Error('This number belongs to another selection. Refresh your selection before retrying.');
      return;
    }
    transaction.set(reference,data);
  });
  return decodePublicOrder((await getDoc(reference)).data());
}
