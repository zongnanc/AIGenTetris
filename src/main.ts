// Entry point. M3: a fixed-timestep gravity loop drives the game — the active
// piece falls, stacks on the floor and other pieces, and the next piece spawns.
// Keyboard control arrives in M4.

import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants";
import { Game } from "./game";
import { drawBoard, drawPiece } from "./render";
import { setupInput } from "./input";

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

// Keyboard control. Each action re-renders immediately for responsiveness;
// a soft drop is just a gravity step (drops, or locks at the bottom).
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
});

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
