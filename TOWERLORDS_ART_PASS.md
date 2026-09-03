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

## Real ground (`apBuildGround`, in the WORLD PASS block)

The walkable ground is a relief mesh, not a picture: a 0.8-unit heightfield over the floor with soft undulation
(never above the feet line), RIVERBEDS carved down to 0.75 units, sand / wet-earth banks, dirt patches, rock
outcrops, worn paths down the corridors, and an edge that falls away at the walls. One liquid surface at about
-0.22 fills every dip — inside the walls and beyond them — so a river carved through a room continues under the
wall and out across the terrain. Per world it is water (rippling, translucent, with a foam line), lava (emissive,
lit), a frozen river (opaque ice), void-light, a canal, or black water.

Rivers are rolled per floor (`apRollRiver`): none, one meander, two streams, a lake with an outflow, or a wide
slow river, at a random heading, width and wobble. Daily climbs share the roll; every other floor rolls its own.
Reeds, river stones, driftwood, lava crust and ice shards line the banks.

The ground is part of play. `apTerrainAt(x,z)` gives water / lava depth at a point: wading slows the hero to
60% and drains a little mana (the existing water rule) and slows enemies to 62%; lava burns the hero (the existing
lava rule) and ticks enemies for 3% of their health every 0.6 s; heroes and enemies sink into the liquid and ripple
as they wade. The floor slabs sit at -1.4 under the relief mesh.

## Creature kit (`crRig`, in the CREATURE KIT block)

The five sheet families are rebuilt with anatomy: torsos and skulls turned on a lathe from a silhouette profile,
brows, jaws, noses, ears, individual teeth and tusks, hands with fingers and claws, feet with toes, cloth in ragged
layers with patches, straps, belts and wraps. Each role on a sheet has its own build — the goblin scout is wiry,
the clubber a wall of muscle, the shaman stooped under bone and feathers; skeletons are real ribcages on a spine
with a hinged jaw; trolls are barrel-bodied and hunched with tusks and spine spikes; ghouls carry sores and exposed
ribs, ghosts are drifting shrouds; slimes are clear-coated domes with a core, bubbles and whatever they swallowed.
The old builders remain as `*Legacy` functions. Every creature still passes through `apRealism` for surface detail.

## Creature kit II

Ratmen, orcs, sahuagin, kuo-toa and tengu are rebuilt on the same kit from their sheets (CREATURE KIT II block):
rat snouts with whiskers and pink ears and tails; orc under-bites with tusks and topknots; sea-devil crests, gill
slits and dorsal fins; kuo-toa great staring eyes; tengu beaks, crests, feathered wings and kimono. Every role on
each sheet has its own kit — slings, harpoons on chains, eye-staffs, katanas, naginata, kanabō, war fans, whips,
banners, spiral and shell shields, straw hats, ninja shuriken and smoke, windmaster rings.

## Engine contract (unchanged)

* `userData.body` — root node the engine bobs, hit-flashes, telegraph-scales and tints.
* `userData.humanoid` — face the heading; `userData.arms` / `userData.legs` get the walk-swing.
* `userData.anim` — optional self-animating parts (`spin`, `orbit`, `bob`, `flap`, `sway`, `pulse`,
  `breathe`, `flicker`) advanced by `apAnimateParts()`.
* Pets: `userData.ground`, `apFacePet`, `apPetGlow`. Stations keep `children[1]` as the spinning emblem;
  portals keep `children[0]` as the ring.
