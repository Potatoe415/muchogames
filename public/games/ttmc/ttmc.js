// Game logic for TTMC
const THEMES = ['Improbable', 'Mature', 'Plaisir', 'Scolaire'];
const SPECIAL_THEMES = ['Challenge', 'Débuter', 'Gagner', 'Superbe'];

const BOARD_TRACK = ['Débuter'];
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

let gameState = {
  teams: [],
  currentTeamIdx: 0,
  boardSize: 42,
  cards: [],
  currentCard: null,
  currentNote: null,
  timer: null,
  timeLeft: 30
};

// UI Elements
const els = {
  setupScreen: document.getElementById('setupScreen'),
  boardScreen: document.getElementById('boardScreen'),
  winScreen: document.getElementById('winScreen'),
  teamsList: document.getElementById('teamsList'),
  addTeamBtn: document.getElementById('addTeamBtn'),
  startBtn: document.getElementById('startBtn'),
  turnIndicator: document.getElementById('turnIndicator'),
  boardTrack: document.getElementById('boardTrack'),
  drawCardBtn: document.getElementById('drawCardBtn'),
  
  cardModal: document.getElementById('cardModal'),
  cardTheme: document.getElementById('cardTheme'),
  cardSubject: document.getElementById('cardSubject'),
  evalStep: document.getElementById('evaluationStep'),
  evalGrid: document.getElementById('evalGrid'),
  questionStep: document.getElementById('questionStep'),
  selectedNote: document.getElementById('selectedNote'),
  cardQuestion: document.getElementById('cardQuestion'),
  showAnswerBtn: document.getElementById('showAnswerBtn'),
  answerStep: document.getElementById('answerStep'),
  cardAnswer: document.getElementById('cardAnswer'),
  
  validationButtons: document.getElementById('validationButtons'),
  failBtn: document.getElementById('failBtn'),
  successBtn: document.getElementById('successBtn'),
  
  manualMoveUi: document.getElementById('manualMoveUi'),
  manualMoveValue: document.getElementById('manualMoveValue'),
  manualMoveDec: document.getElementById('manualMoveDec'),
  manualMoveInc: document.getElementById('manualMoveInc'),
  manualMoveConfirm: document.getElementById('manualMoveConfirm'),
  
  timerFill: document.getElementById('timerFill'),
  
  winnerName: document.getElementById('winnerName'),
  restartBtn: document.getElementById('restartBtn'),
};

async function init() {
  if (window.GameHeader) {
    window.GameHeader.initOptionsPanel(
      document.getElementById('settingsButton'),
      document.getElementById('settingsPanel')
    );
  }

  // Load data
  try {
    const res = await fetch('/data/ttmc/ttmc_data.json');
    if (res.ok) {
      const data = await res.json();
      gameState.cards = data.cards || [];
    }
  } catch {
    console.error("No data found, will use fallback.");
  }
  
  if (gameState.cards.length === 0) {
    gameState.cards = generateMockCards();
  }

  bindSetup();
  addTeamInput();
  addTeamInput();
}

function generateMockCards() {
  const cards = [];
  THEMES.forEach(theme => {
    for(let i=0; i<5; i++) {
      const questions = [];
      for(let j=1; j<=10; j++) {
        questions.push({
          level: j,
          q: `Question niveau ${j} sur le thème ${theme} (sujet ${i}) ?`,
          a: `Réponse niveau ${j}`
        });
      }
      cards.push({ theme, subject: `Sujet ${theme} ${i+1}`, questions });
    }
  });
  return cards;
}

function bindSetup() {
  els.addTeamBtn.addEventListener('click', () => {
    if (els.teamsList.children.length < 4) addTeamInput();
  });
  
  els.startBtn.addEventListener('click', startGame);
  els.drawCardBtn.addEventListener('click', drawCard);
  
  // Build Eval Grid
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'eval-btn';
    btn.textContent = i;
    btn.addEventListener('click', () => selectNote(i));
    els.evalGrid.appendChild(btn);
  }
  
  els.showAnswerBtn.addEventListener('click', showAnswer);
  els.failBtn.addEventListener('click', () => endTurn(0));
  els.successBtn.addEventListener('click', () => endTurn(gameState.currentNote));
  
  els.manualMoveDec.addEventListener('click', () => {
    let val = parseInt(els.manualMoveValue.textContent, 10);
    els.manualMoveValue.textContent = val - 1;
  });
  els.manualMoveInc.addEventListener('click', () => {
    let val = parseInt(els.manualMoveValue.textContent, 10);
    els.manualMoveValue.textContent = val + 1;
  });
  els.manualMoveConfirm.addEventListener('click', () => {
    let val = parseInt(els.manualMoveValue.textContent, 10);
    endTurn(val);
  });
  
  els.restartBtn.addEventListener('click', () => location.reload());
}

