import { getProducts } from "./services/product-service.js";
import { categories } from "./data/products.js";
import {
  productCard,
  setupProductInteractions,
  escapeHTML,
  categoryName,
  icons,
} from "./ui.js";

const grid = document.querySelector("#product-grid");
const search = document.querySelector("#product-search");
const category = document.querySelector("#category-filter");
const sort = document.querySelector("#sort-products");
const count = document.querySelector("#result-count");
const clearButton = document.querySelector("#clear-filters");
const status = document.querySelector("#catalog-status");
const sortValues = new Set(["featured", "price-asc", "price-desc", "name"]);
let products = [];

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function updateURL() {
  const url = new URL(window.location.href);
  for (const key of ["category", "search", "sort"])
    url.searchParams.delete(key);
  if (category.value !== "all")
    url.searchParams.set("category", category.value);
  if (search.value.trim()) url.searchParams.set("search", search.value.trim());
  if (sort.value !== "featured") url.searchParams.set("sort", sort.value);
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function renderProducts(syncURL = true) {
  const query = normalize(search.value.trim());
  const results = products.filter((product) => {
    const matchingCategory =
      category.value === "all" || product.category === category.value;
    const searchable = normalize(
      `${product.name} ${product.description} ${categoryName(product.category)} ${product.material} ${product.finish}`,
    );
    return matchingCategory && (!query || searchable.includes(query));
  });
  if (sort.value === "price-asc") results.sort((a, b) => a.price - b.price);
  if (sort.value === "price-desc") results.sort((a, b) => b.price - a.price);
  if (sort.value === "name")
    results.sort((a, b) => a.name.localeCompare(b.name));
  if (sort.value === "featured")
    results.sort(
      (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
    );
  count.textContent = `${results.length} ${results.length === 1 ? "piece" : "pieces"} to make yourself at home`;
  clearButton.hidden =
    !query && category.value === "all" && sort.value === "featured";
  grid.innerHTML = results.length
    ? results.map(productCard).join("")
    : `<div class="catalog-empty">
    <span class="empty-icon">${icons.search}</span><h2>A fresh search, a fresh start.</h2>
    <p>We couldn't find a match${search.value.trim() ? ` for “${escapeHTML(search.value.trim())}”` : " in this category"}. Try another search or explore all our example furniture.</p>
    <button type="button" class="button button-primary" data-action="reset-filters">Explore all furniture ${icons.arrow}</button>
  </div>`;
  if (syncURL) updateURL();
}

function resetFilters() {
  search.value = "";
  category.value = "all";
  sort.value = "featured";
  renderProducts();
  search.focus();
}

async function loadProducts() {
  grid.setAttribute("aria-busy", "true");
  status.hidden = false;
  status.textContent = "Getting your next favorite pieces ready…";
  try {
    products = await getProducts();
    renderProducts(false);
    status.hidden = true;
  } catch (error) {
    status.innerHTML = `<p>We couldn't load the example collection. Please try again.</p><button type="button" class="button button-secondary" id="retry-catalog">Try again</button>`;
    document
      .querySelector("#retry-catalog")
      .addEventListener("click", loadProducts);
    count.textContent = "Collection unavailable";
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}

if (grid && search && category && sort && count && clearButton && status) {
  category.innerHTML = `<option value="all">All furniture</option>${categories.map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join("")}`;
  const query = new URLSearchParams(window.location.search);
  const initialCategory = query.get("category");
  category.value = categories.some((item) => item.id === initialCategory)
    ? initialCategory
    : "all";
  search.value = (query.get("search") || "").slice(0, 200);
  sort.value = sortValues.has(query.get("sort"))
    ? query.get("sort")
    : "featured";
  search.addEventListener("input", () => renderProducts());
  category.addEventListener("change", () => renderProducts());
  sort.addEventListener("change", () => renderProducts());
  clearButton.addEventListener("click", resetFilters);
  grid.addEventListener("click", (event) => {
    if (event.target.closest('[data-action="reset-filters"]')) resetFilters();
  });
  search
    .closest("form")
    ?.addEventListener("submit", (event) => event.preventDefault());
  setupProductInteractions();
  void loadProducts();
}
