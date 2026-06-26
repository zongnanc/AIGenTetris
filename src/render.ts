// All Canvas drawing. Takes plain grid data and paints it; holds no game state.

import { CELL, COLS, ROWS, COLORS, EMPTY, GRID_LINE } from "./constants";
import type { Grid } from "./board";
import { ActivePiece, PieceType, SHAPES, cellsOf, colorOf } from "./tetromino";

const GHOST_FILL = "rgba(255, 255, 255, 0.10)";
const GHOST_STROKE = "rgba(255, 255, 255, 0.30)";
const PREVIEW_CELL = 22;

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

// offsetRows shifts the piece down by a fractional row for smooth sub-cell
// free-fall in Physics mode; defaults to 0 (blocky, grid-aligned) otherwise.
export function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: ActivePiece,
  offsetRows = 0,
): void {
  const color = COLORS[colorOf(piece.type)];
  for (const [row, col] of cellsOf(piece)) {
    if (row >= 0) {
      drawCell(ctx, row + offsetRows, col, color);
    }
  }
}

// The translucent landing outline of the active piece.
export function drawGhost(ctx: CanvasRenderingContext2D, piece: ActivePiece): void {
  for (const [row, col] of cellsOf(piece)) {
    if (row < 0) continue;
    const x = col * CELL;
    const y = row * CELL;
    ctx.fillStyle = GHOST_FILL;
    ctx.fillRect(x, y, CELL, CELL);
    ctx.strokeStyle = GHOST_STROKE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
  }
}

// Draw a piece centered in a small preview canvas (used for Next and Hold).
// Pass null to clear the canvas.
export function drawPreview(
  ctx: CanvasRenderingContext2D,
  type: PieceType | null,
): void {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  if (!type) return;

  const cells = SHAPES[type].rotations[0];
  const rows = cells.map(([r]) => r);
  const cols = cells.map(([, c]) => c);
  const minR = Math.min(...rows);
  const maxR = Math.max(...rows);
  const minC = Math.min(...cols);
  const maxC = Math.max(...cols);

  const offX = (width - (maxC - minC + 1) * PREVIEW_CELL) / 2;
  const offY = (height - (maxR - minR + 1) * PREVIEW_CELL) / 2;
  const color = COLORS[SHAPES[type].color];

  for (const [r, c] of cells) {
    const x = offX + (c - minC) * PREVIEW_CELL;
    const y = offY + (r - minR) * PREVIEW_CELL;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, PREVIEW_CELL, PREVIEW_CELL);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, PREVIEW_CELL - 2, PREVIEW_CELL - 2);
  }
}

// A dimming overlay with a title + subtitle, for pause and game over.
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = "rgba(8, 9, 20, 0.78)";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e6e6f0";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText(title, width / 2, height / 2 - 8);
  ctx.fillStyle = "#a0a3c8";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(subtitle, width / 2, height / 2 + 22);
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
