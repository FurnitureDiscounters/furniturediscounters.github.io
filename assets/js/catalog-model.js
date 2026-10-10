export const DEFAULT_SETTINGS = { announcement: 'Good design. Everyday value.', address: '500 N. McCarran Blvd, Sparks, NV 89431', hours: 'Monday–Saturday 10AM–7PM · Sunday 10AM–6PM', phone: '(775) 823-9322', email: 'Furniturediscounters@yahoo.com', pickupInstructions: 'Contact us to confirm availability and pickup before visiting the store.', story: '' };
export function createDatabase() {
  const rooms = [['living-room','Living Room','#7e6049'],['bedroom','Bedroom','#69785f'],['dining-room','Dining Room','#a05c43'],['office','Office','#465e72'],['mattresses','Mattresses','#79677a'],['accent-furniture','Accent Furniture','#94723e']];
  return { version: 1, categories: rooms.map(([id,name,accent],sortOrder) => ({ id,name,accent,sortOrder,description:'',imagePath:'',active:true,columns:3 })), subcategories: [], products: [], orders: [], settings: { ...DEFAULT_SETTINGS } };
}
export function validImagePath(path) { return typeof path === 'string' && /^assets\/(products|images)\/[A-Za-z0-9/_-]+\.(webp|jpg|jpeg|png)$/.test(path); }
const fail = message => { throw new Error(message); };
const object = v => v && typeof v === 'object' && !Array.isArray(v);
const text = (v, max) => typeof v === 'string' && v.length <= max;
const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v);
const money = v => Number.isSafeInteger(v) && v >= 0 && v <= 100000000;
function unique(rows,label,max) {
  if (!Array.isArray(rows) || rows.length > max || rows.some(v => !object(v) || !id(v.id)) || new Set(rows.map(v => v.id)).size !== rows.length) fail(`Invalid or duplicate ${label}.`);
}
export function validateDatabase(input, { publicOnly = false } = {}) {
  if (!object(input) || input.version !== 1) fail('Choose a Furniture Discounters database, version 1.');
  unique(input.categories,'categories',300); unique(input.subcategories,'subcategories',2000); unique(input.products,'products',10000);
  const cats = new Map(input.categories.map(c => [c.id,c])), subs = new Map(input.subcategories.map(c => [c.id,c]));
  for (const c of input.categories) if (!text(c.name,100) || !c.name.trim() || !text(c.description,1000) || !/^#[0-9a-f]{6}$/i.test(c.accent) || ![2,3,4].includes(c.columns) || !Number.isInteger(c.sortOrder) || c.sortOrder < 0 || c.sortOrder > 10000 || typeof c.active !== 'boolean' || !(c.imagePath === '' || validImagePath(c.imagePath))) fail('A category has invalid fields.');
  for (const s of input.subcategories) if (!cats.has(s.category) || !text(s.name,100) || !s.name.trim() || !text(s.description,1000) || typeof s.active !== 'boolean') fail('A subcategory needs a valid parent category and name.');
  const skus = new Set();
  for (const p of input.products) {
    if (!text(p.name,160) || !p.name.trim() || !text(p.sku,80) || !p.sku.trim() || skus.has(p.sku.trim().toLowerCase()) || !text(p.description,5000) || !money(p.priceCents) || !(p.oldPriceCents === null || money(p.oldPriceCents)) || !Number.isInteger(p.stock) || p.stock < 0 || p.stock > 100000 || !cats.has(p.category) || !(p.subcategory === '' || subs.get(p.subcategory)?.category === p.category) || !text(p.dimensions,250) || !text(p.material,250) || !text(p.finish,250) || ['active','available','featured'].some(k => typeof p[k] !== 'boolean') || !Array.isArray(p.images) || p.images.length > 8 || !p.images.length || !p.images.every(validImagePath)) fail('A product has invalid fields, a duplicate SKU, or an invalid category/subcategory.');
    skus.add(p.sku.trim().toLowerCase());
  }
  if (!object(input.settings)) fail('Missing store settings.');
  const limits = { announcement:300,address:500,hours:500,phone:40,email:254,pickupInstructions:2000,story:5000 };
  for (const [k,max] of Object.entries(limits)) if (!text(input.settings[k],max)) fail('Invalid public store settings.');
  const orders = publicOnly ? [] : input.orders;
  unique(orders,'orders',20000);
  const numbers = new Set();
  for (const o of orders) {
    if (!text(o.number,80) || !o.number.trim() || numbers.has(o.number.trim().toUpperCase()) || !text(o.name,100) || !text(o.email,254) || !text(o.phone,40) || !text(o.notes,2000) || !Array.isArray(o.items) || !o.items.length || o.items.length > 100 || o.items.some(i => !object(i) || !id(i.productId) || !text(i.name,160) || !text(i.sku,80) || !money(i.priceCents) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 1000) || !Number.isFinite(Date.parse(o.createdAt))) fail('An order has invalid fields or a duplicate order number.');
    numbers.add(o.number.trim().toUpperCase());
  }
  // Reconstruct known fields: imported private/unrecognized keys never flow into the public catalog.
  const pick = (v, keys) => Object.fromEntries(keys.map(k => [k,v[k]]));
  return { version:1,
    categories:input.categories.map(v => pick(v,['id','name','description','accent','columns','sortOrder','active','imagePath'])),
    subcategories:input.subcategories.map(v => pick(v,['id','category','name','description','active'])),
    products:input.products.map(v => pick(v,['id','name','sku','description','priceCents','oldPriceCents','stock','category','subcategory','dimensions','material','finish','images','active','available','featured'])),
    settings:pick(input.settings,Object.keys(limits)),
    orders:orders.map(v => ({ ...pick(v,['id','number','name','email','phone','notes','createdAt']), items:v.items.map(i => pick(i,['productId','name','sku','priceCents','quantity'])) })) };
}
export function publicCatalog(db) {
  const safe = validateDatabase(db);
  const categories = safe.categories.filter(c => c.active), catIds = new Set(categories.map(c => c.id));
  const subcategories = safe.subcategories.filter(s => s.active && catIds.has(s.category)), subIds = new Set(subcategories.map(s => s.id));
  return { version:1, categories, subcategories, products:safe.products.filter(p => p.active && catIds.has(p.category) && (!p.subcategory || subIds.has(p.subcategory))), settings:safe.settings };
}
export function filterProducts(db, { category='all', subcategory='all', search='', sort='featured' }={}) {
  const term = search.trim().toLowerCase();
  const rows = db.products.filter(p => p.active && (category === 'all' || p.category === category) && (subcategory === 'all' || p.subcategory === subcategory) && (!term || `${p.name} ${p.sku} ${p.description} ${p.material}`.toLowerCase().includes(term)));
  return rows.sort((a,b) => {
    if (sort === 'price-asc' || sort === 'price-desc') return (a.priceCents-b.priceCents)*(sort === 'price-asc'?1:-1) || a.id.localeCompare(b.id);
    if (sort === 'featured' && a.featured !== b.featured) return Number(b.featured)-Number(a.featured);
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
