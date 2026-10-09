# Frontend verification

Verified on October 8, 2026 (America/Los_Angeles), using Microsoft Edge through Playwright against a local HTTP server.

## Completed checks

- All 12 sample products load, with local photography and category labels.
- Search, category filters, ascending and descending price sort, URL filter state, empty results, and reset controls work.
- Product details open, Escape closes the dialog, and focus returns to the triggering control.
- Add-to-order notifications and navigation quantity badges update.
- Cart quantities, removal, estimated totals, invalid-input feedback, and refresh persistence work.
- Demo order creation returns a correctly formatted number; clipboard copy and saved lookup work.
- Lookup normalizes lowercase input. A built-in demonstration number and missing-number feedback work.
- Saved orders remain in the original browser storage and are absent in an isolated browser context.
- Corrupted cart data can be reset without deleting saved orders.
- Blocked localStorage produces an error rather than a false success message.
- Home, Store, About, and My Order were checked at widths of 1440, 768, 390, and 320 pixels. No horizontal overflow or failed images were found.
- The mobile menu opens, follows navigation links, and resets its expanded state after navigation.
- The browser check completed without JavaScript page errors or failed HTTP requests.
- 148 local HTML links, asset references, and JavaScript imports resolve to existing files.
- All JavaScript files pass the Node syntax check.

Screenshots were visually reviewed for the desktop homepage/catalog and the mobile homepage. Images total approximately 925 KB; the two self-hosted variable fonts total approximately 75 KB. No third-party requests are required at runtime.

## Practical limits

This is a static browser demonstration. There is no payment processor, fulfillment system, live inventory, cross-device order database, or administrator login. Safari and Firefox were not run in this environment. Automated checks supplement, rather than replace, future assistive-technology and real-device testing before a production retail launch.
