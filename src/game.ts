// Game state machine. M6 adds: a next-piece queue, hold, ghost projection,
// game-over detection, pause, and restart on top of the M3–M5 mechanics.

import { Board } from "./board";
import { LINE_SCORES, LINES_PER_LEVEL, START_LEVEL } from "./constants";
import {
  LOCK_DELAY,
  SOFT_DROP_VELOCITY,
  grabHoldForLevel,
  gravityScaleForLevel,
  nextVelocity,
  pieceWidth,
} from "./physics";
import {
  ActivePiece,
  BagRandomizer,
  PieceType,
  nextRotation,
  spawn,
} from "./tetromino";

// Column offsets tried when a rotation would collide ("wall kick").
const WALL_KICKS = [0, -1, 1, -2, 2];

export type GameStatus = "playing" | "paused" | "over";

// Optional hooks so callers (e.g. sound) can react to game events without the
// game depending on the DOM or audio. Defaults to no-ops.
export interface GameEvents {
  onLock?: () => void;
  onLineClear?: (lines: number) => void;
  onGameOver?: () => void;
}

export class Game {
  board = new Board();
  active!: ActivePiece; // assigned via takeNext() in the constructor
  next: PieceType;
  hold: PieceType | null = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = START_LEVEL;
  status: GameStatus = "playing";
  events: GameEvents = {};
  // Physics mode (free-fall) state. offset is the fractional row the piece has
  // descended into the next cell (0..1); velocity is in rows/second.
  physics = false;
  offset = 0;
  velocity = 0;
  // The claw holds a freshly spawned piece for a moment before releasing it.
  grabbed = false;
  grabTimer = 0;
  // Time a resting piece has sat flush against the floor/stack before locking.
  lockTimer = 0;
  private bag = new BagRandomizer();

  constructor() {
    this.next = this.bag.next();
    this.takeNext();
  }

  // Make a specific piece the active piece. Sets game over if it spawns into
  // an occupied cell. Exposed for deterministic tests.
  spawnNext(type: PieceType): ActivePiece {
    this.active = spawn(type);
    this.offset = 0;
    this.velocity = 0; // a new piece starts at rest
    this.grabbed = this.physics; // the claw grabs the new piece in physics mode
    this.grabTimer = this.physics ? grabHoldForLevel(this.level) : 0;
    this.lockTimer = 0;
    this.canHold = true;
    if (this.board.collides(this.active)) {
      this.status = "over";
      this.events.onGameOver?.();
    }
    return this.active;
  }

  // Pull the queued next piece into play and refill the queue.
  private takeNext(): void {
    const type = this.next;
    this.next = this.bag.next();
    this.spawnNext(type);
  }

  // Shift the active piece. Returns false (no change) on collision or when not
  // actively playing.
  move(dRow: number, dCol: number): boolean {
    if (this.status !== "playing") return false;
    const moved: ActivePiece = {
      ...this.active,
      row: this.active.row + dRow,
      col: this.active.col + dCol,
    };
    if (this.board.collides(moved)) return false;
    this.active = moved;
    return true;
  }

  // Rotate with light horizontal wall kicks.
  rotate(dir: 1 | -1): boolean {
    if (this.status !== "playing") return false;
    const oldWidth = pieceWidth(this.active);
    const rotation = nextRotation(this.active.rotation, dir);
    for (const dCol of WALL_KICKS) {
      const candidate: ActivePiece = {
        ...this.active,
        rotation,
        col: this.active.col + dCol,
      };
      if (!this.board.collides(candidate)) {
        this.active = candidate;
        // In physics mode, turning the piece broadside to its fall suddenly
        // presents more area to the air, drastically cutting its speed (e.g.
        // a fast vertical I rotated flat). Only slows down, never speeds up.
        if (this.physics) {
          const newWidth = pieceWidth(this.active);
          if (newWidth > oldWidth) {
            this.velocity *= oldWidth / newWidth;
          }
        }
        return true;
      }
    }
    return false;
  }

