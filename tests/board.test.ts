import { describe, it, expect } from "vitest";
import { Board, createEmptyGrid, inBounds } from "../src/board";
import { COLS, ROWS, EMPTY } from "../src/constants";
import { spawn, colorOf, type ActivePiece, type PieceType, type Rotation } from "../src/tetromino";

function piece(type: PieceType, rotation: Rotation, row: number, col: number): ActivePiece {
  return { type, rotation, row, col };
}

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

describe("collision", () => {
  it("a freshly spawned piece does not collide on an empty board", () => {
    const board = new Board();
    expect(board.collides(spawn("T"))).toBe(false);
  });

  it("allows cells above the ceiling (row < 0)", () => {
    const board = new Board();
    // O cells sit at row offsets 0/1; placing at row -1 keeps one row above top.
    expect(board.collides(piece("O", 0, -1, 4))).toBe(false);
  });

  it("detects the left wall", () => {
    const board = new Board();
    // O occupies col offsets 1,2 -> col -2 puts a cell at board col -1.
    expect(board.collides(piece("O", 0, 0, -2))).toBe(true);
  });

  it("detects the right wall", () => {
    const board = new Board();
    expect(board.collides(piece("O", 0, 0, COLS - 1))).toBe(true);
  });

  it("detects the floor", () => {
    const board = new Board();
    // I (state 0) occupies row offset 1 -> at row ROWS-1 the cells hit row ROWS.
    expect(board.collides(piece("I", 0, ROWS - 1, 3))).toBe(true);
    expect(board.collides(piece("I", 0, ROWS - 2, 3))).toBe(false);
  });

  it("detects overlap with a filled cell", () => {
    const board = new Board();
    board.set(5, 5, 1); // O at row4,col4 occupies board cell (5,5)
    expect(board.collides(piece("O", 0, 4, 4))).toBe(true);
  });
});

describe("clearLines", () => {
  function fillRow(board: Board, row: number): void {
    for (let col = 0; col < COLS; col++) board.set(row, col, 1);
  }

  it("returns 0 when no row is full", () => {
    const board = new Board();
    board.set(19, 0, 1); // partial row
    expect(board.clearLines()).toBe(0);
  });

  it("clears a single full row", () => {
    const board = new Board();
    fillRow(board, 19);
    expect(board.clearLines()).toBe(1);
    expect(board.grid.flat().every((v) => v === EMPTY)).toBe(true);
  });

  it("clears multiple full rows at once", () => {
    const board = new Board();
    fillRow(board, 18);
    fillRow(board, 19);
    expect(board.clearLines()).toBe(2);
  });

  it("drops the rows above a cleared line down by one", () => {
    const board = new Board();
    board.set(5, 3, 7); // a lone block well above
    fillRow(board, 19);
    expect(board.clearLines()).toBe(1);
    expect(board.get(5, 3)).toBe(EMPTY);
    expect(board.get(6, 3)).toBe(7); // shifted down one row
  });
});

describe("lock", () => {
  it("stamps the piece color into the grid", () => {
    const board = new Board();
    const o = spawn("O"); // cells (0,4)(0,5)(1,4)(1,5)
    board.lock(o);
    expect(board.get(0, 4)).toBe(colorOf("O"));
    expect(board.get(1, 5)).toBe(colorOf("O"));
    const filled = board.grid.flat().filter((v) => v !== EMPTY).length;
    expect(filled).toBe(4);
  });
});
