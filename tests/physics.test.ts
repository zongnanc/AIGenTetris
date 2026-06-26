import { describe, it, expect } from "vitest";
import {
  pieceWidth,
  nextVelocity,
  gravityScaleForLevel,
  GRAVITY,
  DRAG,
  MAX_VELOCITY,
} from "../src/physics";
import type { ActivePiece, PieceType, Rotation } from "../src/tetromino";

function piece(type: PieceType, rotation: Rotation): ActivePiece {
  return { type, rotation, row: 0, col: 3 };
}

describe("pieceWidth", () => {
  it("I spans 4 columns horizontally, 1 vertically", () => {
    expect(pieceWidth(piece("I", 0))).toBe(4);
    expect(pieceWidth(piece("I", 1))).toBe(1);
  });

  it("O spans 2 and T (spawn) spans 3", () => {
    expect(pieceWidth(piece("O", 0))).toBe(2);
    expect(pieceWidth(piece("T", 0))).toBe(3);
  });
});

describe("nextVelocity", () => {
  it("accelerates from rest under gravity (no drag at v=0)", () => {
    expect(nextVelocity(0, 1, 1, 0.1)).toBeCloseTo(GRAVITY * 0.1, 5);
  });

  it("respects the previous velocity (momentum)", () => {
    const fromRest = nextVelocity(0, 1, 1, 0.05);
    const fromMoving = nextVelocity(5, 1, 1, 0.05);
    expect(fromMoving).toBeGreaterThan(fromRest);
  });

  it("converges to a lower terminal velocity for wider pieces", () => {
    const terminal = (width: number) => {
      let v = 0;
      for (let i = 0; i < 2000; i++) v = nextVelocity(v, width, 1, 0.01);
      return v;
    };
    const narrow = terminal(1); // vertical I — plummets
    const wide = terminal(4); // horizontal I — floats
    expect(narrow).toBeGreaterThan(wide);
    expect(wide).toBeCloseTo(GRAVITY / (DRAG * 4), 1);
  });

  it("never exceeds MAX_VELOCITY", () => {
    expect(nextVelocity(MAX_VELOCITY, 1, 5, 1)).toBeLessThanOrEqual(MAX_VELOCITY);
  });

  it("clamps at zero — no upward drift", () => {
    expect(nextVelocity(0.0001, 100, 0, 1)).toBeGreaterThanOrEqual(0);
  });
});

describe("gravityScaleForLevel", () => {
  it("is 1 at the start level and grows with level", () => {
    expect(gravityScaleForLevel(1)).toBeCloseTo(1, 5);
    expect(gravityScaleForLevel(5)).toBeGreaterThan(gravityScaleForLevel(2));
  });
});
