// Game state. M3: gravity + movement + locking.
// The active piece falls one row per gravity step; when it can't fall it
// locks into the grid and the next piece spawns.

import { Board } from "./board";
import {
  ActivePiece,
  PieceType,
  randomPieceType,
  spawn,
} from "./tetromino";

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

  // One gravity tick: drop a row if possible, otherwise lock and spawn next.
  // Returns true if a lock happened this step.
  step(): boolean {
    if (this.move(1, 0)) return false;
    this.board.lock(this.active);
    this.spawnNext();
    return true;
  }
}
