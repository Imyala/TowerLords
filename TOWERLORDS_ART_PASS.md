# TOWERLORDS — Art Pass: characters, lords, companions, sanctuary & worlds

Everything that used to be a bare primitive now has a real model, and every floor is a real place. No external
assets — all of it is built from three.js primitives and procedural canvas textures, so the offline build stays
self-contained and packs stay cheap.

The code lives in one block inside `towerlords.html` (search for `ART PASS` / `WORLD PASS`), placed just before
the `ENEMY_FAMILIES` table so it shares the family builders' scope. `towerlords-mobile.html` carries the same
block; `towerlords-offline.html` is rebuilt from desktop by `.claude/build-offline.js` (repo-relative — set
`TL_DIR` to point it elsewhere). `models-preview.html` is a stand-alone showcase
(`?view=heroes|bosses|pets|npcs|goblins|stations|props`, `?view=land&biome=0..5`).

## Look: "a bit more realistic"

* Smooth shading everywhere (flat shading only where a rock should be faceted).
* No toy self-glow: builder materials default to emissive 0.07, and `apRealism()` runs over every spawned
  enemy, goblin and scenery group (smooth + emissive ×0.35, once per material). Things that are meant to glow —
  eyes, magma, hex-fire, runes — keep their intensity (≥0.9 is left alone).
* The enemy loop's baseline emissive dropped from .28 to .08 (elites .35); pets dim to 40% of the old glow.
* ACES filmic tone mapping, and each world sets its own sun colour/intensity and hemisphere light.

## What was replaced

| Was | Now |
|---|---|
| Player: capsule + nose cone | `makeHeroMesh` — armoured climber: crested great-helm, breastplate, pauldrons, mail, greaves, tabard + hooded cloak in the player's colour. Holds the **equipped weapon archetype** (sword+shield, daggers, bow+quiver, staff, wand+tome, hammer, spear+shield); `recompute()` swaps it live. Walk cycle, breathing and cloak flare in `apAnimateHero`. |
| Goblins: one model for every role | `makeGoblinVariantMesh` — the ten roles on the goblin sheet: Scout, Shaman, Spear Guard, Bomber, Archer, Clubber, Poisoner, Trapper, Berserker, Commander, mapped from combat role in `ENEMY_FAMILIES.goblin.map`. |
| Bosses: icosahedron / box / cone | `makeBossMesh` — ten bespoke lords: Warden, Bombard, Summoner, Sweeper, Twin-Fang, Overlord, Void-Lord, Warlock, Reaper, Tower Lord. |
| Pets: rarity-sized polyhedra | `makePetMesh` — sprite, drake, golem, wisp, beast, imp. Walkers stand on the floor, flyers hover; all face where they travel. |
| Summoned spirits | `makeSpiritMesh` — ghost-flame with eyes and a mote trail. |
| Town NPCs / waystation keeper | `makeNpcMesh` — each of the Rescued with clothes and trade props; the waystation is a real campfire. |
| Training dummy | `makeDummyMesh` — straw post, painted target, dented helm. |
| Stations, portals, shrines, altar, lever, vista, hero challenge, POI, chest, cairn, dash decoy | Real props (`makeStationMesh`, `apPortalDress`, `apGlyphShrine`, `apHubrisAltar`, `apLever`, `apVistaMarker`, `apHeroTotem`, `apWaymarker`, `apChest`, `apCairn`, `makeHeroGhostMesh`). |

The skeleton, slime, troll and ghoul/ghost families already matched their sheets; they get the realism pass.

## Worlds (`AP_WORLD`, built by `buildLandscape` from `buildFloorMeshes`, walls by `apDressWalls`)

Tower-of-God rule: each floor is its own world. A world definition carries a sky (fog-free gradient dome with a
sun disc; fog colour = horizon), sunlight and hemisphere colours, a natural ground for rooms and a worn path for
corridors, a boundary style, outer-terrain colours, water/lava/abyss, trees and weather.

| Biome | Ground / path | Boundary (on the collision line) | Beyond the walls |
|---|---|---|---|
| Verdant Vault | grass / dirt | mossy cliff boulders with moss caps and the odd tree | rolling meadow, deciduous forest, ponds, mountains |
| Ember Foundry | cracked basalt with a magma lattice / cinder | hexagonal basalt columns, lava seeps | lava lakes (rippling, glowing), vents, volcanic rock |
| Cryo Archive | snow / ice | tilted glacier blocks with rime drifts | frozen lakes, snow-capped conifers, ice peaks |
| Void Sanctum | void-glass / same | the floor is an island: a 10-unit cliff into nothing, crystal shards on the rim | floating obelisks over a starlit abyss |
| Gilded Halls | garden lawn / marble | marble balustrades with hedges and roses behind | gardens, gilt colonnades |
| Bone Crypt | ash / gravel | catacomb stone with skulls and rusted spikes on top | dead trees, tombstones, bone spires, black water |

Rooms also get small non-colliding life: meadow tufts, flowers, pebbles, snow drifts, ice crystals, bone
scatter, void shards. Weather particles (spores, embers, snow, motes, dust, ash) drift around the player.
The camera sits a touch lower (26 up, 17 back) so more of the world is in frame. The old accent-trim box walls
and the grid overlay are gone; the collision grid, spawns and pathing are untouched.

## Painted ground (`apPaintFloorPlanes`, in the WORLD PASS block)

The walkable ground is painted per floor, not tiled: a 512² colour map with an alpha mask (only walkable cells
show), a roughness map and, for Ember and Void, an emissive map. Layers: the world's base surface, patches of a
second surface (dirt, cinder, packed snow, shattered glass, lawn, gravel), rock outcrops, a soft-edged worn path
down every corridor, and a seeded RIVER that crosses the whole floor — water with sand banks, a lava river, a
frozen river, a stream of void-light, a marble-edged canal, black water — and carves the outer terrain beyond the
walls. A tiled grain overlay (multiply) adds fine detail; a rippling overlay makes the water move. Reeds, river
stones, driftwood, lava crust or ice shards line the banks. None of it collides.

## Creature realism (`apRealism`)

Every hero, boss, enemy, goblin, pet, NPC and station passes through `apRealism`: smooth shading, self-glow
cut to a third (glowing parts ≥0.9 keep it), surface detail chosen from the material — skin (mottled, pored),
cloth (weave), leather, bone (grain + cracks), metal (brushed), wood (grain) — applied as both colour map and bump
map, and the families' low-poly spheres / cylinders / cones / tori resampled to rounder shared geometry.

## Engine contract (unchanged)

* `userData.body` — root node the engine bobs, hit-flashes, telegraph-scales and tints.
* `userData.humanoid` — face the heading; `userData.arms` / `userData.legs` get the walk-swing.
* `userData.anim` — optional self-animating parts (`spin`, `orbit`, `bob`, `flap`, `sway`, `pulse`,
  `breathe`, `flicker`) advanced by `apAnimateParts()`.
* Pets: `userData.ground`, `apFacePet`, `apPetGlow`. Stations keep `children[1]` as the spinning emblem;
  portals keep `children[0]` as the ring.
