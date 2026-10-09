import { getProducts } from "./services/product-service.js";
import { productCard, setupProductInteractions } from "./ui.js";

async function loadFeaturedProducts() {
  const grid = document.querySelector("#featured-products");
  if (!grid) return;
  grid.setAttribute("aria-busy", "true");
  try {
    const products = await getProducts();
    const featured = products.filter((product) => product.featured);
    const collection = featured.length ? featured : products;
    grid.innerHTML = collection.slice(0, 4).map(productCard).join("");
  } catch (error) {
    grid.innerHTML =
      '<p class="inline-message">The example collection is taking a moment. <a href="./store.html">Visit the store to try again.</a></p>';
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}

setupProductInteractions();
void loadFeaturedProducts();
