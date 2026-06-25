// Entry point. M6: wire the full game — board + ghost + active piece on the
// main canvas, HUD (score/level/lines, next, hold) in the sidebar, pause and
// game-over overlays, and keyboard control including hold/pause/restart.

import { BOARD_WIDTH, BOARD_HEIGHT, gravityInterval } from "./constants";
import { Game } from "./game";
import {
  drawBoard,
  drawGhost,
  drawOverlay,
  drawPiece,
  drawPreview,
} from "./render";
import { setupInput } from "./input";

function required<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Element ${selector} not found`);
  return el;
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  return ctx;
}

const boardCanvas = required<HTMLCanvasElement>("#board");
boardCanvas.width = BOARD_WIDTH;
boardCanvas.height = BOARD_HEIGHT;
const boardCtx = context(boardCanvas);
const nextCtx = context(required<HTMLCanvasElement>("#next"));
const holdCtx = context(required<HTMLCanvasElement>("#hold"));

const scoreEl = required<HTMLElement>("#score");
const levelEl = required<HTMLElement>("#level");
const linesEl = required<HTMLElement>("#lines");

const game = new Game();

function render(): void {
  drawBoard(boardCtx, game.board.grid);
  if (game.status !== "over") {
    drawGhost(boardCtx, game.ghost());
    drawPiece(boardCtx, game.active);
  }

  scoreEl.textContent = String(game.score);
  levelEl.textContent = String(game.level);
  linesEl.textContent = String(game.lines);
  drawPreview(nextCtx, game.next);
  drawPreview(holdCtx, game.hold);

  if (game.status === "paused") {
    drawOverlay(boardCtx, "Paused", "Press P to resume");
  } else if (game.status === "over") {
    drawOverlay(boardCtx, "Game Over", "Press R to restart");
  }
}

setupInput({
  moveLeft: () => game.move(0, -1) && render(),
  moveRight: () => game.move(0, 1) && render(),
  softDrop: () => {
    game.step();
    render();
  },
  hardDrop: () => {
    game.hardDrop();
    render();
  },
  rotateCW: () => game.rotate(1) && render(),
  rotateCCW: () => game.rotate(-1) && render(),
  hold: () => {
    game.holdPiece();
    render();
  },
  pause: () => {
    game.togglePause();
    render();
  },
  restart: () => {
    game.reset();
    render();
  },
});

// Fixed-timestep gravity, paused-aware. The interval shrinks with the level.
let last = performance.now();
let acc = 0;

function loop(now: number): void {
  acc += now - last;
  last = now;
  if (game.status === "playing") {
    const interval = gravityInterval(game.level);
    while (acc >= interval) {
      game.step();
      acc -= interval;
    }
  } else {
    acc = 0; // don't bank time while paused or game over
  }
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
