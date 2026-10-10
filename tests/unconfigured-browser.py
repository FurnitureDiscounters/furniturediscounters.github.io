"""Static catalog errors, supplied contacts, cart recovery, branding and responsive public pages."""
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:4173/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 for name in ['index.html?catalog=local','store.html?catalog=local','about.html?catalog=local','order.html?catalog=local']:
  assert page.goto(BASE+name).status==200;page.wait_for_load_state('networkidle');expect(page.locator('h1')).to_have_count(1);expect(page.locator('a[href="admin.html"]')).to_have_count(0)
  expect(page.locator('link[rel="icon"]')).to_have_attribute('href','assets/favicon.svg?v=8')
  for width in [1440,768,390,320]:page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(name,width)
  print('PASS:',name,'branding and four viewport widths')
 page.route('**/assets/data/catalog.json',lambda route:route.fulfill(status=503,body='Unavailable'))
 page.goto(BASE+'store.html?catalog=local');expect(page.locator('#catalog-status')).to_contain_text('temporarily unavailable');expect(page.locator('.product-card')).to_have_count(0)
 page.goto(BASE+'about.html?catalog=local');expect(page.locator('#contact')).to_contain_text('500 N. McCarran Blvd');expect(page.locator('#contact')).to_contain_text('Furniturediscounters@yahoo.com')
 page.evaluate("localStorage.setItem('fd.cart.v2',JSON.stringify(['missing-a','missing-b']))");page.goto(BASE+'order.html?catalog=local');expect(page.locator('.cart-item')).to_have_count(2);expect(page.locator('#submit-inquiry')).to_be_disabled();page.locator('[data-remove]').first.click();expect(page.locator('.cart-item')).to_have_count(1);page.locator('#reset-cart').click();expect(page.locator('#cart-empty')).to_be_visible()
 page.evaluate("localStorage.setItem('fd.cart.v2','corrupt')");page.reload();expect(page.locator('#order-feedback')).to_contain_text('Browser storage');page.locator('#reset-cart').click();expect(page.locator('#cart-empty')).to_be_visible()
 assert not errors,errors;b.close()
print('PASS: catalog failure handling, empty/corrupt cart recovery and no public editor links.')
