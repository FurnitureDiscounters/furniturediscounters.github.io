import { getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, onSnapshot } from 'firebase/firestore';
import { catalogDatabase } from './firebase-catalog.js';
// Listen only to the public pointer. Private editor records are never queried here.
export function subscribeCatalogRevision(onRevision){
  catalogDatabase();const db=getFirestore(getApps().find(app=>app.name==='furniture-catalog'));
  if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('emulator')==='1')connectFirestoreEmulator(db,'127.0.0.1',8080);
  return onSnapshot(doc(db,'catalog','current'),snapshot=>{
    if(snapshot.exists()&&!snapshot.metadata.fromCache){const revision=snapshot.data().revision;if(/^[A-Za-z0-9_-]{1,80}$/.test(revision))onRevision(revision);}
  },()=>{/* The last displayed catalog remains available during connection failures. */});
}
