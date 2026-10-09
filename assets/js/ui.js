import { getProduct } from "./services/product-service.js";
import { addToCart } from "./services/order-service.js";
import { categories } from "./data/products.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(value) {
  return currency.format(Number(value) || 0);
}

export function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

const svg = (content) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;

export const icons = {
  arrow: svg('<path d="M4 12h16m-6-6 6 6-6 6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  check: svg('<path d="m5 12 4 4L19 6"/>'),
  bag: svg('<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>'),
  x: svg('<path d="m6 6 12 12M6 18 18 6"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'),
  copy: svg(
    '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  ),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'),
  trash: svg('<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>'),
};

let toastTimeout;

export function toast(message, type = "success") {
  let element = document.querySelector("#toast");
  if (!element) {
    element = document.createElement("div");
    element.id = "toast";
    element.className = "toast";
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    document.body.append(element);
  }
  clearTimeout(toastTimeout);
  element.dataset.type = type;
  element.innerHTML = `${type === "error" ? icons.info : icons.check}<span>${escapeHTML(message)}</span>`;
  element.classList.add("is-visible");
  toastTimeout = setTimeout(
    () => element.classList.remove("is-visible"),
    type === "error" ? 6500 : 4000,
  );
}

export function categoryName(id) {
  return categories.find((category) => category.id === id)?.name || "Furniture";
}

export function productCard(product) {
  const id = escapeHTML(product.id);
  const name = escapeHTML(product.name);
  return `<article class="product-card">
    <button class="product-image-button" type="button" data-action="details" data-product-id="${id}" aria-label="View details for ${name}">
      <img class="product-image" src="${escapeHTML(product.image)}" alt="${name}" width="800" height="640" loading="lazy" decoding="async">
      <span class="product-badge">Demo collection</span>
    </button>
    <div class="product-info">
      <p class="product-category">${escapeHTML(categoryName(product.category))}</p>
      <h3 class="product-title"><button class="product-title-button" type="button" data-action="details" data-product-id="${id}">${name}</button></h3>
      <p class="product-description">${escapeHTML(product.description)}</p>
      <div class="product-meta"><strong class="product-price">${formatPrice(product.price)}<span class="price-label"> example price</span></strong><span class="availability">${escapeHTML(product.availability)}</span></div>
      <div class="product-actions">
        <button class="button button-secondary button-small" type="button" data-action="details" data-product-id="${id}" aria-label="View details for ${name}">View details</button>
        <button class="button button-primary button-small" type="button" data-action="add" data-product-id="${id}" aria-label="Add ${name} to demo order">${icons.plus}<span>Add to order</span></button>
      </div>
    </div>
  </article>`;
}

let detailRequest = 0;
let activeTrigger = null;
const preparedDialogs = new WeakSet();

function prepareDialog(dialog) {
  if (preparedDialogs.has(dialog)) return;
  preparedDialogs.add(dialog);
  dialog.classList.add("product-dialog");
  dialog.addEventListener("click", (event) => {
    if (
      event.target === dialog ||
      event.target.closest('[data-action="close-details"]')
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    const notification = dialog.querySelector("#toast");
    if (notification) document.body.append(notification);
    if (activeTrigger?.isConnected)
      activeTrigger.focus({ preventScroll: true });
    activeTrigger = null;
  });
}

async function openDetails(productId, trigger) {
  const request = ++detailRequest;
  trigger.setAttribute("aria-busy", "true");
  try {
    const product = await getProduct(productId);
    if (request !== detailRequest) return;
    if (!product)
      throw new Error(
        "This example product could not be found. Please refresh the catalog.",
      );
    const dialog = document.querySelector("#product-dialog");
    if (!dialog)
      throw new Error(
        "Product details are unavailable. Please refresh this page.",
      );
    prepareDialog(dialog);
    dialog.setAttribute("aria-labelledby", "product-detail-title");
    dialog.setAttribute("aria-describedby", "product-detail-description");
    dialog.innerHTML = `<button class="product-dialog-close icon-button" type="button" data-action="close-details" aria-label="Close product details" autofocus>${icons.x}</button>
      <div class="product-detail-grid">
        <div class="product-detail-image"><img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" width="800" height="640" decoding="async"></div>
        <div class="product-detail-copy">
          <p class="eyebrow">${escapeHTML(categoryName(product.category))} · Sample product</p>
          <h2 id="product-detail-title">${escapeHTML(product.name)}</h2>
          <p class="product-detail-price">${formatPrice(product.price)}<span>Example price</span></p>
          <span class="availability">${escapeHTML(product.availability)}</span>
          <p id="product-detail-description">${escapeHTML(product.description)}</p>
          <dl class="product-detail-specs">
            <div><dt>Dimensions</dt><dd>${escapeHTML(product.dimensions)}</dd></div>
            <div><dt>Material</dt><dd>${escapeHTML(product.material)}</dd></div>
            <div><dt>Finish</dt><dd>${escapeHTML(product.finish)}</dd></div>
          </dl>
          <p class="demo-note">A little inspiration for your home. This is an example product with illustrative photography, pricing, and availability.</p>
          <div class="product-detail-actions">
            <button class="button button-primary" type="button" data-action="add" data-product-id="${escapeHTML(product.id)}">${icons.plus}<span>Add to order</span></button>
            <button class="button button-secondary" type="button" data-action="close-details">Continue browsing</button>
          </div>
        </div>
      </div>`;
    activeTrigger = trigger;
    // Keep the live notification inside the native dialog's top layer.
    const notification = document.querySelector("#toast");
    if (notification) dialog.append(notification);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("dialog-open");
  } catch (error) {
    toast(
      error.message || "We could not open this product. Please try again.",
      "error",
    );
  } finally {
    trigger.removeAttribute("aria-busy");
  }
}

async function addProduct(productId, button) {
  if (button.disabled) return;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try {
    const product = await getProduct(productId);
    if (!product) throw new Error("This example product could not be found.");
    await addToCart(productId, 1);
    toast(`${product.name} added to your demo order.`);
  } catch (error) {
    toast(
      error.message || "Unable to save your demo order. Please try again.",
      "error",
    );
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

const interactionRoots = new WeakSet();

export function setupProductInteractions(root = document) {
  if (interactionRoots.has(root)) return;
  interactionRoots.add(root);
  root.addEventListener("click", (event) => {
    if (event.defaultPrevented || !(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-product-id][data-action]");
    if (!button || !root.contains(button)) return;
    const { action, productId } = button.dataset;
    if (action !== "details" && action !== "add") return;
    event.preventDefault();
    if (action === "details") void openDetails(productId, button);
    else void addProduct(productId, button);
  });
}
