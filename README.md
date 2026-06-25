# AIGenTetris

A web-based Tetris game built with TypeScript, Vite, and HTML5 Canvas —
generated step by step with Claude Code as an onboarding walkthrough.

## Play

| Key        | Action          |
| ---------- | --------------- |
| ← / →      | Move left/right |
| ↓          | Soft drop       |
| Space      | Hard drop       |
| ↑ / X      | Rotate CW       |
| Z          | Rotate CCW      |
| C          | Hold piece      |
| P          | Pause           |
| R          | Restart         |

Clear lines to score (100 / 300 / 500 / 800 × level for 1–4 lines). The game
speeds up every 10 lines.

## Run locally

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
npm test         # run the unit tests (Vitest)
```

Requires Node.js 18+.

## How it's built

Pure game logic is kept free of the DOM so it can be unit-tested:

| File               | Responsibility                                    |
| ------------------ | ------------------------------------------------- |
| `src/constants.ts` | Board size, colors, scoring, gravity curve        |
| `src/tetromino.ts` | The seven pieces, rotation states (SRS), helpers  |
| `src/board.ts`     | Grid state, collision, locking, line clearing     |
| `src/game.ts`      | State machine: gravity, scoring, hold, pause, etc.|
| `src/input.ts`     | Keyboard → actions, with DAS auto-repeat          |
| `src/render.ts`    | Canvas drawing (board, ghost, previews, overlays) |
| `src/main.ts`      | Wiring + the game loop                            |

Tests live in `tests/` and cover the tetromino, board, and game modules.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages. Enable it once under
**Settings → Pages → Build and deployment → Source: GitHub Actions**.
