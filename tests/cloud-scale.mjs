import assert from 'node:assert/strict';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw new Error('Scale test requires loopback demo emulators.');
globalThis.location={protocol:'http:',hostname:'127.0.0.1',search:'?emulator=1'};
const {createDatabase}=await import('../assets/js/catalog-model.js');
const {publisherLogin,publishCatalog,loadEditorCatalog}=await import('../assets/js/services/catalog-publisher.js');
const {readFirebaseCatalog}=await import('../assets/js/services/firebase-catalog.js');
const database=createDatabase();database.products=Array.from({length:2000},(_,i)=>({id:'scale'+i,name:'Oak Sofa '+i,sku:'SCALE'+i,description:'A bounded emulator-only product description.',category:'living-room',subcategory:'',images:['assets/images/sofa.webp'],priceCents:50000+i,oldPriceCents:99900,stock:1,active:true,available:true,featured:i<4,dimensions:'80 × 36 × 34 in',material:'Oak',finish:'Natural'}));
await publisherLogin('furniture.discounters.offcial@gmail.com','Emulator-only-test-1020');
let revision;try{revision=(await loadEditorCatalog()).revision;}catch(error){if(!error.message.includes('No editor database'))throw error;}
await publishCatalog(database,()=>null,()=>{},revision);
const publicData=await readFirebaseCatalog(),privateData=await loadEditorCatalog();
assert.equal(publicData.database.products.length,2000);assert.equal(privateData.database.products.length,2000);assert.equal(publicData.database.products[1999].sku,'SCALE1999');assert.equal(publicData.database.products[0].dimensions,'80 × 36 × 34 in');assert.deepEqual(publicData.database.orders,[]);
console.log('PASS: real Firebase upload/readback of 2,000 products across multiple bounded chunks, including Unicode specifications.');
