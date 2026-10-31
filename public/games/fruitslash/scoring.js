// What a blade segment does: cuts items, scores them, tracks the stroke's
// combo, and sets off the matching effects and sounds.
import * as rules from "./rules.js";
import { lookup } from "./themes.js";
import * as worlds from "./world.js";

const SWOOSH_LENGTH = 30;
const COMBO_COLOR = "#fff275";
const CHEER_COLOR = "#7cf7ff";
const BOMB_COLOR = "#ff6b6b";
const BONUS_COLOR = "#ffd23f";

export function createScoring({ world, size, effects, audio, t, onChange }) {
  const combo = { count: 0, last: 0 };
  const textX = (x) => Math.min(size.w - 70, Math.max(70, x));
  const pixel = (item) => ({ x: item.x * size.w, y: item.y * size.h });
  const say = (x, y, label, color, px) =>
    effects.text(textX(x), y, label, color, px);

  function closeCombo() {
    const { count } = combo;
    combo.count = 0;
    const bonus = rules.comboBonus(count);
    if (!bonus) return;
    world.score += bonus;
    world.bestCombo = Math.max(world.bestCombo, count);
    const cheers = t("cheers").split("|");
    const cheer = cheers[Math.floor(Math.random() * cheers.length)];
    say(size.w / 2, size.h * 0.3, t("combo", { n: count }), COMBO_COLOR, 44);
    say(size.w / 2, size.h * 0.3 + 48, cheer, CHEER_COLOR, 32);
    audio.play("combo");
    onChange();
  }

  function hitBomb(item, at) {
    world.items = world.items.filter((other) => other !== item);
    world.timeLeft = Math.max(0, world.timeLeft - rules.BOMB_PENALTY);
    combo.count = 0;
    effects.boom(at.x, at.y);
    say(
      at.x,
      at.y,
      t("bombText", { time: rules.BOMB_PENALTY }),
      BOMB_COLOR,
      42
    );
    audio.play("boom");
    navigator.vibrate?.(150);
  }

  function addBonusTime(at, r) {
    const time = rules.BONUS_TIME;
    world.timeLeft = Math.min(rules.MAX_SECONDS, world.timeLeft + time);
    effects.sparkle(at.x, at.y);
    say(at.x, at.y + r, t("bonusText", { time }), BONUS_COLOR, 28);
    audio.play("bonus");
  }

  function cut(item, angle, at) {
    const bonus = worlds.kindOf(item.e) === "bonus";
    const points = bonus ? rules.BONUS_POINTS : 1;
    const r = worlds.itemRadius(world, size);
    const { c } = lookup(item.e);
    worlds.cutItem(world, item, angle);
    world.score += points;
    world.sliced += 1;
    combo.count += 1;
    combo.last = world.elapsed;
    effects.juice(at.x, at.y, c, r * 0.9);
    say(at.x, at.y - r, `+${points}`, c, bonus ? 40 : 30);
    if (bonus) addBonusTime(at, r);
    else audio.play("cut", combo.count - 1);
  }

  return {
    // Segment a→b in CSS pixels.
    cutAlong([a, b]) {
      if (Math.hypot(b.x - a.x, b.y - a.y) > SWOOSH_LENGTH)
        audio.play("swoosh");
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const hits = worlds.itemsOnSegment(world, a, b, size);
      hits.forEach((item) => {
        const at = pixel(item);
        if (worlds.kindOf(item.e) === "bomb") hitBomb(item, at);
        else cut(item, angle, at);
      });
      if (hits.length) onChange();
    },
    // The stroke ended: its combo, if any, scores now.
    endStroke() {
      if (combo.count) closeCombo();
    },
    // A stroke's combo also closes once it stops cutting for a moment.
    update() {
      if (combo.count && world.elapsed - combo.last > rules.COMBO_WINDOW) {
        closeCombo();
      }
    }
  };
}
