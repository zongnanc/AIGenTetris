import { describe, it, expect } from "vitest";
import { Board, createEmptyGrid, inBounds } from "../src/board";
import { COLS, ROWS, EMPTY } from "../src/constants";

describe("board", () => {
  it("creates an empty ROWS x COLS grid", () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(ROWS);
    expect(grid[0]).toHaveLength(COLS);
    expect(grid.every((row) => row.every((cell) => cell === EMPTY))).toBe(true);
  });

  it("returns independent rows (no shared reference)", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 5;
    expect(grid[1][0]).toBe(EMPTY);
  });

  it("set/get round-trips a value", () => {
    const board = new Board();
    board.set(19, 3, 4);
    expect(board.get(19, 3)).toBe(4);
  });

  it("ignores out-of-bounds set", () => {
    const board = new Board();
    board.set(ROWS, 0, 1); // below the floor
    board.set(0, COLS, 1); // past the right wall
    expect(board.grid.every((row) => row.every((c) => c === EMPTY))).toBe(true);
  });

  it("inBounds guards the well edges", () => {
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(ROWS - 1, COLS - 1)).toBe(true);
    expect(inBounds(-1, 0)).toBe(false);
    expect(inBounds(0, COLS)).toBe(false);
  });

  it("reset clears the grid", () => {
    const board = new Board();
    board.set(5, 5, 7);
    board.reset();
    expect(board.get(5, 5)).toBe(EMPTY);
  });
});
