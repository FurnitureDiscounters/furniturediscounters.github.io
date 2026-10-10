let opening;
export function openStore() {
  return opening ||= new Promise((resolve,reject)=>{
    const request=indexedDB.open('fd.local.catalog.v1',1);
    request.onupgradeneeded=()=>{request.result.createObjectStore('database');request.result.createObjectStore('images');};
    request.onsuccess=()=>resolve(request.result); request.onerror=()=>{opening=null;reject(request.error);};
    request.onblocked=()=>reject(new Error('Close other copies of this editor and reopen it.'));
  });
}
export async function readState() {
  const db=await openStore();
  return new Promise((resolve,reject)=>{ const r=db.transaction('database').objectStore('database').get('main');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error); });
}
export async function commitState(state,revision) {
  const db=await openStore();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('database','readwrite'), store=tx.objectStore('database'), read=store.get('main'); let conflict;
    read.onsuccess=()=>{
      if((read.result?.revision||0)!==revision){conflict=new Error('Another copy changed this database. Reload this editor before saving.');tx.abort();return;}
      store.put({db:state,revision:revision+1},'main');
    };
    tx.oncomplete=()=>resolve(revision+1);tx.onabort=()=>reject(conflict||tx.error||new Error('Local save failed.'));tx.onerror=()=>reject(tx.error);
  });
}
export async function saveImage(path,blob) {
  const db=await openStore();return new Promise((resolve,reject)=>{const tx=db.transaction('images','readwrite');tx.objectStore('images').put(blob,path);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
}
export async function readImage(path) {
  const db=await openStore();return new Promise((resolve,reject)=>{const r=db.transaction('images').objectStore('images').get(path);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
