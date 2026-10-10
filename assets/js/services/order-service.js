const CART = 'fd.cart.v2';
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { throw new Error('Browser storage needs attention. Reset your cart or enable storage before ordering.'); }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Your selection could not be saved. Enable browser storage and try again.'); }
}
export async function getCart() {
  const ids = read(CART, []);
  if (!Array.isArray(ids) || ids.some(x => typeof x !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(x)) || ids.length > 20 || new Set(ids).size !== ids.length)
    throw new Error('Your cart data is invalid. Reset the cart to continue.');
  return ids.map(productId => ({ productId, quantity: 1 }));
}
async function mutate(fn) {
  const operation = async () => {
    const ids = (await getCart()).map(x => x.productId);
    write(CART, fn(ids));
    window.dispatchEvent(new Event('cart-updated'));
  };
  if (navigator.locks) return navigator.locks.request('fd-cart-v2', operation);
  return operation();
}
export async function addToCart(id) {
  return mutate(ids => {
    if (ids.includes(id)) throw new Error('This product is already in your cart. One of each product is available per selection.');
    if (ids.length >= 20) throw new Error('A selection can include up to twenty different products.');
    return [...ids, id];
  });
}
export async function removeFromCart(id) { return mutate(ids => ids.filter(x => x !== id)); }
export async function resetCart() {
  write(CART, []); window.dispatchEvent(new Event('cart-updated'));
}
