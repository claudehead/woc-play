/* Asset-base shim: lets a subfolder-hosted build load its root-absolute assets
   (/models, /textures, /audio, /ui, /env, /vfx, /guide-stills, ...).
   Runs before the app bundle. Version-agnostic.

   Two modes, chosen by whether window.__WOC_ASSET_CDN__ is set (injected per build):
     • CDN mode  — heavy source-repo assets are served from jsDelivr straight out of the
                   game's own tag (public/...), so GitHub Pages only hosts the ~few-MB code
                   bundle. Immutable CDN + browser cache => runs from local cache after 1st load.
     • Subfolder — no CDN: rewrite root-absolute paths to the version subfolder on Pages. */
(function () {
  var CDN = (window.__WOC_ASSET_CDN__ || '').replace(/\/*$/, '');   // '' = off; else ends without slash
  if (CDN) CDN += '/';
  var BASE = location.pathname.replace(/[^/]*$/, '');                // e.g. /woc-play/v0.18.0/
  var ORIGIN = location.origin;
  var atRoot = (!BASE || BASE === '/');
  if (atRoot && !CDN) return;                                       // served at domain root, no CDN: nothing to do

  // Raw source-repo dirs (public/<dir>/...) referenced verbatim.
  var SRC = /^(audio|env|guide-stills|models|textures|ui|vfx|fonts|icons)(\/|$)/;
  // Vite-built code output -> always stays on Pages (never the CDN).
  var BUILT = /^(assets)(\/|$)/;

  // The build copies public/* into dist/media/ with content-hashed names
  // (foo/bar.c69858ae1d39.webp). Strip the hash back to the logical public/ path.
  function deHash(rest) { return rest.replace(/\.[0-9a-f]{8,}(\.[^.\/]+)$/, '$1'); }

  // Map a root path ("/media/textures/x.<hash>.png" or "/audio/x.mp3") to its final URL.
  function mapRoot(p) {
    var seg = p.charAt(0) === '/' ? p.slice(1) : p;
    if (seg.slice(0, 6) === 'media/') {                            // hashed build asset -> real public/ file
      var logical = deHash(seg.slice(6));
      if (CDN) return CDN + logical;                               // -> jsDelivr public/<logical>
      if (!atRoot) return BASE + seg;                             // subfolder: the real hashed dist file
      return '/' + seg;
    }
    if (SRC.test(seg)) {                                           // raw public/ passthrough
      if (CDN) return CDN + seg;
      if (!atRoot) return BASE + seg;
      return '/' + seg;
    }
    if (BUILT.test(seg)) return atRoot ? '/' + seg : BASE + seg;   // built code -> always Pages
    return '/' + seg;
  }
  function fixU(u) {
    if (typeof u !== 'string' || !u) return u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') return mapRoot(u);        // root-relative
    if (u.slice(0, ORIGIN.length + 1) === ORIGIN + '/') return mapRoot(u.slice(ORIGIN.length)); // same-origin absolute
    return u;
  }
  // Rewrite whole root-absolute path tokens inside CSS url()/srcset/style strings.
  var pathRe = /\/(?:media|audio|env|guide-stills|models|textures|ui|vfx|fonts|icons|assets)\/[^"')\s,]*/g;
  function fixStr(s) {
    return typeof s === 'string' ? s.replace(pathRe, function (m) { return mapRoot(m); }) : s;
  }

  if (window.fetch) {
    var of = window.fetch;
    window.fetch = function (i, init) {
      try { if (typeof i === 'string') i = fixU(i); else if (i && typeof i.url === 'string') { var nu = fixU(i.url); if (nu !== i.url) i = new Request(nu, i); } } catch (e) {}
      return of.call(this, i, init);
    };
  }

  var xo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { try { arguments[1] = fixU(u); } catch (e) {} return xo.apply(this, arguments); };

  // new Audio('/audio/..') sets src via the constructor, bypassing the src setter
  if (window.Audio) { var OA = window.Audio; window.Audio = function (s) { return arguments.length ? new OA(fixU(s)) : new OA(); }; window.Audio.prototype = OA.prototype; }

  var sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) {
    try {
      if (/^(src|href|xlink:href|data)$/i.test(n)) v = fixU(v);
      else if (/^(srcset|style)$/i.test(n)) v = fixStr(v);
    } catch (e) {}
    return sa.call(this, n, v);
  };

  ['HTMLImageElement', 'HTMLMediaElement', 'HTMLSourceElement'].forEach(function (nm) {
    var C = window[nm]; if (!C) return;
    try {
      var d = Object.getOwnPropertyDescriptor(C.prototype, 'src');
      if (d && d.set) Object.defineProperty(C.prototype, 'src', { configurable: true, get: d.get, set: function (v) { d.set.call(this, fixU(v)); } });
    } catch (e) {}
  });

  ['Element', 'ShadowRoot'].forEach(function (nm) {
    var C = window[nm]; if (!C) return;
    var d = Object.getOwnPropertyDescriptor(C.prototype, 'innerHTML');
    if (!d || !d.set) return;
    Object.defineProperty(C.prototype, 'innerHTML', { configurable: true, get: d.get, set: function (v) { d.set.call(this, fixStr(v)); } });
  });
})();
