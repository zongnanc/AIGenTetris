// The seven tetrominoes, their colors, and rotation states (SRS layout).
// Pure data + helpers — no board, no DOM. This is the most heavily tested
// module, so it deliberately avoids any side effects.

import { COLS } from "./constants";

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

// A cell as [row, col] offset inside the piece's bounding box.
export type Cell = readonly [row: number, col: number];

// Rotation index: 0 = spawn, 1 = right (CW), 2 = 180, 3 = left (CCW).
export type Rotation = 0 | 1 | 2 | 3;

export interface TetrominoDef {
  type: PieceType;
  color: number; // index into COLORS (1..7)
  rotations: readonly (readonly Cell[])[]; // 4 states, 4 cells each
}

// Standard Super Rotation System shapes. I uses a 4x4 box, O a 2x2-ish box,
// the rest a 3x3 box.
export const SHAPES: Record<PieceType, TetrominoDef> = {
  I: {
    type: "I",
    color: 1,
    rotations: [
      [[1, 0], [1, 1], [1, 2], [1, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 1], [1, 1], [2, 1], [3, 1]],
    ],
  },
  O: {
    type: "O",
    color: 2,
    rotations: [
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
    ],
  },
  T: {
    type: "T",
    color: 3,
    rotations: [
      [[0, 1], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 1]],
      [[0, 1], [1, 0], [1, 1], [2, 1]],
    ],
  },
  S: {
    type: "S",
    color: 4,
    rotations: [
      [[0, 1], [0, 2], [1, 0], [1, 1]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 1], [1, 2], [2, 0], [2, 1]],
      [[0, 0], [1, 0], [1, 1], [2, 1]],
    ],
  },
  Z: {
    type: "Z",
    color: 5,
    rotations: [
      [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 2], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[0, 1], [1, 0], [1, 1], [2, 0]],
    ],
  },
  J: {
    type: "J",
    color: 6,
    rotations: [
      [[0, 0], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 0], [2, 1]],
    ],
  },
  L: {
    type: "L",
    color: 7,
    rotations: [
      [[0, 2], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [1, 2], [2, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
    ],
  },
};

export const PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

// A live piece on the board: type, current rotation, and the bounding box's
// top-left position (row, col) in board coordinates.
export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  row: number;
  col: number;
}

export function colorOf(type: PieceType): number {
  return SHAPES[type].color;
}

// Absolute board cells occupied by the piece in its current state.
export function cellsOf(piece: ActivePiece): Cell[] {
  return SHAPES[piece.type].rotations[piece.rotation].map(
    ([r, c]) => [piece.row + r, piece.col + c] as const,
  );
}

// Next rotation index for a turn direction (+1 = CW, -1 = CCW).
export function nextRotation(rotation: Rotation, dir: 1 | -1): Rotation {
  return (((rotation + dir) % 4) + 4) % 4 as Rotation;
}

// 7-bag randomizer: shuffles all 7 piece types into a bag and deals them one
// at a time; refills when empty, guaranteeing each piece appears once per bag.
export class BagRandomizer {
  private bag: PieceType[] = [];

  next(): PieceType {
    if (this.bag.length === 0) {
      this.bag = [...PIECE_TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
}

// Spawn at the top, horizontally centered (columns 3..6 for the 4-wide box).
export function spawn(type: PieceType): ActivePiece {
  return {
    type,
    rotation: 0,
    row: 0,
    col: Math.floor(COLS / 2) - 2,
  };
}
