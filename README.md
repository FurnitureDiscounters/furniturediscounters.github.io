# Furniture Discounters

GitHub Pages storefront connected to the existing free Spark **Standard Firestore** database. [Download the standalone editor ZIP](https://furniturediscounters.github.io/downloads/furniture-editor.zip), extract it, and open `furniture-editor.html` on your computer. A standalone local HTML editor manages categories/subcategories, colors/layouts, products/photos, specifications, price history and orders. Local editing and backups work without a login; cloud publishing/restoration uses the authorized store account.

**Publish to Firebase** uploads the full editor catalog, optimized photographs and private order records, then atomically switches the public catalog to the new version. The website reads Firebase instead of the bundled empty JSON catalog. **Load from Firebase** restores the catalog, private orders and customer inquiry numbers on another computer. Incoming website orders and current private cloud order records appear live after verified store sign-in, without loading or replacing the catalog. New customer references are random numbers from 1000–10000 with a fresh pool each Monday in the store’s Pacific timezone; earlier weeks remain searchable. Order-number views show product photos. Customer contact details stay private. No preparing/ready statuses, payments or stock reservations are implemented.

[LOCAL-EDITOR.md](LOCAL-EDITOR.md) explains the editor. [FIREBASE-SETUP.md](FIREBASE-SETUP.md) covers rules and account setup. No real inventory is fabricated. The storefront and editor ZIP have been uploaded to GitHub using the FurnitureDiscounters account. GitHub Pages deploys `main` automatically. Production Firebase rules and store account setup still require the steps in [FIREBASE-SETUP.md](FIREBASE-SETUP.md).

```sh
npm ci
npm run build
npm run build:editor
npm test
npm run serve
```

Requires Node 22, Java 21 for emulator checks, and Python 3. The standalone editor is built outside the public site at `/workspace/local-editor/furniture-editor.html`. Keep `assets/dist` for GitHub Pages and rebuild after JavaScript/config changes. `bash scripts/prepare-cloud.sh` reproduces dependencies/builds using verified Node and frozen npm dependencies. See [VERIFICATION.md](VERIFICATION.md).

`?catalog=local` is an explicit loopback-only fixture mode; production always reads Firebase. `?emulator=1` is restricted to local/file contexts and targets the demo project. Static catalog export is retained for backups and development.
