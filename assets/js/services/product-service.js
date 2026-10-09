import { products } from "../data/products.js";

/**
 * Backend boundary: replace these functions with Firestore reads later.
 * Keep returned product objects in the same shape so the UI does not change.
 * This module deliberately has no Firebase dependency or configuration.
 */
export async function getProducts() {
  return products.map((product) => ({ ...product }));
}

export async function getProduct(id) {
  const product = products.find((item) => item.id === id);
  return product ? { ...product } : null;
}

export const productService = { getProducts, getProduct };
