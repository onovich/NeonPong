# Project Notes

## Current State
- Neon Pong 3D is a Vite-based Canvas game rebuilt from the original prototype in origin.
- The game loop, physics, scoring, AI, and input handling live under src/logic.
- GitHub Pages deployment is active through .github/workflows/deploy.yml with the Vite base path set to /NeonPong/.
- Desktop controls are stable with keyboard movement and Space-triggered air catch.
- Mobile controls currently use offset-based drag for paddle movement and tap for the same air-catch ability.

## Lessons Learned
- Input feel is the main source of iteration cost. Small sign or scaling mistakes on mobile feel immediately wrong even when the code is otherwise correct.
- For this project, visual paddle shape and collision behavior must stay close. Players notice mismatches quickly because the visible paddle is only a thin line.
- Physics clamps that abruptly zero velocity feel much worse than softer floors or damping. Table bounce feel improved after removing the hard zeroing behavior.
- Immediate out-of-bounds explosions are readable, but collision checks must happen before explosion checks or valid returns get eaten.
- Pages deployment has a hidden repository prerequisite: the repository Pages source must already be switched to GitHub Actions in GitHub settings.

## Known Constraints
- The pseudo-3D camera and table depth are projection-driven, not true 3D. Input mapping and visual feedback need to respect that illusion.
- Mobile drag now uses finger offset relative to the touch start and the paddle anchor at touch start. It is not absolute touch-to-world positioning.
- Air catch exists only for the player. It is represented as a short-lived translucent membrane rather than a literal paddle jump.
- Enemy AI can move in both x and z, but it still uses simple prediction and no special air-catch behavior.

## TODO
- Tune mobile drag scales on real devices. The current values are in src/data/gameConfig.js under mobileDragHorizontalScale and mobileDragDepthScale.
- Decide whether mobile air catch should stay as single-finger tap on release plus second-finger instant tap, or move to a dedicated on-screen affordance.
- Consider adding a cooldown or stronger feedback pulse for the air-catch membrane so the skill state is easier to read.
- Revisit README feature descriptions. Some older lines still describe legacy input behavior in broader terms than the current implementation.
- Add focused gameplay regression coverage, even if only as lightweight deterministic engine checks, for score direction, out-of-bounds timing, and hit windows.

## Practical Checks
- Build: npm run build
- Local preview: npm run preview
- Deployment target: GitHub Pages on the repository subpath /NeonPong/