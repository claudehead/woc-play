# woc-play — playable offline builds of World of ClaudeCraft

Fan-hosted **offline, single-player** builds of [World of ClaudeCraft](https://github.com/levy-street/world-of-claudecraft),
one per release, with a version picker. **Not affiliated** with the developer; multiplayer is unavailable (that needs the official server).

The game is MIT licensed (© Levy Street). This repo only contains a build/deploy workflow — it clones each release tag, builds the
static client with a relative base, and deploys to GitHub Pages. Run **Actions → Build playable WoC versions** with a space-separated
list of tags (newest first), e.g. `v0.18.0 v0.17.0 v0.16.0 v0.15.0 v0.14.1`.

GitHub Pages caps ~1 GB, so ~5 versions fit; the full archive would need a host without that cap (e.g. Cloudflare Pages).
