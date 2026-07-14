// Landing page for the playable WoC version archive.
// argv[2] = space-separated tags built. argv[3] = wireframe variant tag (optional).
const versions = (process.argv[2] || '').trim().split(/\s+/).filter(Boolean)
  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
const latest = versions[0] || '';
const wfTag = (process.argv[3] || '').trim();
const opts = versions.map((v, i) => `<option value="${v}"${i === 0 ? ' selected' : ''}>${v}${i === 0 ? ' (latest)' : ''}</option>`).join('');
console.log(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>World of ClaudeCraft — play offline</title>
<style>
:root{color-scheme:dark}
body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Georgia,'Times New Roman',serif;
  background:radial-gradient(1000px 700px at 50% -10%,#1b2a1c,#0c130e 60%);color:#eee4cd;text-align:center}
.wrap{max-width:560px;padding:40px 24px}
h1{font-size:clamp(30px,7vw,52px);margin:0 0 6px;letter-spacing:.02em}
.accent{background:linear-gradient(110deg,#e8c86a,#8fc79a);-webkit-background-clip:text;background-clip:text;color:transparent}
p{color:#ab9f83;line-height:1.5;font-family:system-ui,sans-serif}
.row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:26px;align-items:center}
select{padding:11px 14px;border-radius:10px;border:1px solid #6b5f45;background:#14110c;color:#eee4cd;font-size:15px;font-family:system-ui}
.play{padding:12px 26px;border-radius:999px;border:0;cursor:pointer;font-size:16px;font-weight:600;font-family:system-ui;
  background:linear-gradient(180deg,#e8c86a,#caa24a);color:#241a06;text-decoration:none;box-shadow:0 6px 20px rgba(232,200,106,.25)}
.note{margin-top:34px;font-size:12px;color:#786f57;font-family:system-ui}
.note a{color:#caa24a}
</style></head><body><div class="wrap">
<h1>World of <span class="accent">ClaudeCraft</span></h1>
<p>Play any released version <b>offline</b>, right in your browser — single-player, no account, no download.</p>
<div class="row">
  <label style="font-family:system-ui;font-size:14px;color:#ab9f83">Version <select id="v">${opts}</select></label>
  <a class="play" id="play" href="./${latest}/">▶ Play</a>
</div>
${wfTag ? `<div class="row"><a class="play" style="background:#000;color:#eee4cd;border:1px solid #6b5f45;box-shadow:none" href="./wireframe/">◇ Wireframe mode <span style="opacity:.6">(${wfTag})</span></a></div>` : ''}
<p class="note">Fan-hosted offline builds — <b>not affiliated</b> with the developer, and multiplayer is unavailable (that needs the official server). Source &amp; official game: <a href="https://github.com/levy-street/world-of-claudecraft" target="_blank" rel="noopener">levy-street/world-of-claudecraft</a> · MIT © Levy Street. Guide: <a href="https://claudehead.github.io/worldofclaudecraft-quests/" target="_blank" rel="noopener">the field guide</a>.</p>
</div>
<script>const s=document.getElementById('v'),a=document.getElementById('play');s.onchange=()=>a.href='./'+s.value+'/';</script>
</body></html>`);
