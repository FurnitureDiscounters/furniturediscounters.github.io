import { products } from "../data/products.js";

/** Local demonstration adapter. Replace this boundary with Firestore later. */
const CART_KEY = "fd.demo.cart.v1";
const ORDERS_KEY = "fd.demo.orders.v1";
const LOCK_NAME = "fd.demo.storage.v1";
const catalog = new Map(products.map((product) => [product.id, product]));
let mutationQueue = Promise.resolve();
let activeSubmission = null;

function storageError(cause) {
  const error = new Error(
    "Your browser could not save or read demo data. Allow site storage, check available space, and try again.",
  );
  error.code = "STORAGE_UNAVAILABLE";
  error.cause = cause;
  return error;
}

function corruptError(kind) {
  const error = new Error(
    kind === "cart"
      ? "Your saved demo order list could not be read. Reset the list below to start again; saved demo orders will stay untouched."
      : "Saved demo orders could not be read. Browser data may have been changed or damaged. Your current selection has been kept.",
  );
  error.code = kind === "cart" ? "CORRUPT_CART" : "CORRUPT_ORDERS";
  return error;
}

function readRaw(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    throw storageError(error);
  }
}

function writeRaw(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw storageError(error);
  }
}

function parse(raw, kind) {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw corruptError(kind);
  }
}

function revision() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function validQuantity(value, allowZero = false) {
  return Number.isInteger(value) && value >= (allowZero ? 0 : 1) && value <= 99;
}

function readCartState() {
  const value = parse(readRaw(CART_KEY), "cart");
  if (value === null) return { revision: null, items: [] };
  // Accept a plain array from early demo versions; all new writes use a revision
  // envelope so an order can be retried without accidentally saving it twice.
  const items = Array.isArray(value) ? value : value?.items;
  if (!Array.isArray(items)) throw corruptError("cart");
  const ids = new Set();
  for (const item of items) {
    if (
      !item ||
      !catalog.has(item.productId) ||
      !validQuantity(item.quantity) ||
      ids.has(item.productId)
    ) {
      throw corruptError("cart");
    }
    ids.add(item.productId);
  }
  if (
    !Array.isArray(value) &&
    (typeof value.revision !== "string" || !value.revision)
  )
    throw corruptError("cart");
  return {
    revision: Array.isArray(value)
      ? `legacy-${JSON.stringify(items)}`
      : value.revision,
    items: items.map(({ productId, quantity }) => ({ productId, quantity })),
  };
}

function readOrders() {
  const value = parse(readRaw(ORDERS_KEY), "orders");
  if (value === null) return [];
  if (!Array.isArray(value)) throw corruptError("orders");
  const numbers = new Set();
  for (const order of value) {
    if (
      !order ||
      !/^FD-\d{4}-\d{6}$/.test(order.number) ||
      numbers.has(order.number) ||
      typeof order.cartRevision !== "string" ||
      !Number.isFinite(Date.parse(order.createdAt)) ||
      order.status !== "received" ||
      !Array.isArray(order.items) ||
      !order.items.length ||
      !Number.isFinite(order.total) ||
      order.total < 0
    )
      throw corruptError("orders");
    numbers.add(order.number);
    let totalCents = 0;
    for (const item of order.items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        typeof item.name !== "string" ||
        typeof item.image !== "string" ||
        !item.image.startsWith("assets/images/") ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !validQuantity(item.quantity)
      )
        throw corruptError("orders");
      totalCents += Math.round(item.price * 100) * item.quantity;
    }
    if (Math.round(order.total * 100) !== totalCents)
      throw corruptError("orders");
  }
  return value;
}

