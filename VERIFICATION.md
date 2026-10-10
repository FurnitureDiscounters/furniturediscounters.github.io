# Verification

Executed with Node 22.23.3, Java 21, Python Playwright and Chromium in this cloud instance:

- `npm run build` and `npm run build:editor` generated production storefront bundles and the standalone HTML.
- `npm test` passed five model/catalog tests and six real Standard Firestore rule tests. Includes 2,000-product filtering, strict catalog validation, public/private separation, twenty-line inquiry validation, denied customer listing/update/deletion, verified-store authorization, denied unverified/other users, and bounded schema validation for private orders, chunk pointers and immutable photo snapshots.
- `python3 tests/editor-preview-browser.py` passed cross-origin picker/download fallback, readable category labels, and persistent warnings plus backup/restore when preview browser storage is explicitly blocked.
- `python3 tests/offline-browser.py` passed automatic local database creation, local editing without login, categories/subcategories/styles, resized photos, persistence, previous price crossing out, private/public exports, ZIP restoration, and responsive storefront fixtures at 1440/768/390/320 pixels.
- `python3 tests/unconfigured-browser.py` passed four public fixture pages, branding/width checks, catalog error handling and cart recovery.
- `python3 tests/cloud-editor-browser.py` under real Auth/Firestore emulators passed verified-store login, actual product/photo/private-order publishing, restoration into a fresh editor/browser database, public Firebase catalog/cart/prices with no local JSON fetch, and rejection of a stale publication.
- `node tests/cloud-scale.mjs` under Auth/Firestore passed actual upload/readback of 2,000 products across multiple bounded JSON chunks, including Unicode specifications.
- `python3 tests/order-number-browser.py` under Firestore passed immutable inquiry creation, idempotent retry, exact-number lookup from a fresh customer context, no status controls, unknown number handling and local private copy persistence.

Run the full cloud integration and scale checks with retained HTTP servers on 4173 (repository) and 4175 (`/workspace/local-editor`):

```sh
export PATH=/workspace/.tools/node-v22.23.3-linux-x64/bin:$PATH
export XDG_CONFIG_HOME=/workspace/.config
export FIREBASE_EMULATORS_PATH=/workspace/.firebase-emulators
npx firebase emulators:exec --project demo-furniture-discounters --only auth,firestore 'node tests/seed-cloud-editor.mjs && python3 tests/cloud-editor-browser.py && node tests/cloud-scale.mjs && python3 tests/order-number-browser.py'
```

The seed/scale scripts enforce loopback-only demo emulators. Their account/password and product fixtures are test-only; no production inventory is created. Static fixture browser checks use explicit loopback-only `?catalog=local`. The production storefront always uses Firebase. These fixture checks complement, rather than replace, actual SDK/emulator tests.

