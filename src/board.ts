// The playfield grid and its state. Pure data + helpers, no DOM/Canvas here
// so it stays unit-testable. Rendering lives in render.ts.

import { COLS, ROWS, EMPTY } from "./constants";

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
}
