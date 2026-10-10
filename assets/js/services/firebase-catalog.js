import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore/lite';
import { firebaseConfig } from '../../firebase-config.js';
import { validateDatabase } from '../catalog-model.js';
let database;
export function catalogDatabase() {
  if(database) return database;
  const local=location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname);
  const emulator=local&&new URLSearchParams(location.search).get('emulator')==='1';
  const app=getApps().find(a=>a.name==='furniture-catalog')||initializeApp(emulator?{projectId:'demo-furniture-discounters',apiKey:'emulator-only',appId:'emulator-only'}:firebaseConfig,'furniture-catalog');
  database=getFirestore(app);
  if(emulator)connectFirestoreEmulator(database,'127.0.0.1',8080);
  return database;
}
export async function readFirebaseCatalog() {
  const db=catalogDatabase(), current=await getDoc(doc(db,'catalog','current'));
  if(!current.exists()) throw new Error('Our catalog is being updated. Please contact the store for available products.');
  const {revision,parts}=current.data();
  if(!/^[A-Za-z0-9_-]{1,80}$/.test(revision)||!Number.isInteger(parts)||parts<1||parts>100)throw new Error('The Firebase catalog needs attention. Contact the store.');
  const snapshots=await Promise.all(Array.from({length:parts},(_,i)=>getDoc(doc(db,'catalogVersions',revision,'parts',String(i)))));
  if(snapshots.some(s=>!s.exists()||typeof s.data().json!=='string'))throw new Error('The Firebase catalog could not be loaded completely. Please refresh.');
  return {database:validateDatabase(JSON.parse(snapshots.map(s=>s.data().json).join('')),{publicOnly:true}),revision};
}
const photos=new Map();
export async function photoKey(path) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(path))),v=>v.toString(16).padStart(2,'0')).join(''); }
export async function cloudPhoto(path) {
  if(!path.startsWith('assets/products/'))return path;
  if(!photos.has(path))photos.set(path,(async()=>{const saved=await getDoc(doc(catalogDatabase(),'catalogPhotos',await photoKey(path)));if(!saved.exists())return path;const data=saved.data().data;if(typeof data!=='string'||!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(data))throw new Error('Invalid product photo in Firebase.');return data;})().catch(error=>{photos.delete(path);throw error;}));
  return photos.get(path);
}
