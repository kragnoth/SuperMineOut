# SuperMineOut (Abyssal Breaker)

A cave-miner × Super Breakout/Arkanoid mashup in a retro PS2 look (Quake-meets-Minecraft voxels, per-vertex lighting, dithering, CRT).
By **Kragnoth**.

Your boring rig hangs at the top of a lightless shaft and bounces the Wrecking Core *down* into the rock. The core is the only light. Clear the structure under the rig, release the clamps, drop deeper.

## Play

`index.html` is the whole game: one self-contained file that loads Three.js from jsDelivr. Open it in a browser, or serve the repo with GitHub Pages.

```
python3 -m http.server   # then open http://localhost:8000
```

| Input | Action |
|---|---|
| Mouse / A D / ← → | move rig |
| Click / Space | launch core |
| Right-click / E | release clamps (drop) |
| C / J / M / P | CRT+dither / vertex jitter / mute / pause |
| F | Foundry (title & game-over screens) |

## Systems

- **Core upgrades** (pods, stack up to 8 per core, inherited by every split): Fission `X`, Strength `S`, Pierce `P`, Blast `B`, Arc `Z`, Prospector `$`. Each Fission pod splits every live core, and Fission cores keep budding on paddle hits, up to 8 cores.
- **Instant pods**: Mega Drill `M`, Wide Rig `W`, Magnet Surge `U`, Hull Patch `+`.
- **Elevator junction** every 60m: bank cargo (credits, +25 hull) or push on (+0.5× cargo multiplier).
- **Surface Workshop** (in-run, credits, resets each run): 4 random offer cards in the Vampire Survivors level-up style, with reroll (escalating cost), banish, and a fixed repair.
- **Wall panels** (workshop): roam up and down the shaft walls. *Skimmer* panels magnet loose ore into the hold; *Laser* panels fire across their row, cutting through 3–6 blocks. Level 2 adds a panel on the other wall; level 3 boosts pull radius, or fire rate and damage.
- **The Foundry** (permanent, scrip): earned on death from banked credits, unbanked salvage and depth. Rank *n* costs `base × 1.6 × (n+1)` plus a global fee that grows 10% with every rank bought anywhere. Full refund at any time. Secret upgrades (Reroll, Banish, Fission Seed, Twin Core, Emergency Ballast) unlock through achievements.
- **Danger**: missed cores chip the hull (−4) while others are still in play; losing the last core costs −25 and wipes core upgrades; rockfall (telegraphed red marker) starts at 40m and speeds up with depth.

Saves go to `localStorage`. When the page runs as a claude.ai artifact, they also sync to the player's private per-user store, so progress follows you between devices.

## Logic-only playthrough tests

`sim/sim.mjs` runs the real game script in Node with Three.js and the DOM stubbed out. A bot player (reaction delay, aim error, rockfall dodging, loot chasing) plays at a given skill level, about 600× faster than real time.

```
node sim/sim.mjs index.html <runs> <skill 0..1> [bank|push|mixed] [maxMinutes]
META=1 node sim/sim.mjs index.html 60 0.6 bank 30   # chain runs and spend scrip in the Foundry between them
GIVE=laser:3,skimmer:3 node sim/sim.mjs index.html 6 0.6   # force workshop upgrades on at the start of each run
```

Each run prints one JSON line (end reason, depth, time, banked, pods caught, workshop buys, Foundry buys, unlocks), followed by an average. Runs flag `ERROR` on an exception and `STUCK` after 60s without breaking a block.

Balance snapshot for v0.4 (60 chained runs per skill level):

| Bot skill | First 10 runs | Last 10 runs | Foundry ranks after 60 runs |
|---|---|---|---|
| 0.60 | 216m, 9.2 min | 808m, 19.9 min | 39 / 47 |
| 0.35 | 146m, 8.4 min | 311m, 10.2 min | 23 / 47 |
