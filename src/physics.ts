// Free-fall physics for the active piece (Physics mode). Pure functions, no
// state, so they're easy to unit-test. The model: vertical velocity in rows
// per second, accelerated by gravity and resisted by width-dependent air drag.
//
//   a = GRAVITY * gravityScale - DRAG * width * v
//   v' = clamp(v + a*dt, 0, MAX_VELOCITY)
//
// Terminal velocity ~ GRAVITY*scale / (DRAG*width): a narrow (vertical) piece
// plummets; a wide (horizontal) piece floats down. Constants are tuned for an
// arcade feel and exported so they're easy to tweak.

import { START_LEVEL } from "./constants";
import { ActivePiece, SHAPES } from "./tetromino";

export const GRAVITY = 34; // rows / s^2
export const DRAG = 2.2; // air resistance per unit width
export const MAX_VELOCITY = 40; // rows / s safety cap
export const SOFT_DROP_VELOCITY = 25; // rows / s floor applied on soft drop
export const GRAB_HOLD_BASE = 0.5; // claw hold at the starting level (seconds)
export const GRAB_HOLD_MIN = 0.1; // shortest hold at high levels (seconds)
export const GRAB_HOLD_STEP = 0.05; // hold reduction per level
export const LOCK_DELAY = 0.2; // seconds a resting piece sits flush before locking

// Distinct columns the piece spans in its current rotation. Wider = more drag.
export function pieceWidth(piece: ActivePiece): number {
  const cols = SHAPES[piece.type].rotations[piece.rotation].map(([, c]) => c);
  return Math.max(...cols) - Math.min(...cols) + 1;
}

// Gravity gets stronger as the level rises.
export function gravityScaleForLevel(level: number): number {
  return 1 + (level - START_LEVEL) * 0.15;
}

// How long the claw holds a new piece before dropping it: longer at the start,
// quicker at higher levels (down to a floor), so the game speeds up.
export function grabHoldForLevel(level: number): number {
  return Math.max(GRAB_HOLD_MIN, GRAB_HOLD_BASE - (level - START_LEVEL) * GRAB_HOLD_STEP);
}

// Next vertical velocity (rows/s). Depends on the previous velocity (momentum).
export function nextVelocity(
  v: number,
  width: number,
  gravityScale: number,
  dt: number,
): number {
  const accel = GRAVITY * gravityScale - DRAG * width * v;
  const next = v + accel * dt;
  return Math.min(Math.max(next, 0), MAX_VELOCITY);
}
