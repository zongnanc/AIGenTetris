import { describe, it, expect } from "vitest";
import { Game } from "../src/game";
import { COLS, EMPTY } from "../src/constants";
import { cellsOf, colorOf } from "../src/tetromino";
import { LOCK_DELAY } from "../src/physics";

// Generous upper bound on gravity steps to reach the floor.
const ROWS_GUARD = 40;

// Fill a row on the game's board leaving the given columns empty.
function fillRowExcept(game: Game, row: number, empties: number[]): void {
  for (let col = 0; col < COLS; col++) {
    if (!empties.includes(col)) game.board.set(row, col, 1);
  }
}

describe("game movement + gravity", () => {
  it("move shifts the active piece when there is room", () => {
    const game = new Game();
    game.spawnNext("O"); // col 3
    expect(game.move(0, 1)).toBe(true);
    expect(game.active.col).toBe(4);
  });

  it("move is blocked at the wall and leaves the piece put", () => {
    const game = new Game();
    game.spawnNext("O");
    while (game.move(0, -1)) {
      // slide left until blocked
    }
    expect(game.active.col).toBe(-1); // O's left cells reach board col 0
    expect(game.move(0, -1)).toBe(false);
  });

  it("step locks the piece on the floor and spawns the next", () => {
    const game = new Game();
    game.spawnNext("O");
    let locked = false;
    for (let i = 0; i < ROWS_GUARD && !locked; i++) {
      locked = game.step();
    }
    expect(locked).toBe(true);
    const filled = game.board.grid.flat().filter((v) => v !== EMPTY).length;
    expect(filled).toBe(4); // the locked O
  });
});

describe("rotation + hard drop", () => {
  it("rotates the active piece when there is room", () => {
    const game = new Game();
    game.spawnNext("I");
    expect(game.rotate(1)).toBe(true);
    expect(game.active.rotation).toBe(1);
    const cols = new Set(cellsOf(game.active).map(([, c]) => c));
    expect(cols.size).toBe(1); // vertical I sits in one column
  });

  it("hard drop locks the piece on the floor and spawns next", () => {
    const game = new Game();
    game.spawnNext("O"); // cols 4,5
    game.hardDrop();
    const filled = game.board.grid.flat().filter((v) => v !== EMPTY).length;
    expect(filled).toBe(4);
    // O should rest on the floor (bottom two rows).
    expect(game.board.get(19, 4)).toBe(colorOf("O"));
    expect(game.board.get(18, 5)).toBe(colorOf("O"));
  });
});

describe("scoring + levels", () => {
  it("scores a single line clear (100 x level)", () => {
    const game = new Game();
    fillRowExcept(game, 19, [4, 5]); // gap matches an O
    game.spawnNext("O");
    game.hardDrop(); // completes row 19
    expect(game.lines).toBe(1);
    expect(game.score).toBe(100);
    expect(game.level).toBe(1);
  });

  it("scores a double line clear (300 x level)", () => {
    const game = new Game();
    fillRowExcept(game, 18, [4, 5]);
    fillRowExcept(game, 19, [4, 5]);
    game.spawnNext("O");
    game.hardDrop(); // O fills the 4,5 gap on both rows
    expect(game.lines).toBe(2);
    expect(game.score).toBe(300);
  });
});

describe("game states", () => {
  it("ends the game when a piece spawns into filled cells", () => {
    const game = new Game();
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < COLS; c++) game.board.set(r, c, 1);
    }
    game.spawnNext("O"); // spawns into the filled top -> game over
    expect(game.status).toBe("over");
    expect(game.step()).toBe(false); // no further play
  });

  it("toggles pause and blocks movement while paused", () => {
    const game = new Game();
    game.spawnNext("O");
    game.togglePause();
    expect(game.status).toBe("paused");
    expect(game.move(0, 1)).toBe(false);
    game.togglePause();
    expect(game.status).toBe("playing");
  });

  it("holds a piece, then blocks a second hold until the next piece", () => {
    const game = new Game();
    game.spawnNext("T");
    game.holdPiece();
    expect(game.hold).toBe("T");
    expect(game.canHold).toBe(false);
    game.holdPiece(); // ignored
    expect(game.hold).toBe("T");
  });

  it("reset restores a fresh game", () => {
    const game = new Game();
    game.hardDrop();
    game.togglePause();
    game.reset();
    expect(game.score).toBe(0);
    expect(game.lines).toBe(0);
    expect(game.level).toBe(1);
    expect(game.status).toBe("playing");
    expect(game.hold).toBeNull();
  });

  it("ghost projects the piece down to its landing row", () => {
    const game = new Game();
    game.spawnNext("O"); // O bottom cells rest on row 19 -> ghost top at 18
    const ghost = game.ghost();
    expect(ghost.col).toBe(game.active.col);
    expect(ghost.row).toBe(18);
  });
});

describe("physics mode", () => {
  function filledCount(game: Game): number {
    return game.board.grid.flat().filter((v) => v !== EMPTY).length;
  }

  it("toggles physics and resets the fall state", () => {
    const game = new Game();
    game.velocity = 5;
    game.offset = 0.5;
    game.togglePhysics();
    expect(game.physics).toBe(true);
    expect(game.velocity).toBe(0);
    expect(game.offset).toBe(0);
  });

  it("fall() eventually locks a piece and resets velocity on spawn", () => {
    const game = new Game();
    game.togglePhysics();
    game.spawnNext("O");
    let safety = 0;
    while (filledCount(game) === 0 && safety < 1000) {
      game.fall(0.1);
      safety++;
    }
    expect(filledCount(game)).toBe(4); // a locked O
    expect(game.velocity).toBe(0); // reset on the next spawn
    expect(game.offset).toBe(0);
  });

  it("soft drop boosts velocity in physics mode", () => {
    const game = new Game();
    game.togglePhysics();
    game.spawnNext("T");
    expect(game.velocity).toBe(0);
    game.softDrop();
    expect(game.velocity).toBeGreaterThan(0);
  });

  it("rotating a fast piece broadside drastically cuts its speed", () => {
    const game = new Game();
    game.togglePhysics();
    game.spawnNext("I"); // rotation 0 = horizontal (width 4)
    game.rotate(1); // -> vertical (width 1); narrowing, no cut
    game.velocity = 16; // falling fast
    game.rotate(1); // -> horizontal (width 4); broadside to the air
    expect(game.velocity).toBeCloseTo(16 * (1 / 4), 5);
  });

  it("a resting piece sits flush (no overlap/breach) and locks after the delay", () => {
    const game = new Game();
    game.togglePhysics();
    game.spawnNext("O");
    game.grabbed = false; // skip the claw hold for the test
    game.active.row = 18; // O resting on the floor (cells in rows 18-19)
    game.velocity = 30; // moving fast into the floor

    game.fall(0.05); // resting: should sit flush and not lock yet
    expect(game.offset).toBe(0); // no sub-cell sink-in past the floor
    expect(game.board.grid.flat().every((v) => v === EMPTY)).toBe(true);

    game.fall(LOCK_DELAY); // exceed the lock delay
    expect(game.board.grid.flat().some((v) => v !== EMPTY)).toBe(true);
  });

  it("the claw holds a new piece briefly before it falls", () => {
    const game = new Game();
    game.togglePhysics();
    game.spawnNext("T");
    expect(game.grabbed).toBe(true);
    const startRow = game.active.row;
    game.fall(0.1); // within the hold window
    expect(game.active.row).toBe(startRow); // still held
    game.fall(0.3); // exceeds the hold -> released
    expect(game.grabbed).toBe(false);
  });
});
