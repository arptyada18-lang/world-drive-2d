# World Drive 2D

An original, dependency-free, top-down driving game. Drive across a connected 8,400 × 7,000 world, collect cars, complete checkpoint journeys and explore thirty themed districts. All artwork is generated with Canvas. No API keys, accounts, payments, build step or backend are required.

**Status: playable first implementation, not a fully device-certified production release.** See limitations and TESTING.md before publishing.

## Run locally

Extract the ZIP. Open `index.html` in a current desktop browser. For more consistent saving and phone testing, run this optional static server from the project directory:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. A phone on the same Wi-Fi can use `http://YOUR_COMPUTER_LAN_IP:8000` when your firewall permits it. Python serves files only; gameplay runs entirely in the browser. No Node backend is used. Browser storage on `file://` can behave differently; use HTTP for save testing.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Accelerate | W / Up | GO |
| Brake, then reverse | S / Down | BRAKE / REVERSE |
| Steer | A D / Left Right | Arrow buttons |
| Handbrake | Space | DRIFT |
| Horn | H | HORN |
| World map | M | Map |
| Garage | G | Garage |
| Pause | P / Escape | Pause |
| Camera zoom | C | Automatic speed zoom |

Hold steering and a pedal together. Touch controls appear for coarse-pointer devices. Landscape is recommended on phones. Settings adjusts touch-button size. The first-drive guide can be skipped. Losing window focus pauses the game.

## Implemented

- Fixed-step arcade physics, forward/reverse, handbrake, surface resistance, fuel/battery, collision damage and free roadside recovery.
- Thirty named regions: two cities, village, forests, highways, railway and station, beach/coast/sea, river/lake/bridge, farm/desert/mountain/snow, industry, airport, port, residential/market, fuel, garage, showroom, parking, tunnel and dirt.
- Deterministic scenery chunks; only a 3 × 3 neighborhood is retained. Traffic objects are recycled with region-dependent density and simple lane/intersection rules.
- A moving five-car train on a continuous east–west railway corridor, crossing warnings and gates.
- Seventeen original vehicle configurations, buy/select/color controls, stat comparison, repair and refuel.
- Clock, moving sun/moon indicators, darkness, headlights and lit windows; seven weather conditions including local snow.
- Full map, minimap, eight-way compass, digital speedometer and responsive HUD.
- Ten repeatable checkpoint journeys, including one timed sprint. Coin and XP rewards; exploration discoveries and levels.
- Autosave every ten seconds and after transactions/checkpoints. Continue, reset confirmation, saved preferences and corrupt/blocked storage handling.
- Synthesized engine, horn and collision audio plus optional ambient tone. No audio downloads or external assets.
- Low/medium/high graphics settings, capped pixel density, bounded particles and limited active traffic.

Free services: stop near Energy Stop for fuel/battery and Roadside Garage for repairs. The garage menu is available remotely for convenience; before Play/Continue it is a read-only collection preview. Recovery supplies enough health and fuel to keep playing.

## Repository structure

```text
index.html
README.md
TESTING.md
LICENSE
.nojekyll
css/style.css
js/main.js
js/game.js
js/player.js
js/vehicles.js
js/world.js
js/traffic.js
js/weather.js
js/dayNight.js
js/ui.js
js/missions.js
js/saveSystem.js
js/audio.js
js/mobileControls.js
assets/README.md
tests/systems.cjs
```

Scripts load in dependency order using `defer`, sharing the `WD` namespace. This intentionally avoids module fetching so direct file opening remains possible. Each file owns one subsystem. World coordinates use +X east and +Y south; vehicle angle zero faces east. Speed displays at 0.42 km/h per world-unit/second.

## GitHub Pages deployment

1. Create a public repository such as `world-drive-2d`, or use your intended game repository.
2. Upload the **contents** of this folder to branch `main`. `index.html` must be at repository root, not inside an extra `world-drive-2d` folder. Commit the files; do not upload only the ZIP.
3. Open **Settings → Pages**.
4. Under **Build and deployment → Source**, select **Deploy from a branch**.
5. Select **main** and **/(root)**, then **Save**.
6. Wait for the Pages build in **Actions** to finish. Use the published link shown on Settings → Pages.
7. Check start, movement, sound after a tap, mobile controls and save/reload on that published URL.

