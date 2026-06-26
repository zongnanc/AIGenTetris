// The mechanical claw that holds and releases pieces in Physics mode. Drawn on
// the board canvas above the active piece. Pure presentation: it reads the
// game's grab state and animates its own retract timeline.

import { CELL } from "./constants";
import { ActivePiece, SHAPES } from "./tetromino";

const RETRACT_TIME = 0.28; // seconds to zip back up after releasing
const HEAD_W = 28;
const HEAD_H = 10;
const FINGER_LEN = 18;
const CABLE = "#8a8db4";
const METAL = "#c9ccea";

export class Claw {
  // 0 = down gripping the piece, 1 = fully retracted out of view.
  private retract = 1;

  update(dt: number, grabbed: boolean): void {
    if (grabbed) {
      this.retract = 0;
    } else {
      this.retract = Math.min(1, this.retract + dt / RETRACT_TIME);
    }
  }

  draw(ctx: CanvasRenderingContext2D, piece: ActivePiece, grabbed: boolean): void {
    if (this.retract >= 1) return; // fully retracted — nothing to draw

    const cells = SHAPES[piece.type].rotations[piece.rotation];
    const cols = cells.map(([, c]) => c);
    const rows = cells.map(([r]) => r);
    const centerX =
      (piece.col + (Math.min(...cols) + Math.max(...cols) + 1) / 2) * CELL;
    const topY = (piece.row + Math.min(...rows)) * CELL;

    // Lift the whole rig up as it retracts.
    const lift = this.retract * (topY + 70);
    const headY = topY - 4 - lift;

    // Cable down from the top edge.
    ctx.strokeStyle = CABLE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, headY);
    ctx.stroke();

    // Head.
    ctx.fillStyle = METAL;
    ctx.fillRect(centerX - HEAD_W / 2, headY - HEAD_H, HEAD_W, HEAD_H);

    // Fingers: closed while gripping, splayed open as it releases.
    const open = grabbed ? 0 : Math.min(1, this.retract * 2.5);
    const spread = 3 + open * 16;
    ctx.strokeStyle = METAL;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(centerX + dir * (HEAD_W / 2 - 3), headY);
      ctx.lineTo(centerX + dir * spread, headY + FINGER_LEN);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
  }
}
