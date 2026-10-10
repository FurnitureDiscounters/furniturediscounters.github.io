import json, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page()
 page.route('**/preview-test.html',lambda r:r.fulfill(content_type='text/html',body='<iframe src="https://editor.example/furniture-editor.html" style="width:700px;height:800px"></iframe>'))
 page.route('https://editor.example/furniture-editor.html',lambda r:r.fulfill(content_type='text/html',body=Path('/workspace/local-editor/furniture-editor.html').read_text()))
 page.add_init_script("Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Storage blocked in preview','SecurityError')}});")
 page.on('dialog',lambda d:d.accept())
 page.goto('https://preview.example/preview-test.html')
 f=page.frame_locator('iframe')
 expect(f.locator('#save-status')).not_to_contain_text('Creating your local database')
 with page.expect_file_chooser() as chosen:f.locator('#open-database').click()
 assert chosen.value.element.get_attribute('id')=='database-file'
 expect(f.locator('#editor-feedback')).to_have_text('')
 with page.expect_download() as downloaded:f.locator('#save-database').click()
 assert downloaded.value.suggested_filename=='furniture-database.json'
 color=f.locator('[data-category]').nth(1).evaluate('(el)=>getComputedStyle(el).color')
 assert color=='rgb(51, 42, 35)',color
 expect(f.locator('#editor-feedback')).not_to_contain_text('Cross origin')
 expect(f.locator('#storage-warning')).to_be_visible()
 catalog=json.loads(Path('assets/data/catalog.json').read_text());catalog['categories'][0]['name']='Restored category'
 with page.expect_file_chooser() as chosen:f.locator('#open-database').click()
 chosen.value.set_files({'name':'saved-database.json','mimeType':'application/json','buffer':json.dumps(catalog).encode()})
 expect(f.locator('#category-list')).to_contain_text('Restored category')
 expect(f.locator('#editor-feedback')).to_contain_text('Opened saved-database.json')
 with page.expect_download() as downloaded:f.locator('#backup-database').click()
 saved=tempfile.mktemp(suffix='.zip');downloaded.value.save_as(saved)
 page.reload()
 expect(f.locator('#category-list')).not_to_contain_text('Restored category')
 with page.expect_file_chooser() as chosen:f.locator('#open-database').click()
 chosen.value.set_files(saved)
 expect(f.locator('#category-list')).to_contain_text('Restored category')
 Path(saved).unlink()
 b.close()
 print('PASS: cross-origin preview open-file fallback, JSON save download, and readable unselected categories')