The storefront and supplied editor ZIP were uploaded in commit `61e08227f9e4444052910a626c0ff2ed9231e4a3` through the FurnitureDiscounters GitHub connection. The uploaded Git tree matched the local tree exactly. The ZIP passed its integrity check, matched a fresh editor build, and has SHA-256 `4fd1234635f45c5901754e42c0434a916fa37efaf394dee765d1eda53d0f9c47`. A fresh storefront build and all five model/six Firestore rule tests passed before upload. [GitHub Pages deployment](https://github.com/FurnitureDiscounters/furniturediscounters.github.io/actions/runs/38024042770) and [Store checks](https://github.com/FurnitureDiscounters/furniturediscounters.github.io/actions/runs/38024044010) both completed successfully for that commit. Production Firebase account creation and rules deployment remain unperformed. The cloud network policy excludes Firebase Authentication and Firestore endpoints. The user can create their store account using the editor's Create store account button, verify the inbox, publish the supplied rules, publish the updated site, and then upload real inventory using Publish to Firebase. No password is embedded in the artifact/source.

Managed Chromium blocks direct file:// navigation, and that policy was not bypassed. The standalone file was tested over local HTTP and an intercepted cross-origin preview fixture; direct-file behavior on the user's computer remains unverified. Browser storage/file APIs vary. Photos and contact records in cloud backups have read/write/storage quota costs; see FIREBASE-SETUP.md.

## Live orders and weekly references

The updated editor subscribes to incoming website inquiries and current cloud order records after verified sign-in, independently of catalog loading. All orders are listed, including earlier weeks; signed-out editors retain their local records. New public references are random 1000–10000 numbers, with a separate Monday-starting pool in America/Los_Angeles. Existing full references still work, and past weeks are preserved. The internal key format is compatible with the deployed rules. Public inquiries remain item lists without private customer contacts.

Verified for this update:
- Fresh storefront/editor builds; six model tests and six Firestore rule tests.
- Offline editing, backup/restore, and cross-origin preview fallback browser checks.
- Auth/Firestore browser integration: existing private orders appear before catalog loading; an incoming website inquiry and product photo appear in an open signed-in editor without a manual refresh.
- A fresh signed-in editor shows inquiries when no editor catalog has been published.
- Customer confirmation and lookup show product photos and the short reference; retry reuses the reference.
- `node tests/weekly-orders.mjs` verifies range, Monday/year-boundary week handling, the same number in different weeks, historic lookup, legacy lookup, and concurrent collision rejection.

Run cloud browser checks and the weekly suite with loopback HTTP servers on 4173 and 4175:

```sh
npx firebase emulators:exec --project demo-furniture-discounters --only auth,firestore 'node tests/seed-cloud-editor.mjs && python3 tests/cloud-editor-browser.py'
npx firebase emulators:exec --project demo-furniture-discounters --only auth,firestore 'node tests/seed-cloud-editor.mjs && python3 tests/order-number-browser.py && node tests/weekly-orders.mjs'
```

Each command starts with a fresh emulator database. Rebuild the editor before running the browser checks. Product photos resolve from the available local/cloud catalog; older records whose products have been removed may show Photo unavailable. Existing inquiry records have no historical photo path in their immutable schema.

The simplified order editor removes customer contact and quantity controls, retains Add furniture (one piece per addition), and preserves older imported contact/quantity data internally. The standalone HTML is provided at `downloads/furniture-editor.html`; the ZIP contains the same HTML. Offline save/backup browser checks and cloud editor integration checks cover the simplified form.

## Collection photo rows and permanent deletion (2026-10-10)

- Production storefront/editor builds passed. Seven model tests and seven Standard Firestore rule tests passed.
- Offline browser checks cover category/subcategory photo upload, photo bytes in public exports and private backups, restored offline order deletion, thumbnail loading, and one-row homepage scrolling at 1440/768/390/320 pixels without page overflow. Preview checks passed.
- Auth/Firestore browser checks cover permanent website inquiry deletion, lookup returning no order, live removal on two connected editors, removal from a previously disconnected editor on reconnection, persistence after reload, and permanent deletion of a published private order followed by an empty cloud restore.
- Order-number browser checks and weekly reference/collision tests passed. Customer/unverified/other-user deletion remains denied; authorized owner deletion succeeds.
- Current ZIP matches the standalone HTML byte for byte and passes ZIP integrity checks. SHA-256: `6e75082fb943469c3bb99915188ff981ba38475c86bfedccacf64cbc891047c0`. No production account password is embedded.

**Production Firestore rules are still not deployed here.** CLI inspection failed because no Firebase login is available, and the cloud network excludes production Firebase endpoints. Website publishing does not deploy database rules. Use the updated editor's Copy rules button, open Firebase rules, paste and Publish. Until then, online inquiry deletion is blocked and leaves the order intact; offline order deletion works. The editor supplies the complete rules and a download fallback. Hash receipts contain no order contents and prevent older copies from republishing deleted records; exported backup files cannot be erased remotely.

## Image upload feedback and compatibility

Reproduced a valid WebP upload rejected when the browser provides an empty MIME type: no preview, selected filename cleared, and the error was only in the distant global feedback area. The editor now accepts recognized image filenames without a MIME label and uses an image-element decoder fallback. Successful and failed uploads retain the selected filename; progress, success and failure text appear next to the photo input. Undecodable photos request conversion to JPG/PNG, and failed replacements preserve the existing photo.

`python3 tests/photo-upload-browser.py` passed real product/category/subcategory uploads with missing MIME labels, filename retention, visible decode errors, preserved previous photo, reselection after removal, actual decoder fallback with createImageBitmap unavailable, and persistence after reload. Offline photo editing/export/backup/restore/responsive checks and cross-origin preview checks also passed. The standalone editor rebuilt successfully; the ZIP passes integrity checks and matches the HTML byte for byte. Latest ZIP SHA-256: `bfd02541ca9acec0d22e4409814317de5b412494fafc46d8824cc29389bd098d`.