All code and stylesheet paths are relative. `.nojekyll` disables unnecessary Jekyll processing. No deployment workflow or secrets are required. For the suggested owner and repository name, the expected URL is `https://arptyada18-lang.github.io/world-drive-2d/`; this is **not a claim that it is currently live**.

Official deployment reference: [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Add a car

Add a row to `WD.VEHICLES` in `js/vehicles.js`, preserving this field order:

```js
['tourer', 'Tourer', 'Wagon', 320, 145, 2.8, 135, 85, .7, 500]
// id, name, type, top speed, acceleration, handling,
// durability, fuel capacity, off-road ability, price
```

IDs must be unique and stable for saved collections. Braking defaults to twice acceleration. Adjust the mapped object for independent braking or body dimensions. The garage automatically includes each configuration. Keep original branding and replace the renderer only if desired.

## Change regions

`WD.REGIONS` in `js/world.js` defines a fixed six-column, five-row map. Each entry contains name, base color, terrain type and landmark. Change an existing entry to design a district; `World.chunk`, `World.draw`, `surface` and `water` handle scenery, appearance, grip and water collisions. Coordinates and map colors are shared with UI.

Expanding beyond thirty districts requires updating `COLS`, `ROWS`, `WIDTH`, `HEIGHT`, the bounds in `regionAt`, `safeRoad`, chunk bounds, map scaling and save validation. Preserve numeric IDs used by missions and discoveries. This initial map deliberately has a fixed extent; it is not an infinite-world generator.

## Add a mission

Add a row to `WD.MISSIONS` in `js/missions.js`:

```js
['Coastal courier', 10, 0, 250]
// name, destination region ID, time limit in seconds (0 = none), coins
```

Targets are safe road intersections in each destination region. Completion awards 120 XP in addition to coins. Missions cycle in order; timed missions restart on expiry. Every 300 XP adds a level. There are currently no level-gated regions or car unlock requirements beyond purchase price.

## Saves and settings

LocalStorage keys: `world-drive-2d-v1` and `world-drive-2d-v1-settings`. Saves are per browser and origin, with no cloud synchronization. New Game/Reset replaces progression after confirmation and retains preferences. Invalid saves are ignored. Blocked storage does not prevent playing, but progress cannot persist. World time, traffic positions and current weather reset on loading.

## Known limitations / next improvements

- This is an arcade baseline. Most roads form an orthogonal grid; no true roundabouts, curved mountain switchbacks or separate highway ramps yet.
- Several district types share primitive scenery. Airport and port are scenery; no aircraft, boats, pedestrians or wildlife. Tunnel is a visual covered-road segment, not an underground level.
- Railway is one straight corridor with looping train respawn, not a branching rail network or station timetable. Gates warn and AI waits; the player may ignore them and collide.
- Traffic follows straight lanes and simple signals; it does not navigate turns or form sophisticated queues. Collisions use approximate bounds and may overlap under congestion.
- Missions are destination checkpoints; delivery/passenger names do not imply cargo or passenger simulation. No race opponents or multi-checkpoint mountain course yet.
- Map has no zoom or selectable waypoints. Celestial bodies are HUD indicators, not a perspective sky. Night changes are intentionally simple.
- Synthesized sounds cover only basic driving; dedicated rain/train/city/forest/sea ambience and composed music remain future work.
- No measured mobile FPS guarantee. Android/iPhone/browser rendering and GitHub Pages deployment still require the manual checks in TESTING.md.

## Tests

Optional developer test, using Node (not required to play):

```sh
node tests/systems.cjs
```

The test exercises real gameplay code with controlled inputs. It does not substitute for browser visual testing, multi-touch testing or a physical-device performance pass.

## License

MIT. All included graphics are programmatically generated. No commercial game assets or real vehicle branding are included.
