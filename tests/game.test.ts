import { describe, it, expect } from "vitest";
import { Game } from "../src/game";
import { EMPTY } from "../src/constants";
import { cellsOf, colorOf } from "../src/tetromino";

// Generous upper bound on gravity steps to reach the floor.
const ROWS_GUARD = 40;

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
