# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc --noEmit type-check, then production build into dist/
npm run preview  # serve the production build
npm test         # run all unit tests once (Vitest)
npm run test:watch
```

Run a single test file or pattern:

```bash
npx vitest run tests/physics.test.ts
npx vitest run -t "terminal velocity"   # filter by test name
```

There is no separate lint step — type-checking via `npm run build` (or `tsc --noEmit`) is the gate. Requires Node.js 18+.

## Architecture

A Canvas/TypeScript Tetris game. The guiding principle: **pure game logic is kept free of the DOM and Canvas** so it can be unit-tested directly. Anything touching `document`, `window`, or `CanvasRenderingContext2D` lives only in `main.ts`, `render.ts`, `input.ts`, `sound.ts`, and `claw.ts`; the rest is testable in isolation.

- `constants.ts` — single source of truth for board size, colors, scoring, and the classic-mode `gravityInterval(level)` curve. Imported by both logic and rendering.
- `tetromino.ts` — the seven pieces and their SRS rotation states (`SHAPES`), `spawn`, `nextRotation`, and the 7-bag `BagRandomizer`.
- `board.ts` — the grid, collision testing, locking, and line clearing. No notion of gravity or scoring.
- `game.ts` — the `Game` state machine that ties it together: movement, wall-kick rotation, hold, scoring/leveling, pause, restart, game-over, and **both** drop modes (see below).
- `main.ts` — wiring and the `requestAnimationFrame` loop. Owns all DOM/Canvas references and the action handlers shared by keyboard and touch input.

### Two drop modes share one `Game`

`game.physics` toggles between them; `main.ts`'s loop branches on it:

- **Classic mode** — fixed-timestep gravity. The loop banks elapsed time in an accumulator and calls `game.step()` once per `gravityInterval(level)` ms. Discrete, row-at-a-time.
- **Physics mode** — continuous free-fall with momentum. The loop calls `game.fall(dt)` every frame (dt capped at 0.05s to survive backgrounded tabs). The piece has a real `velocity` (rows/s) and a fractional `offset` into the next cell; whole rows drop as the offset crosses 1.

When adding mechanics, check whether they belong to one mode or both. `softDrop()`, `spawnNext()`, and `togglePhysics()` all branch on `this.physics`.

### Physics model (`physics.ts`)

All physics is **pure functions** (no state) so it is unit-tested without a running game. The model: `a = GRAVITY * gravityScale - drag * width * v`, integrated per frame and clamped to `[0, MAX_VELOCITY]`. Consequences that are intentional, not bugs:

- **Width-dependent drag** → terminal velocity depends on orientation. A vertical I-piece plummets; a broadside (wide) piece floats down. Rotating broadside doesn't snap the speed — its `pieceWidth` grows, drag rises, and velocity bleeds toward the new terminal over several frames.
- **Asymmetric braking** (`BRAKE_FACTOR`) — when above terminal (e.g. after a soft drop sets a velocity floor, or a broadside rotation), deceleration is softened so over-speed eases back gradually instead of snapping or lingering. Terminal velocity itself is unchanged.
- **Per-level ramps** — `gravityScaleForLevel`, `dragForLevel` (extra "thick air" drag for beginners that thins out), and `grabHoldForLevel` (the claw holds new pieces longer at low levels).

The tuning constants are exported precisely so they're easy to tweak; recent work on this branch has been iterating on the *feel* of these curves.

### Events instead of DOM coupling

`game.ts` never imports audio or the DOM. Instead `Game.events` exposes `onLock` / `onLineClear` / `onGameOver` hooks (default no-ops). `main.ts` wires these to `SoundFX`. Input-driven sounds (move, rotate, soft/hard drop) are played in the `main.ts` action handlers, not in `Game`. Follow this pattern for any new game→outside-world signal.

### Claw (Physics mode only)

`claw.ts` is pure presentation: it reads `game.grabbed` / `game.grabTimer` and animates its own retract timeline. A freshly spawned piece is "grabbed" for a moment before release, which is what `grabHoldForLevel` controls.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.
