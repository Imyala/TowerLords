# TOWERLORDS — Art Pass: characters, lords, companions, sanctuary & landscape

Everything that used to be a bare primitive now has a real model, and every floor sits inside a real
landscape. No external assets — all of it is built from flat-shaded three.js primitives and procedural
canvas textures, so the offline build stays self-contained and packs stay cheap.

The code lives in one block inside `towerlords.html` (search for `ART PASS`), placed just before the
`ENEMY_FAMILIES` table so it shares the family builders' scope. `towerlords-mobile.html` carries the
same block; `towerlords-offline.html` is rebuilt from desktop by `.claude/build-offline.js` (now
repo-relative — set `TL_DIR` to point it elsewhere). `models-preview.html` is a stand-alone showcase of
every builder plus a landscape sample (`?view=heroes|bosses|pets|npcs|stations|props`,
`?view=land&biome=0..5`).

## What was replaced

| Was | Now |
|---|---|
| Player: capsule + nose cone | `makeHeroMesh` — armoured climber: crested great-helm with a glowing visor, breastplate, pauldrons, mail, greaves, tabard + hooded cloak in the player's colour, pouch and potion on the belt. Holds the **equipped weapon archetype** (sword+shield, twin daggers, bow+quiver, staff, wand+tome, hammer, spear+shield); `recompute()` swaps it live. Walk cycle, idle breathing and cloak flare run render-side in `apAnimateHero`. |
| Bosses: icosahedron / box / cone | `makeBossMesh` — ten bespoke lords: Warden (gate-knight, portcullis shield, chained mace), Bombard (siege-golem, shoulder cannons, mortar back), Summoner (lich, soul-cage staff, three orbiting skulls), Sweeper (sanitation construct, great lens, spinning brush-blades, treads), Twin-Fang (two-headed serpent-lizard), Overlord (white-gold titan, halo, twin greatswords), Void-Lord (legless hooded silhouette, three orbiting rings, eye cluster), Warlock (five-eyed scholar, orbiting tomes and orbs), Reaper (skeletal wraith, bone wings, scythe), Tower Lord (gold colossus wearing the tower as a crown, orbiting crown fragments). |
| Pets: rarity-sized polyhedra | `makePetMesh` — sprite (winged fairy), drake (small dragon), golem (rune-lit stone construct), wisp (hooded skull with a lantern), beast (wolf), imp (horned, with a fork). Walkers stand on the floor, flyers hover; all face where they travel instead of spinning. Rarity brightens the glow materials. |
| Summoned spirits: icosahedron | `makeSpiritMesh` — ghost-flame with eyes and an orbiting mote trail. |
| Town NPCs / waystation keeper: cylinder + sphere | `makeNpcMesh` — each of the Rescued has a face, clothes and props: Wren (kid, scarf, sling), Haldane (portly, wide hat, purse), Sera-Voss (cartographer, map and tube), Brother Cog (hood, egg basket), Mottle (cap, spectacles, ledger), Granny Thorn (shawl, cane, flask basket), Lumen (lantern and book), Echo (translucent, drifting motes). They turn to greet you and idle with breathing / arm drift. The waystation is a proper campfire with the keeper beside it. |
| Training dummy: box | `makeDummyMesh` — straw post with a painted target, crossbar gloves and a dented helm. |
| Stations: cylinder + polyhedron | `makeStationMesh` — stash (iron-bound vault), vendor (market stall with striped awning, jars, scales, sacks), crafting (forge with glowing coals, anvil, hammer), pet yard (garden gate with vines and lamps), score obelisk (rune-carved monolith), yard terminal. `children[1]` is still the floating emblem the engine spins. |
| Portals: ring + beam | ring + beam kept (the engine animates `children[0]`), wrapped in a carved stone archway with rune pillars and a keystone. |
| Shrines, altar, lever, vista, hero challenge, POI, chest, cairn | Real props: glyph altar with floating glyph stones, blood altar with skull and candles, iron lever with a turning gear, stone watch-marker with a lens, carved totem, cairn waymarker with a flag, iron-banded strongbox (lid still hinges open), dark cairn with a fallen sword. |
| Dash decoys: capsule | Ghost afterimage of the hero (shares one material so the fade loop still works). |

## Landscape (`buildLandscape`, called from `buildFloorMeshes`)

* **Ground & walls** — procedural 256² canvas textures per biome, tiled in world units: mossy flagstones,
  cracked basalt with an emissive magma lattice, blue ice with frost bloom, black-violet marble veined
  with un-light, cream marble with gold inlay, ash packed with bone. Walls get a brick texture in the
  same stone. The old grid overlay is gone.
* **Outer terrain** — a displaced, vertex-coloured low-poly plane that hugs the walkable grid (distance
  transform over `G.grid`) and rolls away into the fog. It never overlaps a walkable cell, so collision,
  pathing and spawns are untouched.
* **Biome dressing** (instanced): forests + ponds (Vault), vents, lava lakes and rock (Foundry), crystal
  spires and frozen lakes (Archive), floating obelisks over a starlit abyss (Sanctum), gilt columns,
  gardens and braziers (Halls), bone spires, rib arches and grave mounds (Crypt). Every biome gets
  boulders and a ring of tall silhouettes standing in the fog.
* **Particles** — a drifting field that follows the player: spores, embers, snow, void motes, gold dust,
  ash (soft sprite, additive).
* **Sanctuary dressing** — lantern posts, banners, a fountain, planters, crates and rugs before the
  stations (`buildSanctuaryDressing`).
* Renderer now uses ACES filmic tone mapping (exposure 1.12) so bright emissives roll off instead of
  clipping.

## Engine contract (unchanged, so the loops didn't have to change)

* `userData.body` — the root node the engine bobs, hit-flashes, telegraph-scales and tints.
* `userData.humanoid` — face the heading instead of spinning; `userData.arms` / `userData.legs` get the
  walk-swing.
* `userData.anim` — optional list of self-animating parts (`spin`, `orbit`, `bob`, `flap`, `sway`,
  `pulse`, `breathe`, `flicker`) advanced by `apAnimateParts()`; the enemy, pet, minion and scenery
  loops call it.
* Pets: `userData.ground` keeps walkers on the floor; `apFacePet` turns them; `apPetGlow` dims / brightens
  every glow material when a pet goes down / gets up.
* Stations keep `children[1]` as the spinning emblem; portals keep `children[0]` as the ring.
