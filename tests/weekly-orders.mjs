import assert from 'node:assert/strict';
// This test uses only the loopback demo emulator, never production.
globalThis.location={protocol:'http:',hostname:'127.0.0.1',search:'?emulator=1'};
const {newOrderNumber,weekStart,requestKey,submitPublicOrder,findPublicOrder}=await import('../assets/js/services/public-order-service.js');
for(let i=0;i<1000;i++){const n=Number(newOrderNumber());assert(n>=1000&&n<=10000);}
assert.equal(weekStart('2026-10-11'),'2026-10-05');
assert.equal(weekStart('2026-10-12'),'2026-10-12');
assert.equal(weekStart('2027-01-01'),'2026-12-28');
const one=[{id:'one',name:'First week sofa',sku:'ONE',priceCents:10000}],two=[{id:'two',name:'Second week sofa',sku:'TWO',priceCents:20000}];
await submitPublicOrder('1234',one,'2026-10-05',false);
await submitPublicOrder('1234',two,'2026-10-12',false);
assert.equal((await findPublicOrder('1234','2026-10-05')).items[0].name,'First week sofa');
assert.equal((await findPublicOrder('1234','2026-10-12')).items[0].name,'Second week sofa');
assert.equal((await findPublicOrder('1234','2026-10-12')).number,'1234');
assert.equal((await findPublicOrder('1234','2026-10-12')).week,'2026-10-12');
assert.equal((await findPublicOrder(requestKey('1234','2026-10-05'))).number,'1234');
await assert.rejects(()=>submitPublicOrder('1234',one,'2026-10-12'),/another selection/);
const raced=await Promise.allSettled([submitPublicOrder('9999',one,'2026-10-05',false),submitPublicOrder('9999',one,'2026-10-05',false)]);
assert.equal(raced.filter(r=>r.status==='fulfilled').length,1);assert.equal(raced.find(r=>r.status==='rejected').reason.code,'order-number-collision');
const old='FD-20261010-'+('B'.repeat(32));await submitPublicOrder(old,one);assert.equal((await findPublicOrder(old)).number,old);
assert.equal(await findPublicOrder('123'),null);
console.log('PASS: weekly number range/reset, historic lookup, legacy lookup, idempotent retries and concurrent collision rejection.');
process.exit(0);
