import { getFeaturedProducts, getCategories } from './services/product-service.js';
import { productCard, setupProductInteractions, escapeHTML, icons } from './ui.js';
async function loadHome() {
  const grid = document.querySelector('#featured-products'), categoryGrid = document.querySelector('#home-categories');
  grid.setAttribute('aria-busy', 'true');
  try {
    const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);
    grid.innerHTML = products.map(productCard).join('') || '<p class="inline-message">Explore our latest arrivals in the store.</p>';
    categoryGrid.style.setProperty('--category-count', Math.min(3, Math.max(1, categories.length)));
    categoryGrid.innerHTML = categories.map(c => `<a class="category-card" style="--category-accent:${escapeHTML(c.accent)}" href="store.html?category=${encodeURIComponent(c.id)}"><div class="category-image">${c.image ? `<img src="${escapeHTML(c.image)}" alt="${escapeHTML(c.name)}" width="500" height="600" loading="lazy">` : `<span class="category-monogram">${escapeHTML(c.name)}</span>`}</div><span>${escapeHTML(c.name)}${icons.arrow}</span></a>`).join('') || '<p class="inline-message">New collections will appear here as they arrive.</p>';
  } catch (error) {
    grid.textContent = error.message || 'The collection could not be loaded. Please try again later.';
    categoryGrid.innerHTML = '<a class="text-link" href="store.html">Browse the store</a>';
  } finally { grid.setAttribute('aria-busy', 'false'); }
}
setupProductInteractions();
void loadHome();

const categoryRow=document.querySelector('#home-categories'),previous=document.querySelector('#home-categories-previous'),next=document.querySelector('#home-categories-next');
function scrollControls(){previous.disabled=categoryRow.scrollLeft<=1;next.disabled=categoryRow.scrollLeft+categoryRow.clientWidth>=categoryRow.scrollWidth-1;}
previous.addEventListener('click',()=>categoryRow.scrollBy({left:-categoryRow.clientWidth*.8,behavior:'smooth'}));
next.addEventListener('click',()=>categoryRow.scrollBy({left:categoryRow.clientWidth*.8,behavior:'smooth'}));
categoryRow.addEventListener('scroll',scrollControls,{passive:true});new ResizeObserver(scrollControls).observe(categoryRow);new MutationObserver(scrollControls).observe(categoryRow,{childList:true});scrollControls();