function addTeamInput() {
  const div = document.createElement('div');
  div.className = 'team-input-row';
  const num = els.teamsList.children.length + 1;
  div.innerHTML = `<input type="text" placeholder="Équipe ${num}" value="Équipe ${num}">`;
  els.teamsList.appendChild(div);
  
  if (els.teamsList.children.length >= 2) els.startBtn.classList.remove('hidden');
  if (els.teamsList.children.length >= 4) els.addTeamBtn.classList.add('hidden');
}

async function startGame() {
  const started = await window.MuchogamesMatch.start('ttmc');
  if (!started) return;

  const inputs = els.teamsList.querySelectorAll('input');
  gameState.teams = Array.from(inputs).map((inp, idx) => ({
    id: idx,
    name: inp.value.trim() || `Équipe ${idx+1}`,
    pos: 1 // Start at case 1 after the Débuter draw
  }));
  
  els.setupScreen.classList.add('hidden');
  els.boardScreen.classList.remove('hidden');
  
  renderBoard();
  updateTurn();

  // Show a Débuter card before the actual turn starts
  // We temporarly set the team pos to 0 so getSpaceTheme reads Débuter
  const firstTeam = gameState.teams[0];
  const originalPos = firstTeam.pos;
  firstTeam.pos = 0;
  drawCard();
  firstTeam.pos = originalPos; // restore immediately
}

function renderBoard() {
  els.boardTrack.innerHTML = '';
  BOARD_TRACK.forEach((theme, i) => {
    const space = document.createElement('div');
    space.className = `board-space ${theme.toLowerCase().replace(/é/g, 'e')}`;
    
    if (i === 0) space.textContent = 'D';
    else if (i === BOARD_TRACK.length - 1) space.textContent = 'F';
    else if (theme === 'Challenge') space.textContent = 'C';
    else if (theme === 'Superbe') space.textContent = 'S';
    else space.textContent = i;
    
    // Add tokens
    gameState.teams.forEach(t => {
      if (t.pos === i) {
        const token = document.createElement('div');
        token.className = `team-token t${t.id}`;
        space.appendChild(token);
      }
    });
    
    els.boardTrack.appendChild(space);
  });
}

function updateTurn() {
  const team = gameState.teams[gameState.currentTeamIdx];
  els.turnIndicator.textContent = `Tour de : ${team.name}`;
}

function getSpaceTheme(pos) {
  if (pos >= BOARD_TRACK.length - 1) return 'Gagner';
  return BOARD_TRACK[pos] || 'Improbable';
}

function drawCard() {
  const pos = gameState.teams[gameState.currentTeamIdx].pos;
  const targetTheme = getSpaceTheme(pos);
  
  const pool = gameState.cards.filter(c => c.theme.toLowerCase() === targetTheme.toLowerCase());
  if (pool.length === 0) {
    gameState.currentCard = gameState.cards[Math.floor(Math.random()*gameState.cards.length)];
  } else {
    gameState.currentCard = pool[Math.floor(Math.random()*pool.length)];
  }
  
  els.cardTheme.textContent = gameState.currentCard.theme;
  els.cardTheme.className = `card-theme ${gameState.currentCard.theme.toLowerCase().replace(/é/g, 'e').replace(/ /g, '-')}`;
  els.cardSubject.textContent = gameState.currentCard.subject || '';
  
  els.cardModal.classList.remove('hidden');

  if (targetTheme === 'Débuter') {
    gameState.currentNote = 1; // So success advances us, wait, we intercept it in endTurn
    const qData = gameState.currentCard.questions[0];
    
    els.selectedNote.textContent = targetTheme;
    els.cardQuestion.textContent = qData ? qData.q : "Question introuvable";
    els.cardAnswer.textContent = qData ? qData.a : "Réponse introuvable";
    
    els.evalStep.classList.add('hidden');
    els.questionStep.classList.remove('hidden');
    els.answerStep.classList.add('hidden');
    
    // For Débuter, don't start the 30s timer, just show the button
    els.timerFill.style.width = '100%';
    
  } else if (SPECIAL_THEMES.includes(targetTheme) || !gameState.currentCard.questions[0].level) {
    // Direct to question
    gameState.currentNote = 1; // Default advance
    const qData = gameState.currentCard.questions[0];
    
    els.selectedNote.textContent = targetTheme;
    els.cardQuestion.textContent = qData ? qData.q : "Question introuvable";
    els.cardAnswer.textContent = qData ? qData.a : "Réponse introuvable";
    
    els.evalStep.classList.add('hidden');
    els.questionStep.classList.remove('hidden');
    els.answerStep.classList.add('hidden');
    
    startTimer();
  } else {
    // Normal 1-10 choice
    els.evalStep.classList.remove('hidden');
    els.questionStep.classList.add('hidden');
    els.answerStep.classList.add('hidden');
  }
}

