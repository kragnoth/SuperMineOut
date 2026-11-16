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
| Mouse height / W S | lower the rig on its spring |
| Click / Space | launch core |
| Right-click / E | release clamps (drop) |
| C / J / M / P | CRT+dither / vertex jitter / mute / pause |
| F | Foundry (title & game-over screens) |

## Systems

- **Spring rig**: the rig hangs from a trolley on the bridge by a coil spring. Aim lower with the mouse (or W/S) to let it down, with springy overshoot and a bounce on every core impact. Base reach is 1 cell; the Foundry's *Winch Cable* adds 0.9 per rank (up to 4.6), and the workshop's *Servo Winch* stiffens the spring.
- **Core upgrades** (pods, stack up to 8 per core, inherited by every split): Fission `X`, Strength `S`, Pierce `P`, Blast `B`, Arc `Z`, Prospector `$`. Each Fission pod splits every live core, and Fission cores can bud a child each time they break a block (8% per level), up to 8 cores.
- **Evolutions**: two upgrades at 2+ on the same core fuse, and the evolution is inherited by splits. *Storm* (Blast+Arc: every arc strike detonates), *Drill Lance* (Pierce+Strength: plows through 10 blocks per bounce, +2 damage), *Midas* (Prospector+Fission: any block may turn to gold), *Nova* (Strength+Blast: 60% wider, harder blasts), *Swarm* (Fission+Arc: arc kills can bud new cores).
- **Wyrm bosses**: Rock-Wyrm at 80m, Fungal at 160m, Clockwork at 260m, and **The Eldritch Heart** at 360m. Each one bores through the rock, hunts your cores, churns up rubble, eats power-up pods drifting past (regrowing a plate), and lunges at the rig after a red-eye telegraph (12 hull). Break the armor plates, then the exposed, slower head. Clamps stay locked until it dies. Each kill drops ore and pods and pays 150 scrip at run end. Killing the Heart wins the run (×1.5 scrip): **Surface** to bank everything, or go **Endless**, where wyrms return every 120m, stronger each lap.
- **Spring slam**: if the rig is driving down when a core hits the bumper, it becomes a power shot (+35% speed, +2 damage on the next hit).
- **Instant pods**: Mega Drill `M`, Wide Rig `W`, Magnet Surge `U`, Catch `C` (cores stick to the bumper for 20s; click to release), Hull Patch `+`.
- **Grapple Bumper** (workshop): cores stick where they land on the bumper and leave at that angle when you click. Level 1 auto-releases after 4s; level 2 holds indefinitely.
- **Elevator junction** every 60m: bank cargo (credits, +25 hull) or push on (+0.5× cargo multiplier).
- **Surface Workshop** (in-run, credits, resets each run): 4 random offer cards in the Vampire Survivors level-up style, with reroll (escalating cost), banish, and a fixed repair.
- **Wall panels** (workshop): roam up and down the shaft walls. *Skimmer* panels magnet loose ore into the hold; *Laser* panels fire across their row, cutting through 3–6 blocks. Level 2 adds a panel on the other wall; level 3 boosts pull radius, or fire rate and damage.
- **The Foundry** (permanent, scrip): earned on death from banked credits, unbanked salvage and depth. Rank *n* costs `base × (n+1)` plus a global fee that grows 10% with every rank bought anywhere. Full refund at any time. Secret upgrades (Reroll, Banish, Fission Seed, Twin Core, Emergency Ballast) unlock through achievements.
- **Tarot** (after every lost rig): the shaft deals one of the 22 Major Arcana; 30% of draws come up *reversed*, which flips every effect. Most cards mix boons and banes (The Devil: +60% ore value, +40% hull damage taken). Keep it (hand of 3; replace one when full) or pass it for scrip equal to its value. Every card in the hand is active on every descent, and the hand is saved until **New Game** (Foundry), which wipes all progress.
- **Danger**: missed cores chip the hull (−4) while others are still in play; losing the last core costs −25 and wipes core upgrades. Once a run's score passes 30,000, boulders start falling (red marker on the bridge first) at random spots, more often as score climbs. A boulder that hits the rig costs 12 hull; one that misses smashes the first block below it. Cores never travel perfectly vertically, and a structure that stops changing for 20s at 45%+ cleared releases the clamps anyway (anti-softlock).

Saves go to `localStorage`. When the page runs as a claude.ai artifact, they also sync to the player's private per-user store, so progress follows you between devices.

## Logic-only playthrough tests

`sim/sim.mjs` runs the real game script in Node with Three.js and the DOM stubbed out. A bot player (reaction delay, aim error, loot chasing) plays at a given skill level, about 600× faster than real time.

```
node sim/sim.mjs index.html <runs> <skill 0..1> [bank|push|mixed] [maxMinutes]
META=1 node sim/sim.mjs index.html 60 0.6 bank 30   # chain runs and spend scrip in the Foundry between them
GIVE=laser:3,skimmer:3 node sim/sim.mjs index.html 6 0.6   # force workshop upgrades on at the start of each run
```

Each run prints one JSON line (end reason, depth, time, banked, pods caught, workshop buys, Foundry buys, unlocks), followed by an average. Runs flag `ERROR` on an exception and `STUCK` after 60s without breaking a block.

Older balance snapshot for v0.4 (60 chained runs per skill level):

| Bot skill | First 10 runs | Last 10 runs | Foundry ranks after 60 runs |
|---|---|---|---|
| 0.60 | 216m, 9.2 min | 808m, 19.9 min | 39 / 47 |
| 0.35 | 146m, 8.4 min | 311m, 10.2 min | 23 / 47 |

Session snapshot for v0.9 (50 chained runs, bot skill improving from 0.30 to 0.55, Foundry spending and tarot between runs): runs 1–10 had no wins (median 7 min, 216m); the first win came at run 13; runs 26–50 won 20 of 25 with a median winning run of about 12 min. Evolutions appeared in 76% of runs, and dead time (no block or boss hit for 4+ s) was about 6%.
