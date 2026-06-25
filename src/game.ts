// Game state. M3: gravity + movement + locking.
// The active piece falls one row per gravity step; when it can't fall it
// locks into the grid and the next piece spawns.

import { Board } from "./board";
import {
  ActivePiece,
  PieceType,
  nextRotation,
  randomPieceType,
  spawn,
} from "./tetromino";

// Column offsets tried when a rotation would collide ("wall kick"): in place,
// then one/two cells left or right. Enough to feel right without full SRS data.
const WALL_KICKS = [0, -1, 1, -2, 2];

export class Game {
  board = new Board();
  active: ActivePiece;

  constructor() {
    this.active = spawn(randomPieceType());
  }

  // Replace the active piece with a freshly spawned one (random by default).
  spawnNext(type: PieceType = randomPieceType()): ActivePiece {
    this.active = spawn(type);
    return this.active;
  }

  // Try to shift the active piece. Returns false (and does nothing) if the
  // target position collides.
  move(dRow: number, dCol: number): boolean {
    const moved: ActivePiece = {
      ...this.active,
      row: this.active.row + dRow,
      col: this.active.col + dCol,
    };
    if (this.board.collides(moved)) return false;
    this.active = moved;
    return true;
  }

  // Rotate the active piece (+1 CW, -1 CCW), trying small horizontal kicks if
  // the rotated position would collide. Returns false if no kick fits.
  rotate(dir: 1 | -1): boolean {
    const rotation = nextRotation(this.active.rotation, dir);
    for (const dCol of WALL_KICKS) {
      const candidate: ActivePiece = {
        ...this.active,
        rotation,
        col: this.active.col + dCol,
      };
      if (!this.board.collides(candidate)) {
        this.active = candidate;
        return true;
      }
    }
    return false;
  }

  // Drop straight to the bottom and lock immediately.
  hardDrop(): void {
    while (this.move(1, 0)) {
      // fall until blocked
    }
    this.board.lock(this.active);
    this.spawnNext();
  }

  // One gravity tick: drop a row if possible, otherwise lock and spawn next.
  // Returns true if a lock happened this step.
  step(): boolean {
    if (this.move(1, 0)) return false;
    this.board.lock(this.active);
    this.spawnNext();
    return true;
  }
}
