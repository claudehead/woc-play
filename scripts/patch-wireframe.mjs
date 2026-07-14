// Render the real WoC client as a wireframe.
// Patches src/render/renderer.ts in a cloned World-of-ClaudeCraft source tree
// before build, so the produced client draws the whole 3D world as wireframe.
//
// APPROACH: we do NOT use scene.overrideMaterial. The terrain/foliage/water
// materials carry custom vertex shaders (onBeforeCompile) and custom geometry
// attributes; replacing them with one basic material discards that vertex logic
// and errors/collapses the frame -> total black world (with the DOM HUD still
// showing). Instead we keep every material exactly as-is and only flip its
// `.wireframe` draw flag — a renderer-level line-draw mode that runs *with* the
// real shaders, so geometry stays correct. A per-frame scene walk (guarded by a
// WeakSet so each material is touched once) catches meshes streamed/spawned in
// later. The HUD is DOM/2D, untouched.
//
// usage: node scripts/patch-wireframe.mjs <path-to-src-tree>
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.';
const file = path.join(root, 'src/render/renderer.ts');
let s = fs.readFileSync(file, 'utf8');

if (s.includes('WIREFRAME BUILD')) { console.log('wireframe patch already present'); process.exit(0); }

const BLOCK = `\n    // --- WIREFRAME BUILD: draw the real world as wireframe (keep materials) ---\n` +
  `    this.scene.background = new THREE.Color(0x000000);\n` +
  `    this.scene.fog = null;\n` +
  `    if (this.sky) this.sky.visible = false;\n` +
  `    this.__wfSeen = new WeakSet();\n` +
  `    this.__wfN = 0;\n` +
  `    this.__wfApply = () => {\n` +
  `      if ((this.__wfN++ & 7) !== 0) return; // walk the graph every 8th render, not every frame\n` +
  `      this.scene.traverse((o) => {\n` +
  `        const m = (o).material;\n` +
  `        if (!m) return;\n` +
  `        const arr = Array.isArray(m) ? m : [m];\n` +
  `        for (const mm of arr) {\n` +
  `          if (mm && !this.__wfSeen.has(mm)) { this.__wfSeen.add(mm); mm.wireframe = true; }\n` +
  `        }\n` +
  `      });\n` +
  `    };\n`;

const anchor = 'this.scene.add(this.sky);';
const fallback = 'this.scene = new THREE.Scene();';
if (s.includes(anchor)) s = s.replace(anchor, anchor + BLOCK);
else if (s.includes(fallback)) s = s.replace(fallback, fallback + BLOCK);
else { console.error('FATAL: no anchor found in renderer.ts — aborting patch'); process.exit(1); }

// Run the wireframe pass right before every present (all 3 render sites share
// this exact line). Doesn't depend on THREE calling scene.onBeforeRender.
const RSITE = 'if (this.post) this.post.render();';
const nsites = (s.match(/if \(this\.post\) this\.post\.render\(\);/g) || []).length;
s = s.split(RSITE).join('this.__wfApply?.(); ' + RSITE);

fs.writeFileSync(file, s);
console.log(`wireframe patch applied: .wireframe flip hooked before ${nsites} render site(s), materials preserved`);
if (nsites === 0) console.warn('  WARNING: no render sites matched — wireframe pass will not run!');
