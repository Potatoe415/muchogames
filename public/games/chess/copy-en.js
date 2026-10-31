export const STRINGS = {
  title: "Chess",
  pitch: "The king of board games, against the computer or with two players.",
  back: "Back",
  options: "Options",
  close: "Close",
  language: "Language",
  rules: "Rules",
  sound: "Sound",
  showMoves: "Show moves",
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
  levelRecord: "Won: {won} · Drawn: {drawn} · Played: {played}",
  noRecord: "Not played yet",
  color: "Your pieces",
  white: "White",
  black: "Black",
  random: "Random",
  play: "Play",
  resume: "Resume game",
  you: "You",
  computer: "Computer · {level}",
  toPlay: "To move",
  thinking: "Thinking…",
  check: "Check!",
  lastMove: "played {move}",
  letters: "NBRQK",
  undo: "Undo",
  hint: "Hint",
  quit: "Quit",
  win: "You win!",
  loss: "You lose",
  draw: "Draw",
  whiteWins: "White wins!",
  blackWins: "Black wins!",
  sideWhite: "white",
  sideBlack: "black",
  checkmateLine: "Checkmate: the {side} king cannot escape.",
  stalemateLine: "Stalemate: the side to move has no move and is not in check.",
  materialLine: "Not enough pieces left to checkmate.",
  fiftyLine: "50 moves without a capture or a pawn move.",
  repetitionLine: "The same position came up three times.",
  replay: "Play again",
  changeSettings: "Change settings",
  seeBoard: "See the board",
  board: "Chessboard",
  promoteTo: "Promote the pawn to:",
  queen: "Queen",
  rook: "Rook",
  bishop: "Bishop",
  knight: "Knight",
  cancel: "Cancel",
  whitePawn: "white pawn",
  whiteKnight: "white knight",
  whiteBishop: "white bishop",
  whiteRook: "white rook",
  whiteQueen: "white queen",
  whiteKing: "white king",
  blackPawn: "black pawn",
  blackKnight: "black knight",
  blackBishop: "black bishop",
  blackRook: "black rook",
  blackQueen: "black queen",
  blackKing: "black king"
};

export const RULES = `<p>Each player has 16 pieces. White moves first. The goal: <strong>checkmate</strong> the enemy king, that is, attack it so that it cannot escape.</p>
<ul>
<li><strong>Play:</strong> tap a piece then a highlighted square, or drag it. Only legal moves are offered.</li>
<li><strong>King:</strong> one square in any direction. It may never move onto an attacked square.</li>
<li><strong>Queen:</strong> any number of squares in a straight line or diagonally.</li>
<li><strong>Rook:</strong> in straight lines. <strong>Bishop:</strong> diagonally. Neither can jump over a piece.</li>
<li><strong>Knight:</strong> in an "L" (two squares then one to the side). The only piece that jumps over others.</li>
<li><strong>Pawn:</strong> moves one square forward (two from its starting square) and captures diagonally forward. On the last row it becomes the piece of your choice (promotion).</li>
<li><strong>Capture:</strong> a piece captures by landing on an enemy piece's square.</li>
<li><strong>Check:</strong> when your king is attacked, you must protect it at once.</li>
</ul>
<p><strong>Special moves:</strong> <em>castling</em> (the king slides two squares towards a rook, which jumps to its other side, if neither has moved, the way is clear and the king does not cross an attacked square — tap the king then its landing square) and <em>en passant</em> (a pawn that just moved two squares can be captured as if it had moved only one).</p>
<p><strong>Draws:</strong> stalemate (no move while not in check), not enough pieces to mate, 50 moves without a capture or a pawn move, or the same position three times.</p>
<p><strong>Help:</strong> Undo takes back your last move, Hint shows a good move (turn it on in the options). A game in progress is kept: you can resume it later.</p>`;
