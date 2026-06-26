// Sound effects synthesized with the Web Audio API — no audio asset files.
// Each effect is a short oscillator tone. The AudioContext is created lazily
// and resumed on first use, since browsers block audio until a user gesture
// (our sounds are all triggered by key presses, which satisfies that).

type Wave = "square" | "triangle" | "sine" | "sawtooth";

export class SoundFX {
  private ctx: AudioContext | null = null;
  private enabled = true;

  // Turn sound on/off; returns the new state.
  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  private tone(freq: number, duration: number, wave: Wave = "square", gain = 0.05): void {
    if (!this.enabled) return;
    if (!this.ctx) this.ctx = new AudioContext();
    const ctx = this.ctx;
    if (ctx.state === "suspended") void ctx.resume();

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    osc.connect(amp);
    amp.connect(ctx.destination);

    const now = ctx.currentTime;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  move(): void {
    this.tone(220, 0.05);
  }

  rotate(): void {
    this.tone(330, 0.06);
  }

  hold(): void {
    this.tone(440, 0.06, "triangle");
  }

  lock(): void {
    this.tone(160, 0.08);
  }

  hardDrop(): void {
    this.tone(110, 0.1, "sawtooth");
  }

  // Short, soft tick. Held soft-drop auto-repeats, so these stack into a rattle.
  softDrop(): void {
    this.tone(150, 0.035, "triangle", 0.04);
  }

  // Ascending arpeggio — more notes for more lines cleared.
  lineClear(lines: number): void {
    for (let i = 0; i < lines; i++) {
      setTimeout(() => this.tone(440 + i * 130, 0.12, "triangle", 0.07), i * 60);
    }
  }

  gameOver(): void {
    this.tone(200, 0.2, "sawtooth", 0.06);
    setTimeout(() => this.tone(150, 0.3, "sawtooth", 0.06), 130);
  }
}
