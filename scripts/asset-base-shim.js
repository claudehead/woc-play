/* Asset-base shim: lets a subfolder-hosted build load its root-absolute assets
   (/media, /audio, /ui, /models, ...). Runs before the app bundle. Version-agnostic. */
(function () {
  var BASE = location.pathname.replace(/[^/]*$/, '');
  if (!BASE || BASE === '/') return; // served at domain root: absolute paths already fine
  var ORIGIN = location.origin;
  var one = /^\/(media|audio|ui|models|assets|fonts|icons)\//;
  var many = /(["'(=,\s]|^)\/(media|audio|ui|models|assets|fonts|icons)\//g;
  function fixU(u) {
    if (typeof u !== 'string') return u;
    if (one.test(u)) return BASE + u.slice(1);                       // root-relative  /media/...
    if (u.slice(0, ORIGIN.length + 1) === ORIGIN + '/') {            // absolute same-origin  https://host/media/...
      var pth = u.slice(ORIGIN.length);
      if (one.test(pth)) return ORIGIN + BASE + pth.slice(1);
    }
    return u;
  }
  function fixStr(s) { return typeof s === 'string' ? s.replace(many, function (m, p) { return p + BASE + m.slice(p.length + 1); }) : s; }

  if (window.fetch) {
    var of = window.fetch;
    window.fetch = function (i, init) {
      try { if (typeof i === 'string') i = fixU(i); else if (i && typeof i.url === 'string') { var nu = fixU(i.url); if (nu !== i.url) i = new Request(nu, i); } } catch (e) {}
      return of.call(this, i, init);
    };
  }

  var xo = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { try { arguments[1] = fixU(u); } catch (e) {} return xo.apply(this, arguments); };

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
