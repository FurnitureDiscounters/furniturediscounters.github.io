import { getProduct, getSettings } from './services/product-service.js';
import { getCart, removeFromCart, resetCart } from './services/order-service.js';
import { newOrderNumber, weekStart, submitPublicOrder, findPublicOrder, NUMBER_PATTERN } from './services/public-order-service.js';
import { toast, formatPrice, priceMarkup, escapeHTML as e } from './ui.js';
const $ = s => document.querySelector(s);
let catalog = new Map(), requestText = '', revision = 0, selectedProducts = [], creating = false;
function storedRequest() { try { return JSON.parse(localStorage.getItem('fd.inquiry.v1') || 'null'); } catch { return null; } }
function signature(products) { return products.map(p => p.id).sort().join(','); }
let contact = { email: 'Furniturediscounters@yahoo.com', phone: '(775) 823-9322' };
async function renderCart() {
  const seq = ++revision;
  selectedProducts = []; $('#submit-inquiry').disabled = true;
  $('#email-selection').hidden = true; $('#copy-selection').disabled = true;
  $('#order-feedback').textContent = '';
  try {
    const items = await getCart();
    let fetchError = '';
    const products = await Promise.all(items.map(async ({ productId }) => {
      try {
        if (!catalog.has(productId)) catalog.set(productId, await getProduct(productId,{fullPhotos:false}));
        return catalog.get(productId);
      } catch (error) { fetchError = error.message; return null; }
    }));
    if (seq !== revision) return;
    $('#cart-content').hidden = !items.length; $('#cart-empty').hidden = !!items.length;
    let total = 0, unavailable = false;
    $('#cart-items').innerHTML = items.map(({ productId }, n) => {
      const p = products[n]; if (!p?.purchasable) unavailable = true;
      if (p) total += p.priceCents;
      return `<article class="cart-item">${p?.image ? `<img class="cart-item-image" src="${e(p.image)}" alt="${e(p.name)}" width="115" height="125">` : '<div class="cart-item-image"></div>'}<div class="cart-item-info"><h3>${e(p?.name || 'Unavailable product')}</h3><p>Quantity: 1 · ${e(p?.availability || (fetchError ? 'Refresh to load product details' : 'No longer listed'))}</p><button class="text-button" data-remove="${e(productId)}" type="button">Remove</button></div><strong class="cart-item-price">${p ? priceMarkup(p) : '—'}</strong></article>`;
    }).join('');
    $('#cart-total').textContent = $('#cart-subtotal').textContent = formatPrice(total / 100);
    if (unavailable) { $('#order-feedback').textContent = fetchError || 'Remove unavailable products before preparing your pickup inquiry.'; return; }
    selectedProducts = products;
    $('#submit-inquiry').disabled = creating || !products.length;
    const receipt = storedRequest();
    const number = receipt?.confirmed && receipt.signature === signature(products) && NUMBER_PATTERN.test(receipt.number) ? receipt.number : '';
    if(number)confirmation(number,products,receipt.week||weekStart());else $('#inquiry-confirmation').hidden=true;
    requestText = 'Hello Furniture Discounters,\nPlease confirm availability and pickup for these pieces:\n\n' + products.map(p => `1 × ${p.name} (SKU ${p.sku}) — ${formatPrice(p.price)}`).join('\n') + `\n\nEstimated merchandise total: ${formatPrice(total / 100)}.\nPlease confirm prices, taxes and pickup arrangements.\n\nMy name and phone number: `;
    if(number) requestText += `\n\nOrder number: ${number}\nWeek of: ${receipt.week||weekStart()}`;
    if (items.length) {
      $('#email-selection').href = `mailto:${contact.email}?subject=${encodeURIComponent(number ? `Furniture pickup inquiry — ${number}` : 'Furniture pickup inquiry')}&body=${encodeURIComponent(requestText)}`;
      $('#email-selection').hidden = !contact.email; $('#copy-selection').disabled = false;
    }
  } catch (error) {
    if (seq !== revision) return;
    $('#order-feedback').textContent = error.message || 'Your selection could not be loaded. Please try again.';
    $('#cart-content').hidden = false;
  }
}
$('#cart-items').addEventListener('click', async event => {
  const button = event.target.closest('[data-remove]'); if (!button) return;
  try { await removeFromCart(button.dataset.remove); } catch (error) { $('#order-feedback').textContent = error.message; }
});
$('#reset-cart').addEventListener('click', async () => {
  try { await resetCart(); } catch (error) { $('#order-feedback').textContent = error.message; }
});
$('#retry-selection').addEventListener('click', () => { catalog.clear(); void renderCart(); });
$('#copy-selection').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(requestText); toast('Selection copied. Send it to the store to ask about pickup.'); }
  catch { $('#selection-text').value = requestText; $('#selection-text').hidden = false; $('#selection-text').focus(); $('#selection-text').select(); }
});
window.addEventListener('cart-updated', () => void renderCart());
window.addEventListener('storage', () => void renderCart());
function updateContact() {
  $('#pickup-phone').href = `tel:${contact.phone.replace(/[^+0-9]/g, '')}`;
  $('#pickup-phone').textContent = contact.phone;
  $('#pickup-email').href = `mailto:${contact.email}`; $('#pickup-email').textContent = contact.email;
}
updateContact();
void renderCart();
Promise.resolve().then(() => getSettings()).then(settings => { contact = { ...contact, ...settings }; updateContact(); void renderCart(); }).catch(() => {});

