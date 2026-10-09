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
