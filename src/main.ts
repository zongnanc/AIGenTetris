// Entry point. M3: a fixed-timestep gravity loop drives the game — the active
// piece falls, stacks on the floor and other pieces, and the next piece spawns.
// Keyboard control arrives in M4.

import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants";
import { Game } from "./game";
import { drawBoard, drawPiece } from "./render";

const canvas = document.querySelector<HTMLCanvasElement>("#board");
if (!canvas) {
  throw new Error("Canvas #board not found");
}
canvas.width = BOARD_WIDTH;
canvas.height = BOARD_HEIGHT;

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D context unavailable");
}

const game = new Game();

function render(): void {
  drawBoard(ctx!, game.board.grid);
  drawPiece(ctx!, game.active);
}

// Fixed-timestep gravity: accumulate elapsed time and step once per interval,
// independent of the display's frame rate.
const DROP_MS = 500;
let last = performance.now();
let acc = 0;

function loop(now: number): void {
  acc += now - last;
  last = now;
  while (acc >= DROP_MS) {
    game.step();
    acc -= DROP_MS;
  }
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
