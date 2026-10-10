"""No-auth customer submission/lookup across devices plus local-editor online lookup."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:4173/'
EDITOR=os.environ.get('FD_EDITOR_URL','http://127.0.0.1:4175/furniture-editor.html')
catalog=json.loads(Path('assets/data/catalog.json').read_text())
catalog['subcategories']=[{'id':'sofas','category':'living-room','name':'Sofas','description':'','active':True}]
catalog['products']=[{'id':'fixture-sofa','name':'Fixture Sofa','sku':'TEST-1','description':'Test only','priceCents':79900,'oldPriceCents':99900,'stock':2,'category':'living-room','subcategory':'sofas','dimensions':'80 × 36 × 34 in','material':'Teak','finish':'Natural','images':['assets/images/sofa.webp'],'active':True,'available':True,'featured':True}]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=b.new_context();page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));context.route('**/assets/data/catalog.json',lambda route:route.fulfill(content_type='application/json',body=json.dumps(catalog)))
 page.goto(BASE+'store.html?catalog=local');expect(page.locator('.product-card')).to_have_count(1);page.locator('[data-action="add"]').click();expect(page.locator('[data-cart-count]').first).to_have_text('1')
 page.goto(BASE+'order.html?emulator=1&catalog=local');expect(page.locator('#submit-inquiry')).to_be_enabled();page.locator('#submit-inquiry').click();expect(page.locator('#inquiry-confirmation')).to_be_visible(timeout=15000)
 number=page.locator('#created-order-number').inner_text();assert 1000<=int(number)<=10000
 expect(page.locator('#inquiry-products img')).to_be_visible();assert page.locator('#inquiry-products img').evaluate('(img)=>img.complete&&img.naturalWidth>0')
 page.locator('#submit-inquiry').click();expect(page.locator('#created-order-number')).to_have_text(number)
 fresh=b.new_context();fresh.route('**/assets/data/catalog.json',lambda route:route.fulfill(content_type='application/json',body=json.dumps(catalog)));other=fresh.new_page();other.goto(BASE+'order.html?emulator=1&catalog=local');other.locator('#public-order-number').fill(number.lower());other.locator('#public-order-lookup button').click();expect(other.locator('#public-order-result')).to_contain_text('Fixture Sofa',timeout=15000);expect(other.locator('#public-order-result')).to_contain_text('$799');expect(other.locator('#public-order-result img')).to_be_visible();assert 'Ready' not in other.locator('#public-order-result').inner_text();assert 'Preparing' not in other.locator('#public-order-result').inner_text()
 other.locator('#public-order-number').fill('WRONG');other.locator('#public-order-lookup button').click();expect(other.locator('#lookup-feedback')).to_contain_text('No order matches')
 # Orders stream into a fresh editor without loading a catalog or clicking Show orders.
 live=b.new_context();live.route('**/assets/data/catalog.json',lambda route:route.fulfill(content_type='application/json',body=json.dumps(catalog)));editor=live.new_page();editor.goto(EDITOR+'?emulator=1&catalog=local');editor.locator('#firebase-login [name="password"]').fill('Emulator-only-test-1020');editor.locator('#firebase-login .button-secondary').click();editor.locator('[data-tab="orders"]').click();expect(editor.locator('#live-orders-status')).to_contain_text('Live ·',timeout=15000);expect(editor.locator('#order-results')).to_contain_text(number);expect(editor.locator('#order-results')).to_contain_text('Fixture Sofa');expect(editor.locator('#save-status')).to_contain_text('0 products')
 # Same immutable number can be checked in the local file without any account.
 page.goto(EDITOR+'?emulator=1&catalog=local');expect(page.locator('#save-status')).to_contain_text('Saved on this computer');expect(page.locator('#login-form')).to_have_count(0);page.locator('[data-tab="orders"]').click();page.locator('#order-number-search').fill(number);page.locator('#order-search-form button').click();expect(page.locator('#order-results')).to_contain_text('Fixture Sofa',timeout=15000);page.locator('#keep-public-order').click();page.locator('#order-form [name="name"]').fill('LOCAL PRIVATE CUSTOMER');page.locator('#order-form .button-primary').click();expect(page.locator('#order-editor')).to_be_hidden();page.reload();expect(page.locator('#save-status')).to_contain_text('1 local orders');page.locator('[data-tab="orders"]').click();page.locator('#order-number-search').fill(number);page.locator('#order-search-form button').click();expect(page.locator('#order-results')).to_contain_text('LOCAL PRIVATE CUSTOMER')
 assert not errors,errors;b.close()
print('PASS: no-auth order creation, retry reuses number, lookup from a fresh device/context by number alone, no status controls, unknown number handling, local editor online lookup and private local copy persistence.')