function publicOrderMarkup(order) {
  return `<h3>${e(order.number)}</h3>${order.week?`<p>Week of ${e(order.week)}</p>`:''}<ul class="order-lines">${order.items.map(i => `<li><img data-order-product="${e(i.productId)}" alt="${e(i.name)}" width="74" height="74" hidden><span>${e(i.name)}<br><small>SKU ${e(i.sku)} · Quantity ${i.quantity}</small></span><strong>${formatPrice(i.priceCents*i.quantity/100)}</strong></li>`).join('')}</ul><p>Recorded merchandise estimate: ${formatPrice(order.items.reduce((sum,i)=>sum+i.priceCents*i.quantity,0)/100)}. Contact the store to confirm final prices, taxes and pickup.</p>`;
}
async function orderImages(root){for(const img of root.querySelectorAll('[data-order-product]')){try{const product=await getProduct(img.dataset.orderProduct,{fullPhotos:false});if(img.isConnected){if(product?.image){img.src=product.image;img.hidden=false;}else img.replaceWith(Object.assign(document.createElement('span'),{className:'order-photo-missing',textContent:'Photo unavailable'}));}}catch{if(img.isConnected)img.replaceWith(Object.assign(document.createElement('span'),{className:'order-photo-missing',textContent:'Photo unavailable'}));}}}
function confirmation(number,products,week=weekStart()){$('#created-order-number').textContent=number;$('#created-order-week').textContent=`Week of ${week}`;$('#inquiry-products').innerHTML=`<ul class="order-lines">${products.map(p=>`<li>${p.image?`<img src="${e(p.image)}" alt="${e(p.name)}" width="74" height="74">`:''}<span>${e(p.name)}<br><small>SKU ${e(p.sku)} · Quantity 1</small></span><strong>${formatPrice(p.priceCents/100)}</strong></li>`).join('')}</ul>`;$('#inquiry-confirmation').hidden=false;}
$('#submit-inquiry').addEventListener('click', async () => {
  if(creating || !selectedProducts.length) return;
  creating=true;$('#submit-inquiry').disabled=true;$('#order-feedback').textContent='';
  const products=[...selectedProducts];
  try {
    const previous=storedRequest(), key=signature(products),week=previous?.signature===signature(products)&&previous.week?previous.week:weekStart();
    let number=previous?.signature===key && NUMBER_PATTERN.test(previous.number) ? previous.number : '',reuse=!!number;
    for(let attempt=0;attempt<100;attempt++){
      if(!number)number=newOrderNumber();
      // Journal before submission so a lost response can be retried with the same number.
      localStorage.setItem('fd.inquiry.v1',JSON.stringify({signature:key,number,week,confirmed:false}));
      try{await submitPublicOrder(number,products,week,reuse);break;}
      catch(error){if(error.code!=='order-number-collision')throw error;number='';reuse=false;localStorage.removeItem('fd.inquiry.v1');}
    }
    if(!number)throw new Error('Could not choose an unused order number. Please retry.');
    localStorage.setItem('fd.inquiry.v1',JSON.stringify({signature:key,number,week,confirmed:true}));
    confirmation(number,products,week);$('#inquiry-confirmation').focus();$('#public-order-number').value=number;$('#public-order-week').value=week;
    await renderCart();
  } catch(error) { $('#order-feedback').textContent=error.code==='permission-denied' ? 'Order numbers are not enabled yet. Contact the store or try again after the updated rules are published.' : error.message || 'Your inquiry could not be recorded. Retry to keep the same number.'; }
  finally { creating=false;$('#submit-inquiry').disabled=!selectedProducts.length; }
});
$('#copy-created-number').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#created-order-number').textContent);toast('Order number copied.'); } catch { toast('Select and copy the order number shown above.','error'); } });
$('#public-order-lookup').addEventListener('submit', async event => {
  event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;$('#lookup-feedback').textContent='';$('#public-order-result').replaceChildren();
  try {const order=await findPublicOrder($('#public-order-number').value,$('#public-order-week').value||weekStart());if(!order)$('#lookup-feedback').textContent='No order matches that number. Check the number and its week, then try again.';else {$('#public-order-result').innerHTML=publicOrderMarkup(order);void orderImages($('#public-order-result'));}}
  catch(error){$('#lookup-feedback').textContent=error.code==='permission-denied'?'Online lookup is not enabled yet. Contact the store with your number.':error.message||'Order lookup is temporarily unavailable.';}
  finally{button.disabled=false;}
});
const previous=storedRequest();$('#public-order-week').value=previous?.week||weekStart();if(previous?.number)$('#public-order-number').value=previous.number;
