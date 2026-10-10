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

Production account creation, rules deployment and GitHub Pages publication remain unperformed. The cloud network policy excludes Firebase Authentication and Firestore endpoints. The user can create their store account using the editor's Create store account button, verify the inbox, publish the supplied rules, publish the updated site, and then upload real inventory using Publish to Firebase. No password is embedded in the artifact/source.

Managed Chromium blocks direct file:// navigation, and that policy was not bypassed. The standalone file was tested over local HTTP and an intercepted cross-origin preview fixture; direct-file behavior on the user's computer remains unverified. Browser storage/file APIs vary. Photos and contact records in cloud backups have read/write/storage quota costs; see FIREBASE-SETUP.md.
