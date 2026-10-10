import { getCart } from "./services/order-service.js";

const toggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
function setMenu(open) {
  toggle?.setAttribute("aria-expanded", String(open));
  toggle?.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  mobileNav?.classList.toggle("is-open", open);
  if (mobileNav) mobileNav.inert = !open;
}
toggle?.addEventListener("click", () =>
  setMenu(toggle.getAttribute("aria-expanded") !== "true"),
);
mobileNav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    toggle?.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    toggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) setMenu(false);
});
window.matchMedia("(min-width: 601px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

async function refreshCartCount() {
  try {
    const cart = await getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = count > 99 ? "99+" : count;
    });
    document
      .querySelector(".order-icon")
      ?.setAttribute(
        "aria-label",
        `My order, ${count} ${count === 1 ? "item" : "items"}`,
      );
  } catch {
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = "!";
    });
    document
      .querySelector(".order-icon")
      ?.setAttribute("aria-label", "My order: browser storage needs attention");
  }
}
window.addEventListener("cart-updated", refreshCartCount);
void refreshCartCount();
document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

if (
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06 },
  );
  document.querySelectorAll(".reveal").forEach((element) => {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add("will-reveal");
      observer.observe(element);
    }
  });
}

// Business details and announcements are editable without changing HTML.
import { getSettings, getCategories } from './services/product-service.js';
async function updateBusinessInformation() {
  try {
    const settings = await getSettings();
    for (const [key, value] of Object.entries(settings)) {
      document.querySelectorAll(`[data-setting="${key}"]`).forEach(el => { if (typeof value === 'string' && (value || key !== 'story')) { el.textContent = value; if (el.tagName === 'A') { if (key === 'address') el.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`; if (key === 'phone') el.href = `tel:${value.replace(/[^+0-9]/g, '')}`; if (key === 'email') el.href = `mailto:${value}`; } } });
    }
    if (settings.announcement) document.querySelectorAll('.announcement-inner > span').forEach(el => { el.textContent = settings.announcement; });
  } catch { /* Accurate, supplied store details remain available offline. */ }
  try {
    const categories = await getCategories();
    document.querySelectorAll('[data-category-links]').forEach(el => {
      el.replaceChildren(...categories.slice(0, 6).map(c => {
        const a = document.createElement('a'); a.href = `store.html?category=${encodeURIComponent(c.id)}`; a.textContent = c.name; return a;
      }));
    });
  } catch { /* The store link remains available. */ }
}
window.addEventListener('storage', refreshCartCount);
void updateBusinessInformation();
