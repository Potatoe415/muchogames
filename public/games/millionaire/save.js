// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly. Everything read back is validated before use.
const SAVE_KEY = "millionaire-current";
const VERSION = 1;
const LIFELINE_KEYS = ["fiftyFifty", "audience", "phone", "swap"];
const MODALS = ["audience", "phone"];
const ANSWER_COUNT = 4;
// `lock` -1 means the timer ran out before an answer was locked.
const TIMED_OUT = -1;

export function encodeMatch(match) {
  const { question } = match;
  return JSON.stringify({
    v: VERSION,
    language: match.language,
    timerEnabled: match.timerEnabled,
    timeRemaining: match.timeRemaining,
    round: match.round,
    lifelines: { ...match.lifelines },
    lock: match.lock,
    modal: match.modal,
    question: {
      id: question.id,
      difficulty: question.difficulty,
      prompt: question.prompt,
      answers: question.answers.map(({ text, isCorrect, hidden }) => ({ text, isCorrect, hidden })),
      correctIndex: question.correctIndex,
      audience: question.audience ?? null,
      phoneText: question.phoneText ?? null
    }
  });
}

function isIntIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function validMeta(data, limits) {
  return (
    data?.v === VERSION &&
    limits.languages.includes(data.language) &&
    typeof data.timerEnabled === "boolean" &&
    isIntIn(data.timeRemaining, 0, limits.seconds) &&
    isIntIn(data.round, 0, limits.difficultyByRound.length - 1) &&
    LIFELINE_KEYS.every((key) => typeof data.lifelines?.[key] === "boolean") &&
    (data.modal === null || MODALS.includes(data.modal))
  );
}

function validAnswer(answer) {
  return typeof answer?.text === "string" && typeof answer.isCorrect === "boolean" && typeof answer.hidden === "boolean";
}

// One correct answer, never hidden; 50:50 hides exactly two wrong ones.
function validAnswers(question, lifelines) {
  const { answers } = question;
  if (!Array.isArray(answers) || answers.length !== ANSWER_COUNT || !answers.every(validAnswer)) return false;
  const correct = answers.filter((answer) => answer.isCorrect);
  const hiddenCount = answers.filter((answer) => answer.hidden).length;
  if (correct.length !== 1 || correct[0].hidden) return false;
  if (answers.indexOf(correct[0]) !== question.correctIndex) return false;
  return hiddenCount === 0 || (hiddenCount === 2 && !lifelines.fiftyFifty);
}

function validHints(question, lifelines) {
  const { audience, phoneText } = question;
  const audienceOk = audience === null || (!lifelines.audience && Array.isArray(audience) && audience.length === ANSWER_COUNT && audience.every((p) => isIntIn(p, -100, 100)));
  const phoneOk = phoneText === null || (!lifelines.phone && typeof phoneText === "string");
  return audienceOk && phoneOk;
}

function validQuestion(data, limits) {
  const { question } = data;
  return (
    typeof question?.id === "string" &&
    question.difficulty === limits.difficultyByRound[data.round] &&
    typeof question.prompt === "string" &&
    validAnswers(question, data.lifelines) &&
    validHints(question, data.lifelines)
  );
}

function validLock(data) {
  if (data.lock === null) return true;
  if (data.lock === TIMED_OUT) return data.timerEnabled;
  return isIntIn(data.lock, 0, ANSWER_COUNT - 1) && !data.question.answers[data.lock].hidden;
}

// `limits`: { languages, seconds, difficultyByRound } from the game config.
export function decodeMatch(text, limits) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!validMeta(data, limits) || !validQuestion(data, limits) || !validLock(data)) return null;
  return data;
}

export function loadMatch(limits) {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text === null) return null;
    const match = decodeMatch(text, limits);
    if (!match) localStorage.removeItem(SAVE_KEY);
    return match;
  } catch {
    return null;
  }
}

export function storeMatch(match) {
  try {
    localStorage.setItem(SAVE_KEY, encodeMatch(match));
  } catch {
    // Storage unavailable or full: the match only lasts for this visit.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
