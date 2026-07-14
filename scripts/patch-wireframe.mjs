// Force the entire 3D world to render as a white wireframe on black.
// Patches src/render/renderer.ts in a cloned World-of-ClaudeCraft source tree
// before it is built, so the produced client is "the real game, in wireframe".
//
// The HUD is DOM/2D (not in the WebGL scene), so scene.overrideMaterial only
// touches the 3D world. We deliberately KEEP the post/composer pipeline: on
// high graphics tiers the game presents to the canvas through the composer
// (this.post.render()); bypassing it renders to a target that is never shown,
// which black-screens the world while the DOM HUD still appears. overrideMaterial
// flows fine through the composer's RenderPass, so the wireframe still shows
// (bloom just gives the lines a soft glow).
//
// usage: node scripts/patch-wireframe.mjs <path-to-src-tree>
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.';
const file = path.join(root, 'src/render/renderer.ts');
let s = fs.readFileSync(file, 'utf8');

if (s.includes('WIREFRAME BUILD')) { console.log('wireframe patch already present'); process.exit(0); }

const BLOCK = `\n    // --- WIREFRAME BUILD: the whole world as a white wireframe on black ---\n` +
  `    this.scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, fog: false });\n` +
  `    this.scene.background = new THREE.Color(0x000000);\n` +
  `    this.scene.fog = null;\n` +
  `    if (this.sky) this.sky.visible = false;\n`;

const anchor = 'this.scene.add(this.sky);';
const fallback = 'this.scene = new THREE.Scene();';
if (s.includes(anchor)) s = s.replace(anchor, anchor + BLOCK);
else if (s.includes(fallback)) s = s.replace(fallback, fallback + BLOCK);
else { console.error('FATAL: no anchor found in renderer.ts — aborting patch'); process.exit(1); }

fs.writeFileSync(file, s);
console.log('wireframe patch applied: overrideMaterial injected (composer pipeline kept intact)');
