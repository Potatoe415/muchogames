// Game logic for TTMC
const THEMES = ['Improbable', 'Mature', 'Plaisir', 'Scolaire'];

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
  failBtn: document.getElementById('failBtn'),
  successBtn: document.getElementById('successBtn'),
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
  els.failBtn.addEventListener('click', () => endTurn(false));
  els.successBtn.addEventListener('click', () => endTurn(true));
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
    pos: 0
  }));
  
  els.setupScreen.classList.add('hidden');
  els.boardScreen.classList.remove('hidden');
  
  renderBoard();
  updateTurn();
}

function renderBoard() {
  els.boardTrack.innerHTML = '';
  for (let i = 0; i <= gameState.boardSize; i++) {
    const space = document.createElement('div');
    space.className = 'board-space';
    if (i === 0) space.textContent = 'D';
    else if (i === gameState.boardSize) space.textContent = 'F';
    else {
      const theme = THEMES[(i-1) % THEMES.length];
      space.classList.add(theme.toLowerCase());
    }
    
    // Add tokens
    gameState.teams.forEach(t => {
      if (t.pos === i) {
        const token = document.createElement('div');
        token.className = `team-token t${t.id}`;
        space.appendChild(token);
      }
    });
    
    els.boardTrack.appendChild(space);
  }
}

function updateTurn() {
  const team = gameState.teams[gameState.currentTeamIdx];
  els.turnIndicator.textContent = `Tour de : ${team.name}`;
}

function getSpaceTheme(pos) {
  if (pos === 0) return 'Improbable';
  if (pos >= gameState.boardSize) return 'Win';
  return THEMES[(pos-1) % THEMES.length];
}

function drawCard() {
  const pos = gameState.teams[gameState.currentTeamIdx].pos;
  const targetTheme = getSpaceTheme(pos) === 'Win' ? THEMES[Math.floor(Math.random()*THEMES.length)] : getSpaceTheme(pos);
  
  const pool = gameState.cards.filter(c => c.theme.toLowerCase() === targetTheme.toLowerCase());
  if (pool.length === 0) {
    gameState.currentCard = gameState.cards[Math.floor(Math.random()*gameState.cards.length)];
  } else {
    gameState.currentCard = pool[Math.floor(Math.random()*pool.length)];
  }
  
  els.cardTheme.textContent = gameState.currentCard.theme;
  els.cardTheme.className = `card-theme ${gameState.currentCard.theme.toLowerCase()}`;
  els.cardSubject.textContent = gameState.currentCard.subject;
  
  els.evalStep.classList.remove('hidden');
  els.questionStep.classList.add('hidden');
  els.answerStep.classList.add('hidden');
  
  els.cardModal.classList.remove('hidden');
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
}

function endTurn(success) {
  els.cardModal.classList.add('hidden');
  
  if (success) {
    const team = gameState.teams[gameState.currentTeamIdx];
    team.pos += gameState.currentNote;
    if (team.pos >= gameState.boardSize) {
      team.pos = gameState.boardSize;
      window.MuchogamesMatch.finish({ won: true });
      els.boardScreen.classList.add('hidden');
      els.winScreen.classList.remove('hidden');
      els.winnerName.textContent = team.name;
      return;
    }
  }
  
  gameState.currentTeamIdx = (gameState.currentTeamIdx + 1) % gameState.teams.length;
  renderBoard();
  updateTurn();
}

init();
