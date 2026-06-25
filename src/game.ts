// Game state. M2: holds the board and the current active piece, and can
// spawn a new random piece. Gravity, locking, and scoring arrive later.

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
}
