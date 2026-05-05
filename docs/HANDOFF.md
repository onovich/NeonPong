# Handoff

## What This Project Is
Neon Pong 3D is a pseudo-3D neon table tennis game rendered in Canvas 2D. The current codebase is already modularized and deployable. It is no longer the original single-file prototype; the original reference remains under origin.

## Where Things Live
- src/data/gameConfig.js: gameplay tuning values, movement speeds, bounce tuning, AI tuning, and mobile drag parameters.
- src/logic/engine/gameEngine.js: rally update loop, scoring, out-of-bounds handling, player and enemy movement, air-catch logic.
- src/logic/engine/gameState.js: initial state factories.
- src/logic/hooks/inputController.js: keyboard and touch input translation.
- src/view/components/canvasRenderer.js: all table, paddle, ball, particle, and membrane rendering.
- src/view/screens/gameScreen.js and src/App.js: shell UI, overlay copy, and engine-renderer wiring.

## Gameplay Status At Handoff
- Desktop:
  - WASD and arrow keys move the player paddle on the table plane.
  - Space triggers a short air-catch membrane that can intercept a descending airborne ball.
- Mobile:
  - Primary drag uses relative offset from touch start to move the paddle.
  - A tap can trigger the same air-catch behavior.
  - A second touch while dragging also triggers air catch so movement does not need to stop.
- Ball rules:
  - Normal returns are intended to happen on table contact.
  - Airborne interception is only available while the player air-catch membrane is active.
  - Out-of-bounds now explodes immediately, but scoring is awarded to the side that last hit the ball.

## Risks And Watch Items
- Mobile feel still needs real-device tuning. Simulator intuition is not enough for the drag scales.
- The input system has changed several times. If mobile feel regresses again, check inputController.js first before changing engine movement.
- Score ownership and explosion timing are easy to invert accidentally because they depend on lastHitBy and update ordering.
- README may lag behind current mechanics if future iterations keep moving quickly.

## Recommended Next Steps
- Run a real-device pass on mobile and tune drag scales conservatively.
- Decide whether air catch should remain a hidden skill input or become a clearly exposed mobile UI action.
- Add a minimal regression harness around the engine to lock down scoring direction, explosion timing, bounce retention, and catch windows.
- If future polish continues, separate player-only mechanics from shared rules more explicitly in gameEngine.js.

## Deploy And Verify
- Install dependencies with npm install.
- Build with npm run build.
- Push to main to trigger Pages deployment.
- If Pages ever fails early at configure-pages, check repository Settings -> Pages and confirm Source is GitHub Actions.