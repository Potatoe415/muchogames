export const STRINGS = {
  title: "Scrabble",
  words: "Word language",
  mixHelp:
    "A word counts if it exists in at least one of the ticked languages.",
  back: "Back",
  options: "Options",
  close: "Close",
  language: "Language",
  sound: "Sound",
  on: "On",
  off: "Off",
  hintOption: "Hint button",
  rules: "Rules",
  dictLoading: "Loading the dictionary…",
  dictError: "The dictionary could not be loaded.",
  retry: "Try again",
  resume: "Resume game",
  vsComputer: "Against the computer",
  onOneDevice: "{n} players on one device",
  level: "Level",
  junior: "Junior",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
  levelRecord: "Wins at this level: {won} of {played}",
  noRecord: "No game at this level yet",
  players: "Players",
  names: "Names",
  player1: "Player 1",
  player2: "Player 2",
  player3: "Player 3",
  player4: "Player 4",
  start: "Start",
  you: "You",
  computer: "Computer",
  bag: "Bag",
  shuffle: "Shuffle",
  recall: "Recall",
  hintLeft: "Hint ({n})",
  hintZero: "hint used",
  pass: "Pass",
  define: "Define",
  lookupHint: "Tap a word on the board to see its definition.",
  defLoading: "Looking up the definition…",
  defMissing: "No definition found.",
  defError: "Definition unavailable (connection?).",
  defSource: "See on Wiktionary ↗",
  defLicense: "Definitions: Wiktionary, CC BY-SA 4.0 licence",
  playWord: "Play",
  firstTurn:
    "First word: it goes through the star ★. Tap a letter, then a square.",
  yourTurn: "Your turn! Put letters on the board.",
  turnOf: "{name}'s turn.",
  thinking: "{name} is thinking…",
  err_line: "Letters must be on a single line.",
  err_gap: "No empty square inside the word.",
  err_center: "The first word must go through the star ★.",
  err_short: "At least two letters are needed.",
  err_detached: "The word must touch a letter already on the board.",
  badWord: "“{word}” is not in the dictionary.",
  okWord: "{words} · {score} pts",
  bingo: "Scrabble! +50",
  lastPlay: "{name}: {word} · {score} pts",
  lastSwap: "{name} swapped {count} letter(s).",
  lastPass: "{name} passed.",
  noMove: "No word possible: swap letters or pass.",
  blankTitle: "Which letter for the blank?",
  cancel: "Cancel",
  swapTitle: "Swap or pass",
  swapHelp: "Tap the letters to put back in the bag.",
  swapHelpJunior:
    "One letter: you swap it and still play. Several: you pass your turn.",
  swapOneConfirm: "Swap 1 letter and play",
  swapNone: "Fewer than 7 letters in the bag: swapping is no longer allowed.",
  swapConfirm: "Swap ({count})",
  passConfirm: "Pass my turn",
  bagTitle: "Letters left",
  bagSummary: "{bag} in the bag · {unseen} unseen (bag + opponents)",
  handoffTitle: "{name}'s turn",
  handoffHint: "Hand over the device, then tap the button.",
  handoffButton: "Show my letters",
  win: "You win!",
  loss: "You lose",
  draw: "Draw",
  nameWins: "{name} wins!",
  endOut: "{name} used all their letters.",
  endBlocked: "Two turns without points each: the game stops.",
  endPlayer: "{name}: {score} pts ({adjust} at the end)",
  bestWord: "Best word: {word} ({score} pts)",
  replay: "Play again",
  changeSettings: "Change settings",
  seeBoard: "See the board",
  premTW: "TW",
  premDW: "DW",
  premTL: "TL",
  premDL: "DL"
};

export const RULES = `
<p><strong>Goal:</strong> score the most points by making words on the grid, crossword style.</p>
<ul>
  <li>1 to 4 players: alone against the computer, or 2 to 4 on one device (hand it over each turn).</li>
  <li>Each player has 7 letters. On your turn, put one or more letters on one row or column, with no gap, touching the words already played.</li>
  <li>The first word goes through the star ★ in the centre.</li>
  <li>Every word formed must be in the dictionary of one of the chosen languages: the game checks before playing, with no penalty. French: Officiel du Scrabble (ODS 9). English: ENABLE. Spanish: a free list of 635,000 words.</li>
  <li>Accents do not count. In Spanish, Ñ is a letter of its own; CH, LL and RR are written with two letters. Each language has its own letters and values.</li>
  <li><strong>Junior</strong> (against the computer, age 7+): the rules of side 2 of Scrabble Junior. Small board, a bag of 60 tiles, 5 letters each, and the computer's letters are visible. Only coloured squares score: green 1, blue 2, pink 3 for each letter placed on them (letter values do not count). At the start of your turn you may swap 1 letter and still play, or pass to swap several. Nothing is taken off at the end. The Hint button is always there and the letters you draw are easier.</li>
  <li><strong>Several languages:</strong> tick FR, EN and/or ES. A word is accepted if it exists in at least one ticked language, for everyone, the computer included. With Spanish, the bag has every letter plus the Ñ (French values); French + English uses the French bag.</li>
  <li><strong>Points:</strong> each letter has a value. DL and TL double or triple the letter, DW and TW the whole word (the star counts as DW). A square counts only when it is first covered.</li>
  <li>The <strong>blank</strong> stands for any letter and is worth 0.</li>
  <li><strong>Scrabble:</strong> playing all 7 letters at once earns a 50-point bonus.</li>
  <li><strong>Hint</strong> (if switched on in the options): up to 5 per turn, each one suggests a word. A turn where you took a hint scores 0 points; the next turn scores normally.</li>
  <li>Instead of playing you can <strong>swap</strong> letters (if at least 7 are left in the bag) or <strong>pass</strong>.</li>
  <li><strong>End:</strong> when the bag is empty and a player has used all their letters, or once every player has passed or swapped twice in a row. Letters left are taken off the score; the player who went out gains everyone else's.</li>
</ul>
<p><strong>Controls:</strong> tap a letter then a square, or drag it. Tap a placed letter to take it back. Tip: tap an empty square (an arrow appears, tap again to turn it) then your letters one after another. Keyboard: type letters, Enter to play, Backspace to remove, Escape to recall all.</p>
<p><strong>Define:</strong> tap the book, then a word on the board, to read a short definition (Wiktionary; French words built into the game, other languages need a connection).</p>
`;
