"""Real image decode/storage: missing MIME labels, decoder fallback and visible failure feedback."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
EDITOR='http://127.0.0.1:4175/furniture-editor.html'
raw=Path('assets/images/sofa.webp').read_bytes()
def choose_without_type(page,kind):
 page.locator(f'#{kind}-photo-upload').evaluate('(input,bytes)=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(bytes)],"furniture.webp"));input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}));}',list(raw))
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for fallback in [False,True]:
  ctx=b.new_context();page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if fallback:page.add_init_script('Object.defineProperty(window,"createImageBitmap",{value:undefined});')
  page.goto(EDITOR);expect(page.locator('#save-status')).to_contain_text('Saved on this computer')
  page.locator('#new-category').click();page.locator('#category-form [name="name"]').fill('Photo test');choose_without_type(page,'category');expect(page.locator('#category-photo-status')).to_contain_text('furniture.webp added');expect(page.locator('#category-photo-upload')).not_to_have_value('');expect(page.locator('#category-photo-preview img')).to_be_visible();page.wait_for_function('document.querySelector("#category-photo-preview img").naturalWidth>0')
  path=page.locator('#category-form [name="imagePath"]').input_value()
  page.locator('#category-photo-upload').set_input_files({'name':'broken.heic','mimeType':'image/heic','buffer':b'not an image'});expect(page.locator('#category-photo-status')).to_contain_text('Save it as a JPG or PNG');expect(page.locator('#category-photo-status')).to_have_attribute('role','alert');expect(page.locator('#category-photo-upload')).not_to_have_value('');expect(page.locator('#category-form [name="imagePath"]')).to_have_value(path)
  page.locator('#remove-category-photo').click();expect(page.locator('#category-photo-upload')).to_have_value('');choose_without_type(page,'category');expect(page.locator('#category-photo-status')).to_contain_text('added');page.locator('#category-form .button-primary').click();expect(page.locator('#category-editor')).to_be_hidden()
  page.locator('#new-subcategory').click();page.locator('#subcategory-form [name="name"]').fill('Photo subcategory');choose_without_type(page,'subcategory');expect(page.locator('#subcategory-photo-status')).to_contain_text('added');expect(page.locator('#subcategory-photo-upload')).not_to_have_value('');page.locator('#subcategory-form .button-primary').click();expect(page.locator('#subcategory-editor')).to_be_hidden()
  page.locator('#new-product').click();page.locator('#product-form [name="name"]').fill('Photo test furniture');page.locator('#product-form [name="sku"]').fill('PHOTO1');page.locator('#product-form [name="price"]').fill('100');choose_without_type(page,'product');expect(page.locator('#product-photo-status')).to_contain_text('added');expect(page.locator('#product-photo-upload')).not_to_have_value('');page.wait_for_function('document.querySelector("#photo-preview img").naturalWidth>0');page.locator('#product-form .button-primary').click();expect(page.locator('#product-editor')).to_be_hidden();page.reload();expect(page.locator('#editor-products .product-card')).to_have_count(1);page.wait_for_function('document.querySelector("#editor-products img").naturalWidth>0')
  assert not errors,errors;ctx.close()
 b.close()
print('PASS: missing MIME image uploads for products/categories/subcategories; visible filenames and errors; existing photo preserved after failure; same-file reselection after removal; image-element decoder fallback; saved photo survives reload.')
