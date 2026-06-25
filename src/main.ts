// Entry point. M2: render the board plus a randomly spawned piece at the top.
// Click the canvas to spawn another random piece (temporary demo hook;
// real keyboard control arrives in M4).

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

canvas.addEventListener("click", () => {
  game.spawnNext();
  render();
});

render();
