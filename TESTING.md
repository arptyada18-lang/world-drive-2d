# Verification and release checklist

## Checks actually executed

- All thirteen JavaScript files pass Node syntax checks.
- `node tests/systems.cjs`: twelve automated system checks pass: vehicle config, acceleration/steering/reverse/handbrake, depleted fuel/health, damage and terrain, thirty regions/chunk eviction, water recovery, traffic and train, sun/moon clock, weather, mission rewards, save validation/preferences and blocked storage.
- Native Canvas integration smoke check with a lightweight DOM substitute: game bootstrap, 180 update/render frames, all thirty region renders, garage/settings opening, save and continue completed without exceptions. A native-rendered scene was visually inspected. This is not a browser screenshot or real DOM/layout verification.
- Referenced script and stylesheet files exist and use relative paths. Static HTTP responses and a repository-subpath URL were checked locally.

Browser preview access to the local server was blocked (`ERR_BLOCKED_BY_CLIENT`). Therefore **real browser console, actual pointer interaction, CSS layout, audio output, mobile performance and deployed Pages behavior are not certified**. No public game repository was available during this build; deployment remains pending.

## Manual release gate

Run on desktop Chrome/Firefox/Safari as available, Android Chrome and iPhone Safari. Test at 1920×1080, 1366×768, tablet, 390×844 portrait and phone landscape. Record device, browser, result and any issue; do not check boxes based only on the unit tests.

- [ ] Loading overlay disappears; animated start screen and Play work.
- [ ] Tutorial shows once; Skip/Close returns to driving.
- [ ] Accelerate, steer, brake/reverse, handbrake and horn work.
- [ ] Two simultaneous touch contacts steer and accelerate; releasing/cancelling either does not leave it stuck.
- [ ] Canvas fits viewport, including safe areas; page does not scroll during driving.
- [ ] Camera follows without jitter; zoom switches with C.
- [ ] City, village, both forests, beach/sea, snow and all remaining districts load during travel.
- [ ] Water recovery returns to a drivable road.
- [ ] Traffic stays near roads, respects density settings and responds to signals.
- [ ] Train moves; crossing warning/gate appears before arrival; train collision recovers player.
- [ ] Compass matches all eight headings.
- [ ] Sun, moon, night lights and clock cycle appear.
- [ ] Weather cycles; snow appears in snow district; weather toggle works.
- [ ] Garage purchases subtract coins once; selection and color persist after reload.
- [ ] Fuel/health change with driving/collisions; repair/refuel charge correctly.
- [ ] Free recovery and free station service prevent a stranded save.
- [ ] Mission completion awards coins/XP; sprint timer expires and restarts.
- [ ] Discoveries reward XP once; levels increase.
- [ ] Reload/Continue restores car, position, coins, XP, ownership, mission state and discoveries.
- [ ] Preferences set on title screen and in-game persist after reload.
- [ ] Pause/map/garage/settings freeze physics; backgrounding clears input and pauses.
- [ ] New Game/Reset requires confirmation; cancelling preserves progress.
- [ ] Audio starts only after interaction; denied audio or storage does not crash gameplay.
- [ ] No major console errors, failed local assets or external runtime dependencies.
- [ ] Low graphics and reduced traffic remain responsive on a mid-range phone.
- [ ] GitHub Pages build succeeds with main/root and assets load under the repository URL.

## Scope of the first build

This implements simplified systems across the five requested phases. Automated checks were run after integration and fixes; this is not a claim that each phase received a full physical-device QA pass. Advanced road geometry, branching rails, detailed environmental art, richer mission mechanics and dedicated ambience remain documented improvements in README.md.
