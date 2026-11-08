// The board: 43 spaces (Débuter, 41 theme spaces, Gagner), the team
// tokens on them, and the token walk after a move.
export const THEMES = ['Improbable', 'Mature', 'Plaisir', 'Scolaire'];
// Spaces drawn with a line icon (assets/icons/); the others show their medallion.
const ICON_THEMES = ['Improbable', 'Mature', 'Plaisir', 'Scolaire', 'Challenge', 'Superbe'];
// Token walk: one space per step, the whole walk in about WALK_MS, each
// step between STEP_MIN_MS and STEP_MAX_MS.
const WALK_MS = 1800;
const STEP_MIN_MS = 70;
const STEP_MAX_MS = 200;

export const BOARD_TRACK = ['Débuter'];
let themeIdx = 0;
for (let i = 1; i <= 41; i++) {
  if (i % 10 === 5) BOARD_TRACK.push('Challenge');
  else if (i % 10 === 0) BOARD_TRACK.push('Superbe');
  else {
    BOARD_TRACK.push(THEMES[themeIdx % THEMES.length]);
    themeIdx++;
  }
}
BOARD_TRACK.push('Gagner'); // 42
export const LAST = BOARD_TRACK.length - 1;

export const TOKEN_ART = ['red', 'blue', 'yellow', 'purple', 'orange', 'green', 'pink', 'brown'].map(
  (c) => `./assets/token-${c}.webp`
);
export const themeClass = (theme) => theme.toLowerCase().replace(/é/g, 'e').replace(/ /g, '-');
export const medallionArt = (theme) => `./assets/medallions/${themeClass(theme)}.webp`;
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

export function picture(src, className) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.className = className;
  img.draggable = false;
  return img;
}

// The card a team draws on its space. D has no theme of its own: a team
// still on it draws one of the 4 categories at random.
export function spaceTheme(pos) {
  if (pos >= LAST) return 'Gagner';
  if (pos <= 0) return THEMES[Math.floor(Math.random() * THEMES.length)];
  return BOARD_TRACK[pos] || 'Improbable';
}

// Up to 4 tokens on a space share one overlapping row; more take two rows.
function fitTokens(tokens) {
  const count = tokens.children.length;
  tokens.style.setProperty('--n', String(Math.max(1, count)));
  tokens.classList.toggle('is-crowded', count > 4);
}

// The track winds like a snake: each row is aligned, its last space drops half
// a row (the bend), and the next row goes back the other way from the column
// beside it. Row 0 runs over all `cols` columns; the later rows leave out the
// column of the bend above them. Returns { col, row, dy } for every space: the
// 1-based grid cell and a vertical offset in rows (the bend is eased over the
// spaces around it, and the whole track ripples gently with the column; the
// ripple depends on the column only, so two spaces one above the other move
// together and never touch).
function snakeLayout(count, cols) {
  const cells = [];
  let row = 0;
  while (cells.length < count) {
    const rightward = row % 2 === 0;
    const lane = [];
    if (rightward) for (let c = row === 0 ? 0 : 1; c < cols; c++) lane.push(c);
    else for (let c = cols - 2; c >= 0; c--) lane.push(c);
    for (let k = 0; k < lane.length && cells.length < count; k++) {
      const last = k === lane.length - 1;
      cells.push({ col: lane[k] + 1, row: row + 1, dy: 0, turn: last && cells.length < count - 1 });
    }
    row++;
  }
  // The bend: the corner space drops half a row; the spaces on either side ease
  // into it (the row above leans down, the row below leans up).
  cells.forEach((cell, i) => {
    if (!cell.turn) return;
    cell.dy += 0.5;
    [[1, 0.09], [2, 0.035]].forEach(([d, amount]) => {
      if (cells[i - d]?.row === cell.row) cells[i - d].dy += amount;
      if (cells[i + d]?.row === cell.row + 1) cells[i + d].dy -= amount;
    });
  });
  cells.forEach((cell) => {
    cell.dy += 0.05 * Math.sin(cell.col * 0.9);
  });
  return cells;
}

// The last render, redrawn when the screen turns (the columns change).
let lastRender = null;

