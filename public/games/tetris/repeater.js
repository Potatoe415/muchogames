// Horizontal auto-repeat (DAS then ARR): the last direction pressed wins.
const DAS = 0.17;
const ARR = 0.04;
const SIGN = { left: -1, right: 1 };

export class Repeater {
  constructor(move) {
    this.move = move;
    this.held = { left: false, right: false };
    this.reset(0);
  }

  reset(dir) {
    this.dir = dir;
    this.charge = 0;
    this.repeating = false;
  }

  press(name) {
    if (this.held[name]) return;
    this.held[name] = true;
    this.reset(SIGN[name]);
    this.move(this.dir);
  }

  release(name) {
    this.held[name] = false;
    if (SIGN[name] !== this.dir) return;
    const other = name === "left" ? "right" : "left";
    this.reset(this.held[other] ? SIGN[other] : 0);
  }

  update(dt) {
    if (this.dir === 0) return;
    this.charge += dt;
    if (!this.repeating && this.charge >= DAS) {
      this.repeating = true;
      this.charge -= DAS;
    }
    while (this.repeating && this.charge >= ARR) {
      this.charge -= ARR;
      this.move(this.dir);
    }
  }
}

export const isHorizontal = (name) => name in SIGN;