function selectNote(note) {
  gameState.currentNote = note;
  const qData = gameState.currentCard.questions.find(q => parseInt(q.level) === note);
  
  els.selectedNote.textContent = `Niveau ${note}`;
  els.cardQuestion.textContent = qData ? qData.q : "Question introuvable";
  els.cardAnswer.textContent = qData ? qData.a : "Réponse introuvable";
  
  els.evalStep.classList.add('hidden');
  els.questionStep.classList.remove('hidden');
  
  startTimer();
}

function startTimer() {
  gameState.timeLeft = 30;
  els.timerFill.style.width = '100%';
  
  clearInterval(gameState.timer);
  gameState.timer = setInterval(() => {
    gameState.timeLeft--;
    els.timerFill.style.width = `${(gameState.timeLeft / 30) * 100}%`;
    if (gameState.timeLeft <= 0) clearInterval(gameState.timer);
  }, 1000);
}

function showAnswer() {
  clearInterval(gameState.timer);
  els.questionStep.classList.add('hidden');
  els.answerStep.classList.remove('hidden');
  
  const targetTheme = getSpaceTheme(gameState.teams[gameState.currentTeamIdx].pos);
  
  if (targetTheme === 'Débuter') {
    els.validationButtons.classList.remove('hidden');
    els.manualMoveUi.classList.add('hidden');
    els.failBtn.classList.add('hidden');
    els.successBtn.textContent = 'Aller au plateau !';
  } else if (SPECIAL_THEMES.includes(targetTheme) && targetTheme !== 'Gagner') {
    // For Challenge, Superbe => show manual move UI
    els.validationButtons.classList.add('hidden');
    els.manualMoveUi.classList.remove('hidden');
    els.manualMoveValue.textContent = '0';
    els.failBtn.classList.remove('hidden');
  } else if (targetTheme === 'Gagner') {
    // For Gagner => custom buttons
    els.validationButtons.classList.remove('hidden');
    els.manualMoveUi.classList.add('hidden');
    els.failBtn.textContent = 'Raté (Reste ici)';
    els.successBtn.textContent = 'Trouvé ! (GAGNÉ !)';
    els.failBtn.classList.remove('hidden');
  } else {
    // Normal card
    els.validationButtons.classList.remove('hidden');
    els.manualMoveUi.classList.add('hidden');
    els.failBtn.textContent = 'Raté (0 case)';
    els.successBtn.textContent = `Trouvé ! (+${gameState.currentNote})`;
    els.failBtn.classList.remove('hidden');
  }
}

function endTurn(moveBy) {
  els.cardModal.classList.add('hidden');
  
  const team = gameState.teams[gameState.currentTeamIdx];
  const isOnWinSpace = team.pos >= BOARD_TRACK.length - 1;
  const wasDebuter = els.selectedNote.textContent === 'Débuter';
  
  if (wasDebuter) {
    // Just dismissed the "Débuter" card. Normal game starts.
    return;
  }
  
  if (isOnWinSpace) {
    // Logic for Gagner space
    if (moveBy > 0) {
      window.MuchogamesMatch.finish({ won: true });
      els.boardScreen.classList.add('hidden');
      els.winScreen.classList.remove('hidden');
      els.winnerName.textContent = team.name;
      return;
    }
    // else fail => stays on win space
  } else {
    // Normal move
    team.pos += moveBy;
    if (team.pos < 1) team.pos = 1; // Can't go below 1
    if (team.pos >= BOARD_TRACK.length - 1) {
      team.pos = BOARD_TRACK.length - 1;
    }
  }
  
  gameState.currentTeamIdx = (gameState.currentTeamIdx + 1) % gameState.teams.length;
  renderBoard();
  updateTurn();
}

init();