// walk: the token on its way ({ id, pos }) or null.
function tokenPos(team, walk) {
  return walk?.id === team.id ? walk.pos : team.pos;
}

function tokenClass(team, cur, walk) {
  if (walk) return walk.id === team.id ? 'team-token is-walking' : 'team-token';
  return team.id === cur ? 'team-token is-current' : 'team-token';
}

function spaceBadge(theme, i, t) {
  if (i === 0) return t('markStart');
  if (i === LAST) return t('markEnd');
  if (theme === 'Challenge') return t('markChallenge');
  if (theme === 'Superbe') return t('markSuperbe');
  return String(i);
}

// { match, walk, t, labels }: labels = theme names in the page language.
export function renderBoard(args) {
  const { match, walk, t, labels } = args;
  lastRender = args;
  const track = $('ttcf-board-track');
  const cols = Number.parseInt(getComputedStyle(track).getPropertyValue('--cols'), 10) || 7;
  const cells = snakeLayout(BOARD_TRACK.length, cols);
  track.replaceChildren(
    ...BOARD_TRACK.map((theme, i) => {
      const space = document.createElement('div');
      space.className = `board-space ${themeClass(theme)}`;
      space.dataset.id = `ttcf-space-${i}`;
      space.style.gridColumn = String(cells[i].col);
      space.style.gridRow = String(cells[i].row);
      space.style.setProperty('--dy', cells[i].dy.toFixed(3));
      space.title = labels[theme] || theme;
      const badge = document.createElement('span');
      badge.className = 'space-badge';
      badge.textContent = spaceBadge(theme, i, t);
      const art = ICON_THEMES.includes(theme)
        ? picture(`./assets/icons/${themeClass(theme)}.svg`, 'space-icon')
        : picture(i === LAST ? './assets/medallions/chene.webp' : medallionArt(theme), 'space-medallion');
      const tokens = document.createElement('div');
      tokens.className = 'space-tokens';
      match.teams.forEach((team) => {
        if (tokenPos(team, walk) !== i) return;
        const token = picture(TOKEN_ART[team.id], tokenClass(team, match.cur, walk));
        token.dataset.id = `ttcf-team-token-${team.id + 1}`;
        token.alt = team.name;
        tokens.appendChild(token);
      });
      fitTokens(tokens);
      space.append(art, badge, tokens);
      return space;
    })
  );
}

// Moves the token element into the next space and slides it there with a
// small hop (FLIP: measured before and after the move).
function stepToken(walk, stepMs) {
  const token = $(`ttcf-team-token-${walk.id + 1}`);
  const target = $(`ttcf-space-${walk.pos}`)?.querySelector('.space-tokens');
  if (!token || !target) return;
  const before = token.getBoundingClientRect();
  const source = token.parentElement;
  target.append(token);
  fitTokens(source);
  fitTokens(target);
  const after = token.getBoundingClientRect();
  const dx = before.left - after.left;
  const dy = before.top - after.top;
  const lift = after.height * 0.45;
  token.animate(
    [
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: `translate(${dx / 2}px, ${dy / 2 - lift}px)` },
      { transform: 'none' }
    ],
    { duration: stepMs * 0.9, easing: 'ease-out' }
  );
}

// The token goes space by space from `from` to `to`. onStart(walk) renders
// the board with the token at `from`; onEnd() runs once it has landed.
// Returns the walk ({ id, pos, to, stop() }).
export function walkToken(id, from, to, { onStart, onEnd }) {
  const stepMs = Math.max(STEP_MIN_MS, Math.min(STEP_MAX_MS, WALK_MS / Math.abs(to - from)));
  let timer = null;
  let landing = null;
  const walk = {
    id,
    pos: from,
    to,
    stop() {
      clearInterval(timer);
      clearTimeout(landing);
    }
  };
  onStart(walk);
  timer = setInterval(() => {
    walk.pos += Math.sign(to - walk.pos);
    stepToken(walk, stepMs);
    if (walk.pos !== to) return;
    clearInterval(timer);
    landing = setTimeout(onEnd, stepMs);
  }, stepMs);
  return walk;
}

window.matchMedia('(orientation: landscape)').addEventListener('change', () => {
  if (lastRender) renderBoard(lastRender);
});
