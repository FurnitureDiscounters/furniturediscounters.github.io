import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
if(process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080')throw new Error('Seed requires only loopback demo emulators.');
initializeApp({projectId:'demo-furniture-discounters'});
await getAuth().createUser({uid:'test-verified-store-owner',email:'furniture.discounters.offcial@gmail.com',password:'Emulator-only-test-1020',emailVerified:true});
console.log('Created verified emulator-only store account.');
