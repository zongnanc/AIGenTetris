import { describe, it, expect } from "vitest";
import {
  SHAPES,
  PIECE_TYPES,
  cellsOf,
  colorOf,
  nextRotation,
  spawn,
  type PieceType,
  type Rotation,
} from "../src/tetromino";

describe("tetromino shapes", () => {
  it("defines all seven pieces", () => {
    expect(PIECE_TYPES).toHaveLength(7);
    for (const type of PIECE_TYPES) {
      expect(SHAPES[type]).toBeDefined();
    }
  });

  it("every rotation state has exactly 4 cells", () => {
    for (const type of PIECE_TYPES) {
      const { rotations } = SHAPES[type];
      expect(rotations).toHaveLength(4);
      for (const state of rotations) {
        expect(state).toHaveLength(4);
      }
    }
  });

  it("assigns a distinct color 1..7 to each piece", () => {
    const colors = PIECE_TYPES.map(colorOf).sort((a, b) => a - b);
    expect(colors).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps cells within a 4x4 bounding box", () => {
    for (const type of PIECE_TYPES) {
      for (const state of SHAPES[type].rotations) {
        for (const [r, c] of state) {
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThan(4);
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThan(4);
        }
      }
    }
  });

  it("O piece is identical in all four rotations", () => {
    const [s0, s1, s2, s3] = SHAPES.O.rotations;
    expect(s1).toEqual(s0);
    expect(s2).toEqual(s0);
    expect(s3).toEqual(s0);
  });
});

describe("rotation index", () => {
  it("cycles clockwise 0->1->2->3->0", () => {
    let r: Rotation = 0;
    const seen: Rotation[] = [r];
    for (let i = 0; i < 4; i++) {
      r = nextRotation(r, 1);
      seen.push(r);
    }
    expect(seen).toEqual([0, 1, 2, 3, 0]);
  });

  it("cycles counter-clockwise 0->3->2->1->0", () => {
    let r: Rotation = 0;
    const seen: Rotation[] = [r];
    for (let i = 0; i < 4; i++) {
      r = nextRotation(r, -1);
      seen.push(r);
    }
    expect(seen).toEqual([0, 3, 2, 1, 0]);
  });
});

describe("piece placement", () => {
  it("spawns centered at the top in rotation 0", () => {
    const piece = spawn("T");
    expect(piece.rotation).toBe(0);
    expect(piece.row).toBe(0);
    expect(piece.col).toBe(3); // (10 / 2) - 2
  });

  it("cellsOf offsets bounding-box cells by the piece position", () => {
    const piece = spawn("I"); // row 0, col 3; spawn state cells at row 1
    const cells = cellsOf(piece);
    expect(cells).toEqual([
      [1, 3],
      [1, 4],
      [1, 5],
      [1, 6],
    ]);
  });

  it("rotating I to state 1 makes it vertical", () => {
    const piece = { type: "I" as PieceType, rotation: 1 as Rotation, row: 0, col: 3 };
    const cols = new Set(cellsOf(piece).map(([, c]) => c));
    expect(cols.size).toBe(1); // all in one column
  });
});
