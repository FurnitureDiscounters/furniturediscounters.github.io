import{b as m,f as c,g as l,l as u}from"./chunk-LFERSDQ6.js";var P=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:2});function y(t){return P.format(Number(t)||0)}function s(t){return String(t??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}var r=t=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${t}</svg>`,d={arrow:r('<path d="M4 12h16m-6-6 6 6-6 6"/>'),plus:r('<path d="M12 5v14M5 12h14"/>'),minus:r('<path d="M5 12h14"/>'),check:r('<path d="m5 12 4 4L19 6"/>'),bag:r('<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>'),x:r('<path d="m6 6 12 12M6 18 18 6"/>'),search:r('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'),copy:r('<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>'),info:r('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'),trash:r('<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>')},f;function p(t,a="success"){let e=document.querySelector("#toast");e||(e=document.createElement("div"),e.id="toast",e.className="toast",e.setAttribute("role","status"),e.setAttribute("aria-live","polite"),document.body.append(e)),clearTimeout(f),e.dataset.type=a,e.innerHTML=`${a==="error"?d.info:d.check}<span>${s(t)}</span>`,e.classList.add("is-visible"),f=setTimeout(()=>e.classList.remove("is-visible"),a==="error"?6500:4e3)}function w(t){return`<span class="price-pair">${Number.isInteger(t.oldPriceCents)&&t.oldPriceCents!==t.priceCents?`<del class="previous-price" aria-label="Previous price">${y(t.oldPriceCents/100)}</del>`:""}<strong class="current-price">${y(t.priceCents/100)}</strong></span>`}function C(t){let a=s(t.id),e=s(t.name);return`<article class="product-card">
    <button class="product-image-button" type="button" data-action="details" data-product-id="${a}" aria-label="View details for ${e}">
      ${t.image?`<img class="product-image" src="${s(t.image)}" alt="${e}" width="800" height="640" loading="lazy" decoding="async">`:'<div class="photo-unavailable">Photograph unavailable</div>'}
      ${t.featured?'<span class="product-badge">Featured</span>':""}
    </button>
    <div class="product-info">
      <p class="product-category">${s(c(t.category))}${t.subcategory?` \xB7 ${s(l(t.subcategory))}`:""}</p>
      <h3 class="product-title"><button class="product-title-button" type="button" data-action="details" data-product-id="${a}">${e}</button></h3>
      <p class="product-description">${s(t.description)}</p>
      <div class="product-meta"><span class="product-price">${w(t)}</span><span class="availability">${s(t.availability)}</span></div>
      <div class="product-actions">
        <button class="button button-secondary button-small" type="button" data-action="details" data-product-id="${a}" aria-label="View details for ${e}">View details</button>
        <button class="button button-primary button-small" type="button" data-action="add" data-product-id="${a}" ${t.purchasable?"":"disabled"} aria-label="Add ${e} to cart">${d.plus}<span>Add to cart</span></button>
      </div>
    </div>
  </article>`}var v=0,n=null,g=new WeakSet;function x(t){g.has(t)||(g.add(t),t.classList.add("product-dialog"),t.addEventListener("click",a=>{(a.target===t||a.target.closest('[data-action="close-details"]'))&&t.close()}),t.addEventListener("close",()=>{document.body.classList.remove("dialog-open");let a=t.querySelector("#toast");a&&document.body.append(a),n?.isConnected&&n.focus({preventScroll:!0}),n=null}))}async function k(t,a){let e=++v;a.setAttribute("aria-busy","true");try{let i=await u(t);if(e!==v)return;if(!i)throw new Error("This product could not be found. Please refresh the catalog.");let o=document.querySelector("#product-dialog");if(!o)throw new Error("Product details are unavailable. Please refresh this page.");x(o),o.setAttribute("aria-labelledby","product-detail-title"),o.setAttribute("aria-describedby","product-detail-description"),o.innerHTML=`<button class="product-dialog-close icon-button" type="button" data-action="close-details" aria-label="Close product details" autofocus>${d.x}</button>
      <div class="product-detail-grid">
        <div class="product-detail-image">${i.images.map((M,h)=>`<img src="${s(M)}" alt="${s(i.name)} \u2014 photograph ${h+1}" width="800" height="640" decoding="async" loading="${h?"lazy":"eager"}">`).join("")||"<p>Photographs are currently unavailable.</p>"}</div>
        <div class="product-detail-copy">
          <p class="eyebrow">${s(c(i.category))}${i.subcategory?` \xB7 ${s(l(i.subcategory))}`:""}</p>
          <h2 id="product-detail-title">${s(i.name)}</h2>
          <p class="product-detail-price">${w(i)}</p>
          <span class="availability">${s(i.availability)}</span>
          <p id="product-detail-description">${s(i.description)}</p>
          <dl class="product-detail-specs">
            <div><dt>Dimensions</dt><dd>${s(i.dimensions)}</dd></div>
            <div><dt>Material</dt><dd>${s(i.material)}</dd></div>
            <div><dt>Finish</dt><dd>${s(i.finish)}</dd></div>
          </dl>
          <p class="pickup-note">SKU: ${s(i.sku)} \xB7 One of each per selection. Staff confirm availability and pickup. Pay in store.</p>
          <div class="product-detail-actions">
            <button class="button button-primary" type="button" data-action="add" data-product-id="${s(i.id)}" ${i.purchasable?"":"disabled"}>${d.plus}<span>Add to cart</span></button>
            <button class="button button-secondary" type="button" data-action="close-details">Continue browsing</button>
          </div>
        </div>
      </div>`,n=a;let b=document.querySelector("#toast");b&&o.append(b),o.open||o.showModal(),document.body.classList.add("dialog-open")}catch(i){p(i.message||"We could not open this product. Please try again.","error")}finally{a.removeAttribute("aria-busy")}}async function L(t,a){if(!a.disabled){a.disabled=!0,a.setAttribute("aria-busy","true");try{let e=await u(t,{fullPhotos:!1});if(!e)throw new Error("This product could not be found.");if(!e.purchasable)throw new Error("This product is currently unavailable.");await m(t),p(`${e.name} added to your cart.`)}catch(e){p(e.message||"Unable to save your cart. Please try again.","error")}finally{a.disabled=!1,a.removeAttribute("aria-busy")}}}var $=new WeakSet;function T(t=document){$.has(t)||($.add(t),t.addEventListener("click",a=>{if(a.defaultPrevented||!(a.target instanceof Element))return;let e=a.target.closest("button[data-product-id][data-action]");if(!e||!t.contains(e))return;let{action:i,productId:o}=e.dataset;i!=="details"&&i!=="add"||(a.preventDefault(),i==="details"?k(o,e):L(o,e))}))}export{y as a,s as b,d as c,p as d,w as e,C as f,T as g};
