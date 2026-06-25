// All Canvas drawing. Takes plain grid data and paints it; holds no game state.

import { CELL, COLS, ROWS, COLORS, EMPTY, GRID_LINE } from "./constants";
import type { Grid } from "./board";
import { ActivePiece, cellsOf, colorOf } from "./tetromino";

export function drawBoard(ctx: CanvasRenderingContext2D, grid: Grid): void {
  // Background.
  ctx.fillStyle = COLORS[EMPTY];
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

  // Filled cells.
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const value = grid[row][col];
      if (value !== EMPTY) {
        drawCell(ctx, row, col, COLORS[value]);
      }
    }
  }

  drawGridLines(ctx);
}

export function drawCell(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  color: string,
): void {
  const x = col * CELL;
  const y = row * CELL;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, CELL, CELL);
  // Inner bevel for a blocky look.
  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
}

export function drawPiece(ctx: CanvasRenderingContext2D, piece: ActivePiece): void {
  const color = COLORS[colorOf(piece.type)];
  for (const [row, col] of cellsOf(piece)) {
    if (row >= 0) {
      drawCell(ctx, row, col, color);
    }
  }
}

function drawGridLines(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  for (let col = 0; col <= COLS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * CELL, 0);
    ctx.lineTo(col * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let row = 0; row <= ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL);
    ctx.lineTo(COLS * CELL, row * CELL);
    ctx.stroke();
  }
}
