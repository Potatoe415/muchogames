export const STRINGS = {
  title: "Scrabble",
  pitch:
    "El juego de letras, en francés, inglés o español. Contra el ordenador o entre dos.",
  words: "Idioma de las palabras",
  back: "Volver",
  options: "Opciones",
  close: "Cerrar",
  language: "Idioma",
  sound: "Sonido",
  on: "Sí",
  off: "No",
  hintOption: "Botón Pista",
  rules: "Reglas",
  dictLoading: "Cargando el diccionario…",
  dictError: "No se pudo cargar el diccionario.",
  retry: "Reintentar",
  resume: "Reanudar la partida",
  mode: "Modo",
  modeSolo: "Contra el ordenador",
  modeDuo: "Entre dos",
  level: "Nivel",
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
  expert: "Experto",
  levelRecord: "Victorias en este nivel: {won} de {played}",
  noRecord: "Aún no hay partidas en este nivel",
  players: "Jugadores",
  player1: "Jugador 1",
  player2: "Jugador 2",
  start: "Empezar",
  you: "Tú",
  computer: "Ordenador",
  bag: "Bolsa",
  shuffle: "Mezclar",
  recall: "Recoger",
  hint: "Pista",
  pass: "Pasar",
  quit: "Salir",
  playWord: "Jugar",
  firstTurn:
    "Primera palabra: pasa por la estrella ★. Toca una letra y luego una casilla.",
  yourTurn: "¡Tu turno! Pon letras en el tablero.",
  turnOf: "Turno de {name}.",
  thinking: "{name} está pensando…",
  err_line: "Las letras deben estar en una misma línea.",
  err_gap: "No puede haber casillas vacías dentro de la palabra.",
  err_center: "La primera palabra debe pasar por la estrella ★.",
  err_short: "Hacen falta al menos dos letras.",
  err_detached: "La palabra debe tocar una letra ya colocada.",
  badWord: "«{word}» no está en el diccionario.",
  okWord: "{words} · {score} pts",
  bingo: "¡Scrabble! +50",
  lastPlay: "{name}: {word} · {score} pts",
  lastSwap: "{name} cambió {count} letra(s).",
  lastPass: "{name} pasó su turno.",
  noMove: "Ninguna palabra posible: cambia letras o pasa.",
  blankTitle: "¿Qué letra para el comodín?",
  cancel: "Cancelar",
  swapTitle: "Cambiar o pasar",
  swapHelp: "Toca las letras que vuelven a la bolsa.",
  swapNone: "Menos de 7 letras en la bolsa: ya no se puede cambiar.",
  swapConfirm: "Cambiar ({count})",
  passConfirm: "Pasar mi turno",
  bagTitle: "Letras restantes",
  bagSummary: "{bag} en la bolsa · {unseen} sin ver (bolsa + rival)",
  handoffTitle: "Turno de {name}",
  handoffHint: "Pasa el dispositivo y toca el botón.",
  handoffButton: "Ver mis letras",
  win: "¡Victoria!",
  loss: "Derrota",
  draw: "Empate",
  nameWins: "¡{name} gana!",
  endOut: "{name} colocó todas sus letras.",
  endBlocked: "Cuatro turnos sin puntos: la partida termina.",
  endPlayer: "{name}: {score} pts ({adjust} al final)",
  bestWord: "Mejor palabra: {word} ({score} pts)",
  replay: "Jugar otra vez",
  changeSettings: "Cambiar ajustes",
  seeBoard: "Ver el tablero",
  premTW: "PT",
  premDW: "PD",
  premTL: "LT",
  premDL: "LD"
};

export const RULES = `
<p><strong>Objetivo:</strong> sumar más puntos formando palabras en la cuadrícula, como un crucigrama.</p>
<ul>
  <li>Cada jugador tiene 7 letras. En tu turno, pon una o varias letras en una misma fila o columna, sin huecos, tocando las palabras ya colocadas.</li>
  <li>La primera palabra pasa por la estrella ★ del centro.</li>
  <li>Todas las palabras formadas deben estar en el diccionario del idioma elegido: el juego lo comprueba antes de validar, sin penalización. Francés: Officiel du Scrabble (ODS 9). Inglés: ENABLE. Español: lista libre de 635 000 palabras.</li>
  <li>Los acentos no cuentan. En español, la Ñ es una letra propia; CH, LL y RR se escriben con dos letras. Cada idioma tiene sus propias letras y valores.</li>
  <li><strong>Puntos:</strong> cada letra tiene su valor. LD y LT doblan o triplican la letra, PD y PT la palabra entera (la estrella cuenta como PD). Una casilla solo cuenta cuando se cubre por primera vez.</li>
  <li>El <strong>comodín</strong> sustituye cualquier letra y vale 0.</li>
  <li><strong>Scrabble:</strong> colocar las 7 letras de una vez da 50 puntos extra.</li>
  <li>En lugar de jugar puedes <strong>cambiar</strong> letras (si quedan al menos 7 en la bolsa) o <strong>pasar</strong>.</li>
  <li><strong>Fin:</strong> cuando la bolsa está vacía y un jugador ha colocado todas sus letras, o tras 4 turnos seguidos sin puntos. Las letras restantes se restan; quien terminó gana las del rival.</li>
</ul>
<p><strong>Controles:</strong> toca una letra y luego una casilla, o arrástrala. Toca una letra colocada para recuperarla. Truco: toca una casilla vacía (aparece una flecha, tócala otra vez para girarla) y luego tus letras seguidas. Teclado: escribe las letras, Intro para jugar, Retroceso para quitar, Escape para recoger todo.</p>
`;
