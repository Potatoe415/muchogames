export const STRINGS = {
  title: "Scrabble",
  pitch:
    "The word game, in French, English or Spanish. Play the computer or a friend.",
  words: "Word language",
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
  mode: "Mode",
  modeSolo: "Against the computer",
  modeDuo: "Two players",
  level: "Level",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
  levelRecord: "Wins at this level: {won} of {played}",
  noRecord: "No game at this level yet",
  players: "Players",
  player1: "Player 1",
  player2: "Player 2",
  start: "Start",
  you: "You",
  computer: "Computer",
  bag: "Bag",
  shuffle: "Shuffle",
  recall: "Recall",
  hint: "Hint",
  pass: "Pass",
  quit: "Quit",
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
  swapNone: "Fewer than 7 letters in the bag: swapping is no longer allowed.",
  swapConfirm: "Swap ({count})",
  passConfirm: "Pass my turn",
  bagTitle: "Letters left",
  bagSummary: "{bag} in the bag · {unseen} unseen (bag + opponent)",
  handoffTitle: "{name}'s turn",
  handoffHint: "Hand over the device, then tap the button.",
  handoffButton: "Show my letters",
  win: "You win!",
  loss: "You lose",
  draw: "Draw",
  nameWins: "{name} wins!",
  endOut: "{name} used all their letters.",
  endBlocked: "Four turns without points: the game stops.",
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
  <li>Each player has 7 letters. On your turn, put one or more letters on one row or column, with no gap, touching the words already played.</li>
  <li>The first word goes through the star ★ in the centre.</li>
  <li>Every word formed must be in the dictionary of the chosen language: the game checks before playing, with no penalty. French: Officiel du Scrabble (ODS 9). English: ENABLE. Spanish: a free list of 635,000 words.</li>
  <li>Accents do not count. In Spanish, Ñ is a letter of its own; CH, LL and RR are written with two letters. Each language has its own letters and values.</li>
  <li><strong>Points:</strong> each letter has a value. DL and TL double or triple the letter, DW and TW the whole word (the star counts as DW). A square counts only when it is first covered.</li>
  <li>The <strong>blank</strong> stands for any letter and is worth 0.</li>
  <li><strong>Scrabble:</strong> playing all 7 letters at once earns a 50-point bonus.</li>
  <li>Instead of playing you can <strong>swap</strong> letters (if at least 7 are left in the bag) or <strong>pass</strong>.</li>
  <li><strong>End:</strong> when the bag is empty and a player has used all their letters, or after 4 turns in a row without points. Letters left are taken off the score; the player who went out gains the opponent's.</li>
</ul>
<p><strong>Controls:</strong> tap a letter then a square, or drag it. Tap a placed letter to take it back. Tip: tap an empty square (an arrow appears, tap again to turn it) then your letters one after another. Keyboard: type letters, Enter to play, Backspace to remove, Escape to recall all.</p>
`;
