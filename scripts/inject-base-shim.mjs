// Inject a runtime asset-base shim into a built index.html so the game works when
// served from a SUBFOLDER (e.g. /woc-play/v0.18.0/) even though it hardcodes
// root-absolute asset paths (/media, /audio, /ui, /models). Version-agnostic:
// it derives the base from location at runtime and rewrites every asset request.
import fs from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('usage: inject-base-shim.mjs <index.html>'); process.exit(1); }

const SHIM = `<script>(function(){
  var BASE = location.pathname.replace(/[^/]*$/, '');
  if (BASE === '/' || BASE === '') return; // served at root: absolute paths already work
  var RE = /^\/(media|audio|ui|models|assets|fonts|icons)\//;
  var fix = function(u){ return (typeof u === 'string' && RE.test(u)) ? BASE + u.slice(1) : u; };
  if (window.fetch) { var of = window.fetch; window.fetch = function(i, init){ try { if (typeof i === 'string') i = fix(i); else if (i && i.url && RE.test(i.url)) i = new Request(fix(i.url), i); } catch(e){} return of.call(this, i, init); }; }
  var xo = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function(m, u){ try { arguments[1] = fix(u); } catch(e){} return xo.apply(this, arguments); };
  ['HTMLImageElement','HTMLMediaElement','HTMLSourceElement'].forEach(function(n){ var C = window[n]; if(!C) return; var d = Object.getOwnPropertyDescriptor(C.prototype, 'src'); if(!d || !d.set) return; Object.defineProperty(C.prototype, 'src', { configurable:true, get: d.get, set: function(v){ d.set.call(this, fix(v)); } }); });
}());</script>`;

let html = fs.readFileSync(file, 'utf8');
if (html.includes('asset-base shim') || html.includes('location.pathname.replace')) { console.log('shim already present'); process.exit(0); }
// insert as the very first thing in <head> so it runs before the app bundle
html = html.replace(/<head[^>]*>/i, (m) => m + '\n<!-- asset-base shim -->' + SHIM);
fs.writeFileSync(file, html);
console.log('injected asset-base shim into', file);
