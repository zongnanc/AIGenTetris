// The playfield grid and its state. Pure data + helpers, no DOM/Canvas here
// so it stays unit-testable. Rendering lives in render.ts.

import { COLS, ROWS, EMPTY } from "./constants";
import { ActivePiece, cellsOf, colorOf } from "./tetromino";

// grid[row][col]; row 0 is the top of the well.
export type Grid = number[][];

export function createEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(EMPTY));
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

export class Board {
  grid: Grid;

  constructor(grid: Grid = createEmptyGrid()) {
    this.grid = grid;
  }

  get(row: number, col: number): number {
    return this.grid[row][col];
  }

  set(row: number, col: number, value: number): void {
    if (inBounds(row, col)) {
      this.grid[row][col] = value;
    }
  }

  reset(): void {
    this.grid = createEmptyGrid();
  }

  // True if the piece overlaps a wall, the floor, or a filled cell.
  // Cells above the top of the well (row < 0) are allowed so pieces can
  // spawn and rotate at the ceiling.
  collides(piece: ActivePiece): boolean {
    for (const [row, col] of cellsOf(piece)) {
      if (col < 0 || col >= COLS) return true; // side walls
      if (row >= ROWS) return true; // floor
      if (row >= 0 && this.grid[row][col] !== EMPTY) return true; // stack
    }
    return false;
  }

  // Stamp the piece's cells into the grid using its color.
  lock(piece: ActivePiece): void {
    const color = colorOf(piece.type);
    for (const [row, col] of cellsOf(piece)) {
      if (inBounds(row, col)) {
        this.grid[row][col] = color;
      }
    }
  }

  // Remove every fully-filled row, dropping the rows above down to fill the
  // gap. Returns how many rows were cleared.
  clearLines(): number {
    let cleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.grid[row].every((cell) => cell !== EMPTY)) {
        this.grid.splice(row, 1);
        this.grid.unshift(new Array<number>(COLS).fill(EMPTY));
        cleared++;
        row++; // re-check this index now that rows shifted down
      }
    }
    return cleared;
  }
}
