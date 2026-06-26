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

// Distinct columns the piece spans in its current rotation. Wider = more drag.
export function pieceWidth(piece: ActivePiece): number {
  const cols = SHAPES[piece.type].rotations[piece.rotation].map(([, c]) => c);
  return Math.max(...cols) - Math.min(...cols) + 1;
}

// Gravity gets stronger as the level rises.
export function gravityScaleForLevel(level: number): number {
  return 1 + (level - START_LEVEL) * 0.15;
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
