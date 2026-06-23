// Entry point. M1: set up the canvas and render the 10x20 board.
// A few cells are pre-filled to prove the grid + rendering pipeline works;
// the real falling pieces arrive in later milestones.

import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants";
import { Board } from "./board";
import { drawBoard } from "./render";

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

const board = new Board();

// Demo cells so M1 shows something on screen (one of each color along the floor).
for (let col = 0; col < 7; col++) {
  board.set(19, col, col + 1);
}
board.set(18, 0, 1);
board.set(17, 0, 1);

drawBoard(ctx, board.grid);
