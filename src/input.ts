// Keyboard handling. Maps keys to game actions and adds light DAS
// (delayed auto-shift): a held left/right/down key repeats after a short
// delay. Rotation and hard drop fire once per press.

export interface InputActions {
  moveLeft(): void;
  moveRight(): void;
  softDrop(): void;
  hardDrop(): void;
  rotateCW(): void;
  rotateCCW(): void;
  hold(): void;
  pause(): void;
  restart(): void;
}

type RepeatDir = "left" | "right" | "down";

const DAS_MS = 150; // delay before auto-repeat kicks in
const ARR_MS = 40; // interval between repeats once active

// Wires up listeners and returns a teardown function.
export function setupInput(actions: InputActions): () => void {
  let activeDir: RepeatDir | undefined;
  let dasTimer: number | undefined;
  let arrTimer: number | undefined;

  const repeatAction: Record<RepeatDir, () => void> = {
    left: actions.moveLeft,
    right: actions.moveRight,
    down: actions.softDrop,
  };

  function stopRepeat(): void {
    if (dasTimer !== undefined) clearTimeout(dasTimer);
    if (arrTimer !== undefined) clearInterval(arrTimer);
    dasTimer = arrTimer = undefined;
    activeDir = undefined;
  }

  function startRepeat(dir: RepeatDir): void {
    if (activeDir === dir) return;
    stopRepeat();
    activeDir = dir;
    const fn = repeatAction[dir];
    fn(); // immediate response on press
    dasTimer = window.setTimeout(() => {
      arrTimer = window.setInterval(fn, ARR_MS);
    }, DAS_MS);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return; // we manage our own auto-repeat
    switch (e.key) {
      case "ArrowLeft":
        startRepeat("left");
        break;
      case "ArrowRight":
        startRepeat("right");
        break;
      case "ArrowDown":
        startRepeat("down");
        break;
      case "ArrowUp":
      case "x":
      case "X":
        actions.rotateCW();
        break;
      case "z":
      case "Z":
        actions.rotateCCW();
        break;
      case " ":
        actions.hardDrop();
        break;
      case "c":
      case "C":
        actions.hold();
        break;
      case "p":
      case "P":
        actions.pause();
        break;
      case "r":
      case "R":
        actions.restart();
        break;
      default:
        return; // let other keys through without preventDefault
    }
    e.preventDefault();
  }

  function onKeyUp(e: KeyboardEvent): void {
    const released =
      (e.key === "ArrowLeft" && activeDir === "left") ||
      (e.key === "ArrowRight" && activeDir === "right") ||
      (e.key === "ArrowDown" && activeDir === "down");
    if (released) stopRepeat();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    stopRepeat();
  };
}
