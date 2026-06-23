// Entry point. For M0 this just proves the Vite + TypeScript + Canvas
// pipeline is wired up: grab the canvas and paint its background.
// Later milestones replace this with the real game loop.

const canvas = document.querySelector<HTMLCanvasElement>("#board");
if (!canvas) {
  throw new Error("Canvas #board not found");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D context unavailable");
}

ctx.fillStyle = "#14152b";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = "#6b6f9e";
ctx.font = "16px system-ui, sans-serif";
ctx.textAlign = "center";
ctx.fillText("Ready", canvas.width / 2, canvas.height / 2);
