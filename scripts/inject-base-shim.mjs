// Inject the asset-base shim into a built index.html so subfolder-hosted builds
// load their root-absolute assets. Version-agnostic runtime rewrite.
//
// usage: inject-base-shim.mjs <index.html> [tag]
//   tag (e.g. v0.18.0) -> heavy source-repo assets are served from jsDelivr out of
//   that tag's public/ dir, so GitHub Pages only hosts the code bundle.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2];
const tag = process.argv[3] || '';
if (!file) { console.error('usage: inject-base-shim.mjs <index.html> [tag]'); process.exit(1); }
const here = path.dirname(fileURLToPath(import.meta.url));
const shim = fs.readFileSync(path.join(here, 'asset-base-shim.js'), 'utf8');

const cdn = tag
  ? `https://cdn.jsdelivr.net/gh/levy-street/world-of-claudecraft@${tag}/public`
  : '';
const cfg = cdn ? `<script>window.__WOC_ASSET_CDN__=${JSON.stringify(cdn)};</script>\n` : '';

let html = fs.readFileSync(file, 'utf8');
if (html.includes('Asset-base shim')) { console.log('shim already present'); process.exit(0); }
html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${cfg}<script>/* Asset-base shim */\n${shim}</script>`);
fs.writeFileSync(file, html);
console.log('injected asset-base shim into', file, cdn ? `(CDN: ${cdn})` : '(subfolder mode)');
