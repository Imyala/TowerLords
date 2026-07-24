# Towerlords — Work Summary

_Boss cinematics, dialogue, cinematic music, and the mobile build. All changes applied to `towerlords.html`, `towerlords-offline.html`, and now `towerlords-mobile.html`, each syntax-checked and runtime-tested._

## Boss cinematics — the guardian speaks

Every boss floor now opens and closes with a real cutscene. Before the fight, the guardian **talks directly to the player** across five beats: it recognises you and how far you've climbed, names you the Unwritten, tells you the world and age it came from, explains why it became a guardian (by its own choice or bound against its will), reveals its true relationship with the Tower, states its feeling about the summit, and finally why it must stop you — ending on a farewell. When defeated, a short, heart-wrenching scene plays: the guardian's dying words, then it comes apart into light and rises as a **lantern** drifting toward a sky it will never reach.

This fires on **every guardian floor** — the mini-bosses on floors 5, 15, 25… as well as the main lords on 10, 20, 30… — and the final Tower Lord still leads into the victory/lanterns finale. In co-op, splitscreen, online, and roaming-ambush encounters it stays a spoken subtitle so it never freezes other players.

## Dialogue — effectively endless, never repeating

The monologue is **not scripted**. It's assembled fresh each time from modular fragment pools that mix and match, then filled with this run's details (the guardian's own name for you, the randomly-generated species the Tower is wearing, its rolled epithet and trait, and your grudge history). Measured combination space is roughly **3.5 billion distinct monologues per guardian**; a test of 2,000 fresh generations produced 2,000 unique results, and 30 consecutive fights of the same boss gave 30 distinct speeches. An anti-repeat memory that persists across sessions guarantees the same wording almost never comes back.

Each of the ten guardians has a genuinely different personality and a distinct bond with the Tower: the Warden numbly bound by duty, the Overlord who **loves** the Tower for flattering his dead crown, the Void-Lord who **fears** it (and dreads the summit), the Summoner who **hates** it for holding her children hostage, the Reaper who **regrets** the duty he chose, the Warlock who merely finds it useful, and the Tower Lord who *is* it. Defeat lines pay off each arc and are likewise always different.

## Music — cinematic scores for the cutscenes

**Intro score** — somber and angry but deliberately quiet and beatless: a low drone, a slow smouldering dissonant growl that swells and recedes, and a dark motif. No heartbeat, no drums. There are **12 variants** (different keys, motifs, and dissonances) chosen at random per guardian, anti-repeated so you rarely hear the same one twice.

**Defeat score** — slow, calm, sad, and rainy: steady soft rainfall, occasional distant thunder, a warm faraway string pad, and a descending felt-piano lament. **10 variants** (different sad chords, laments, rain character, thunder) chosen at random, anti-repeated.

**Grief / sad music** (played on death and sometimes in the sanctuary) was reworked to feel **sore, slow, and painful** rather than deep or booming: almost no low-end, a sparse aching piano, and an exposed high solo violin that "sighs" — leaning a step above a note and falling into it — swelling gently over several loops. Extreme-sad is slower and sparser still, with lonely handpan tolls.

## Cutscene flow — works perfectly before and after the fight

Audited and fixed the end-to-end boss-floor flow. The world simulation now **freezes** for the duration of the cutscene (solo-only, so co-op is unaffected), so the guardian holds still while it speaks instead of firing a bullet-wall behind the screen; the field is **cleared of stray projectiles** both when the intro begins and when the guardian dies, so neither the fight nor the reward screen inherits leftover bullets. The player is invulnerable during the scene, input is isolated to the cutscene's own controls, and everything restores exactly as it was on finish. Music hands off cleanly: battle track ducks to silence under the intro score then returns for the fight; the rain plays under the defeat then fades into the grief music for the reward draft. Skip/Esc runs the same clean teardown, and leaving the room before it fires safely skips it.

## Mobile build — brought fully up to date

`towerlords-mobile.html` had fallen far behind (it predated the entire music engine and cutscene system). It's now **rebuilt from the current desktop build**, so it has every feature above, with its mobile-specific control layer ported back on: the whole-screen joystick, the floating **Use** and **Dash** thumb buttons (the Use button is the touch way to ascend the portal, open the vendor/stash, grab loot, and so on — it shows the right contextual label automatically), and the phone-fit HUD adjustments. Verified that the Use button correctly reads "Ascend" at an active portal, hides when there's nothing to use, and that the boss cutscenes, pause-freeze, and scores all carry over.

## Verification

Every change was applied to all three builds and checked with `node --check` on the extracted script. Beyond syntax: the dialogue system was tested for combination count and no-repeat behaviour; all 22 music variants were run through a mocked audio engine (start → cue → stop) without errors; the cutscene lifecycle was driven through a DOM stub to confirm the sim pauses during and restores after, the completion callback fires, and the field clears; and the mobile Use button logic was runtime-tested.
