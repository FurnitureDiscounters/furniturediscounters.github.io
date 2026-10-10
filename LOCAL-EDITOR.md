# Local catalog editor

1. Download [furniture-editor.zip](https://furniturediscounters.github.io/downloads/furniture-editor.zip), extract it, and open `furniture-editor.html` in your browser.
2. Choose or add a category, add subcategories, then add products and upload photographs.
3. Use **Save database** to save a portable JSON file. Use **Backup with photos** for a complete backup.
4. Connect your verified store account and click **Publish to Firebase** to upload products/photos/orders. Use **Load from Firebase** on another computer. Export website remains available as a static catalog backup.

The HTML contains its scripts, styles, fonts and logo. Local editing requires no authentication. Firebase load/publish uses your protected store login. On first use it automatically creates its database in browser IndexedDB, and editing saves there. A browser cannot silently create a file beside the HTML: Save database asks where to save it. Browsers supporting the File System Access API can keep that selected file updated; others download a new JSON copy. If preview storage is blocked, a persistent warning appears: edits exist only in memory and refreshing loses them. Download Backup with photos before refreshing and reopen that ZIP afterward. The preview is separate from your downloaded editor, so their browser databases are not shared. Embedded previews use a regular file upload for Open database and a JSON download for Save database because browsers block native file-system pickers inside cross-origin frames. Keep ZIP backups, because clearing browser storage removes the local database and photographs. JSON alone does not contain photograph bytes. Open database accepts JSON or a backup ZIP.

Categories have editable colors and desktop column counts; narrower screens adapt automatically. Subcategories belong to a category. Products include photographs, price, previous price, dimensions, material, finish and stock. Changing an existing price automatically keeps the previous price for crossed-out display; you can also edit or clear it.

Orders can be entered/imported locally with private contact details. The order section can also look up a customer's full online order number, then save a local copy. Online lookup and cloud load/publish require internet and the published Firestore rules. It shows items and the number, without preparing/ready statuses. Private local order/contact records are excluded from website exports and retained in private backups. Publish to Firebase also stores them in owner-only cloud records. Keep backups private.

Uploaded images are resized and converted to WebP, stored locally and included in exports. Existing website image paths require the original photo files or an internet connection for previews. With about 2,000 products, use optimized photos and monitor browser disk space and GitHub Pages size limits; aim for roughly 100–200 KB per photo where practical.

This cloud browser blocks direct file navigation by managed policy. The same standalone HTML is tested over local HTTP. For development only:

```sh
npm run build:editor
python3 -m http.server 4175 --bind 127.0.0.1 --directory /workspace/local-editor
```

Direct opening on your computer remains unverified here and browser storage/file APIs vary. If it fails, serve the folder locally using Python as above. This editor is a local tool, so keep it outside the public website.