function notifyCart() {
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

function saveCart(items) {
  writeRaw(CART_KEY, { revision: revision(), items });
  notifyCart();
  return items.map((item) => ({ ...item }));
}

// Serialize writes in this tab and, where supported, across same-origin tabs.
// No await occurs inside a storage transaction, keeping the fallback consistent.
function mutate(operation) {
  const run = () =>
    window.navigator?.locks?.request
      ? window.navigator.locks.request(LOCK_NAME, operation)
      : operation();
  const result = mutationQueue.then(run);
  mutationQueue = result.catch(() => {});
  return result;
}

export async function getCart() {
  return readCartState().items;
}

export async function addToCart(productId, quantity = 1) {
  if (!catalog.has(productId))
    throw new Error(
      "This sample product is no longer available. Please refresh the catalog.",
    );
  if (!validQuantity(quantity))
    throw new Error("Choose a whole-number quantity between 1 and 99.");
  return mutate(() => {
    const items = readCartState().items;
    const existing = items.find((item) => item.productId === productId);
    if (existing) {
      if (existing.quantity + quantity > 99)
        throw new Error("You can add up to 99 of each sample product.");
      existing.quantity += quantity;
    } else items.push({ productId, quantity });
    return saveCart(items);
  });
}

export async function updateQuantity(productId, quantity) {
  if (!validQuantity(quantity, true))
    throw new Error(
      "Choose a whole-number quantity between 1 and 99, or remove the item.",
    );
  return mutate(() => {
    const items = readCartState().items;
    const existing = items.find((item) => item.productId === productId);
    if (!existing)
      throw new Error(
        "This item is no longer in your demo order list. Refresh and try again.",
      );
    if (quantity === 0)
      return saveCart(items.filter((item) => item.productId !== productId));
    existing.quantity = quantity;
    return saveCart(items);
  });
}

export async function removeFromCart(productId) {
  return updateQuantity(productId, 0);
}

export async function resetCart() {
  return mutate(() => saveCart([]));
}

function newOrderNumber(existing) {
  const year = new Date().getFullYear();
  const used = new Set(existing.map((order) => order.number));
  let number;
  do {
    const random = globalThis.crypto?.getRandomValues
      ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
      : Math.floor(Math.random() * 4294967296);
    number = `FD-${year}-${String(random % 1000000).padStart(6, "0")}`;
  } while (used.has(number));
  return number;
}

export function createOrder() {
  if (activeSubmission) return activeSubmission;
  activeSubmission = mutate(() => {
    const cart = readCartState();
    if (!cart.items.length)
      throw new Error("Add a sample product before creating a demo order.");
    const orders = readOrders();
    // If an earlier save succeeded but clearing the cart failed, reuse that
    // order. Its persisted revision is the idempotency key for this cart.
    let order = orders.find((entry) => entry.cartRevision === cart.revision);
    if (!order) {
      const items = cart.items.map(({ productId, quantity }) => {
        const product = catalog.get(productId);
        return {
          productId,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
        };
      });
      order = {
        number: newOrderNumber(orders),
        createdAt: new Date().toISOString(),
        cartRevision: cart.revision,
        items,
        total:
          items.reduce(
            (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
            0,
          ) / 100,
        status: "received",
      };
      // Persist the order before clearing its cart. A failed order write keeps
      // the original selection. A failed cart clear can safely be retried.
      writeRaw(ORDERS_KEY, [...orders, order]);
    }
    try {
      saveCart([]);
    } catch {
      return {
        ...order,
        warning:
          "Your demo order was saved, but your browser could not clear the selection. Trying again will show this same order number.",
      };
    }
    return structuredClone(order);
  }).finally(() => {
    activeSubmission = null;
  });
  return activeSubmission;
}

export async function getOrders() {
  return structuredClone(readOrders());
}

export async function getOrder(number) {
  const normalized = String(number ?? "")
    .trim()
    .toUpperCase();
  if (!/^FD-\d{4}-\d{6}$/.test(normalized))
    throw new Error("Enter a demo number in the format FD-2026-001234.");
  const order = readOrders().find((entry) => entry.number === normalized);
  return order ? structuredClone(order) : null;
}

window.addEventListener("storage", (event) => {
  if (event.key === CART_KEY || event.key === null) notifyCart();
});

export const orderService = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  resetCart,
  createOrder,
  getOrders,
  getOrder,
};
