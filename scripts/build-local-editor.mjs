import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const output = resolve(process.argv[2] || '../local-editor/furniture-editor.html');
const collectionPhotos=Object.fromEntries(await Promise.all(['sofa','bed','dining','desk','mattress','armchair'].map(async name=>[`assets/images/${name}.webp`,`data:image/webp;base64,${(await readFile(`assets/images/${name}.webp`)).toString('base64')}`])));
const result = await build({ entryPoints: ['assets/js/local-editor.js'], bundle: true, format: 'iife', write: false, target: ['es2022'], minify: true, define:{__COLLECTION_PHOTOS__:JSON.stringify(collectionPhotos),__FIRESTORE_RULES__:JSON.stringify(await readFile('firestore.rules','utf8'))}, legalComments: 'inline' });
let css = await readFile('assets/css/styles.css', 'utf8');
for (const name of ['dm-sans', 'cormorant']) {
  const font = await readFile(`assets/fonts/${name}.woff2`);
  css = css.replace(`../fonts/${name}.woff2`, `data:font/woff2;base64,${font.toString('base64')}`);
}
const logo = `data:image/svg+xml;base64,${(await readFile('assets/favicon.svg')).toString('base64')}`;
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
let html = await readFile('scripts/local-editor.template', 'utf8');
html = html.replaceAll('__LOGO__', logo).replace('__CSS__', () => css).replace('__JS__', () => js);
const licenses = await Promise.all(['DM-Sans-OFL.txt', 'Cormorant-OFL.txt'].map(name => readFile(`assets/fonts/${name}`, 'utf8')));
html += '\n<!-- Embedded font licenses:\n' + licenses.join('\n\n').replaceAll('-->', '-- >') + '\n-->\n';
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Standalone local catalog created: ${output}`);