  // Where the active piece would land if dropped straight down.
  ghost(): ActivePiece {
    let g = this.active;
    while (!this.board.collides({ ...g, row: g.row + 1 })) {
      g = { ...g, row: g.row + 1 };
    }
    return g;
  }

  // Drop straight to the bottom and lock immediately. Returns false if the
  // game isn't actively playing (nothing happened).
  hardDrop(): boolean {
    if (this.status !== "playing") return false;
    while (this.move(1, 0)) {
      // fall until blocked
    }
    this.lockAndNext();
    return true;
  }

  // One gravity tick: drop a row if possible, otherwise lock and spawn next.
  // Returns true if a lock happened this step.
  step(): boolean {
    if (this.status !== "playing") return false;
    if (this.move(1, 0)) return false;
    this.lockAndNext();
    return true;
  }

  // Physics-mode tick (dt in seconds): integrate velocity and the sub-cell
  // offset, dropping whole rows as the offset crosses cell boundaries. Velocity
  // carries between frames (momentum) and is reset only on spawn.
  fall(dt: number): void {
    if (this.status !== "playing") return;
    if (this.grabbed) {
      // Held by the claw — don't fall yet.
      this.grabTimer -= dt;
      if (this.grabTimer <= 0) this.grabbed = false;
      return;
    }
    this.velocity = nextVelocity(
      this.velocity,
      pieceWidth(this.active),
      gravityScaleForLevel(this.level),
      dt,
    );
    this.offset += this.velocity * dt;

    // Drop whole rows while the sub-cell offset crosses cell boundaries.
    while (this.offset >= 1 && this.move(1, 0)) {
      this.offset -= 1;
    }

    if (this.board.collides({ ...this.active, row: this.active.row + 1 })) {
      // Resting on the floor or stack: sit flush (offset 0, no sub-cell overlap
      // or breaching) and lock after a short delay so the piece can still be
      // nudged at the last moment.
      this.offset = 0;
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) {
        this.lockAndNext();
      }
    } else {
      this.lockTimer = 0;
    }
  }

  // Soft drop: classic steps one row; physics adds downward speed.
  softDrop(): void {
    if (this.status !== "playing") return;
    if (this.physics) {
      this.velocity = Math.max(this.velocity, SOFT_DROP_VELOCITY);
    } else {
      this.step();
    }
  }

  togglePhysics(): void {
    this.physics = !this.physics;
    this.offset = 0;
    this.velocity = 0;
    this.grabbed = this.physics; // claw grabs the current piece when entering physics
    this.grabTimer = this.physics ? grabHoldForLevel(this.level) : 0;
    this.lockTimer = 0;
  }

  // Swap the active piece with the held one (or stash it if hold is empty).
  // Allowed once per piece. Returns false if the hold was rejected.
  holdPiece(): boolean {
    if (this.status !== "playing" || !this.canHold) return false;
    const current = this.active.type;
    if (this.hold === null) {
      this.hold = current;
      this.takeNext();
    } else {
      const swap = this.hold;
      this.hold = current;
      this.spawnNext(swap);
    }
    this.canHold = false;
    return true;
  }

  togglePause(): void {
    if (this.status === "playing") this.status = "paused";
    else if (this.status === "paused") this.status = "playing";
  }

  // Start a fresh game.
  reset(): void {
    this.board.reset();
    this.score = 0;
    this.lines = 0;
    this.level = START_LEVEL;
    this.hold = null;
    this.canHold = true;
    this.status = "playing";
    this.bag = new BagRandomizer();
    this.next = this.bag.next();
    this.takeNext();
  }

  // Lock the active piece, clear lines, update score/level, spawn the next.
  private lockAndNext(): void {
    this.board.lock(this.active);
    this.events.onLock?.();
    const cleared = this.board.clearLines();
    if (cleared > 0) {
      this.score += LINE_SCORES[cleared] * this.level;
      this.lines += cleared;
      this.level = START_LEVEL + Math.floor(this.lines / LINES_PER_LEVEL);
      this.events.onLineClear?.(cleared);
    }
    this.takeNext();
  }
}
