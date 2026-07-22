#!/usr/bin/env bash
# Run this from the TowerLords folder: bash COMMIT_NOW.sh
# (The Cowork sandbox cannot write inside .git on the mounted drive — this finishes the job locally.)
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock
git add -A
git commit -m "Story bible + full tree vision: 7 spec columns, 56 build-defining keystones, lord organs, living tree, biome identity, audio & co-op systems

- Story: bible, summit revelation ladder, Kept Ones rescues, memoirs, waystations, whispers, NG+ beats, endings (Chair/True Summit)
- Tree: Elementalist + Beast columns, rule-breakers (Glass Soul, Borrowed Time, Inverted Fate...), 5 blink evolutions, body mutations (2-of-5 evolve cap), personality perks, epics (The Unwritten / The Many / Living Dungeon)
- Engines: minions, transforms, damage ledger, position rewind (Deja Vu), auto-targeting, lord-organ trophies, run mutations
- World: per-biome props/walls/hazards (lava burns HP, water saps MP), solid prop collision
- Audio: 4 new procedural tracks, skill/element/story SFX
- Fixes: elite multiplier bug, TDZ black-screen, keystone visibility, fullscreen skill tree"
echo ""
echo "✓ Committed. Push with: git push"
