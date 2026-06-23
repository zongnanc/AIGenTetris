// Board dimensions and the shared color palette.
// These are the single source of truth for sizing across logic and rendering.

export const COLS = 10;
export const ROWS = 20;
export const CELL = 30; // pixels per cell

export const BOARD_WIDTH = COLS * CELL; // 300
export const BOARD_HEIGHT = ROWS * CELL; // 600

// Cell values: 0 = empty, 1..7 = the seven tetrominoes (I, O, T, S, Z, J, L).
export const EMPTY = 0;

// Indexed by cell value. COLORS[0] is the empty/background color.
export const COLORS: readonly string[] = [
  "#14152b", // 0 empty
  "#39c5e0", // 1 I — cyan
  "#f0d000", // 2 O — yellow
  "#a14fd0", // 3 T — purple
  "#3fd06b", // 4 S — green
  "#e0473f", // 5 Z — red
  "#3f6bd0", // 6 J — blue
  "#e08a2f", // 7 L — orange
];

export const GRID_LINE = "#23254a";
