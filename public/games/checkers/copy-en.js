export const STRINGS = {
  title: "Checkers",
  pitch: "The great classic, against the computer or with a friend.",
  back: "Back",
  options: "Options",
  close: "Close",
  language: "Language",
  rules: "Rules",
  sound: "Sound",
  showMoves: "Show possible moves",
  hintOption: "Hint button",
  on: "On",
  off: "Off",
  boardTheme: "Board",
  themeWood: "Wood",
  themeClassic: "Classic",
  themeOcean: "Ocean",
  mode: "Mode",
  modeSolo: "Vs computer",
  modeDuo: "Two players",
  level: "Level",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
  levelRecord: "Wins: {won}/{played}",
  noRecord: "Not played yet",
  color: "Your pieces",
  light: "White",
  dark: "Black",
  random: "Random",
  variant: "Rules",
  international: "International 10×10",
  english: "English 8×8",
  play: "Play",
  resume: "Resume game",
  you: "You",
  computer: "Computer · {level}",
  toPlay: "To move",
  thinking: "Thinking…",
  mustCapture: "Capture is mandatory!",
  lastMove: "played {move}",
  pieces: "Men {men} · Kings {kings}",
  undo: "Undo",
  hint: "Hint",
  quit: "Quit",
  win: "You win!",
  loss: "You lose",
  draw: "Draw",
  lightWins: "White wins!",
  darkWins: "Black wins!",
  sideLight: "White",
  sideDark: "Black",
  blockedLine: "{side} has no move left.",
  capturedLine: "{side} has no pieces left.",
  quietLine: "Too many king moves without a capture.",
  repetitionLine: "The same position came up three times.",
  replay: "Play again",
  changeSettings: "Change settings",
  seeBoard: "See the board",
  board: "Board",
  square: "Square {n}",
  lightMan: "white man",
  darkMan: "black man",
  lightKing: "white king",
  darkKing: "black king"
};

export const RULES = `<p>Each player moves their pieces diagonally, on the dark squares. The goal: capture every enemy piece or leave them with no move.</p>
<ul>
<li><strong>Playing:</strong> tap a piece then a highlighted square, or drag it. Only pieces that can move are offered.</li>
<li><strong>Moving:</strong> a man steps one square diagonally forward.</li>
<li><strong>Capturing:</strong> jump over a neighbouring enemy piece to land right behind it. Several captures can be chained in one move. Capturing is mandatory.</li>
<li><strong>King:</strong> a man that ends its move on the far row becomes a king (crown). It moves forwards and backwards.</li>
<li><strong>End:</strong> a player who cannot move loses. The game is a draw when the same position comes up three times, or after a long run of king moves without a capture.</li>
</ul>
<p><strong>International rules (10×10)</strong>: White moves first. Men also capture backwards. Kings fly along the whole diagonal. You must capture as many pieces as possible. A man that crosses the far row during a capture without stopping there stays a man.</p>
<p><strong>English rules (8×8)</strong>: Black moves first. Men only capture forwards. Kings step one square. You may choose any capture, but a capture once started must be completed. A man that is crowned ends its move.</p>
<p><strong>Helpers:</strong> Undo takes back your last move, Hint shows a good move (turn it on in the options). A game in progress is kept: you can resume it later.</p>`;
