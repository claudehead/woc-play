// Inject the asset-base shim into a built index.html so subfolder-hosted builds
// load their root-absolute assets. Version-agnostic runtime rewrite.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2];
if (!file) { console.error('usage: inject-base-shim.mjs <index.html>'); process.exit(1); }
const here = path.dirname(fileURLToPath(import.meta.url));
const shim = fs.readFileSync(path.join(here, 'asset-base-shim.js'), 'utf8');

let html = fs.readFileSync(file, 'utf8');
if (html.includes('Asset-base shim')) { console.log('shim already present'); process.exit(0); }
html = html.replace(/<head[^>]*>/i, (m) => `${m}\n<script>/* Asset-base shim */\n${shim}</script>`);
fs.writeFileSync(file, html);
console.log('injected asset-base shim into', file);
