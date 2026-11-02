export const STRINGS = {
  title: "Scrabble",
  words: "Idioma de las palabras",
  mixHelp:
    "Una palabra vale si existe en al menos uno de los idiomas marcados.",
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
  vsComputer: "Contra el ordenador",
  onOneDevice: "{n} jugadores en el mismo dispositivo",
  level: "Nivel",
  junior: "Junior",
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
  expert: "Experto",
  levelRecord: "Victorias en este nivel: {won} de {played}",
  noRecord: "Aún no hay partidas en este nivel",
  players: "Jugadores",
  names: "Nombres",
  player1: "Jugador 1",
  player2: "Jugador 2",
  player3: "Jugador 3",
  player4: "Jugador 4",
  start: "Empezar",
  you: "Tú",
  computer: "Ordenador",
  bag: "Bolsa",
  shuffle: "Mezclar",
  recall: "Recoger",
  hint: "Pista",
  pass: "Pasar",
  define: "Definir",
  lookupHint: "Toca una palabra del tablero para ver su definición.",
  defLoading: "Buscando la definición…",
  defMissing: "No se encontró ninguna definición.",
  defError: "Definición no disponible (¿conexión?).",
  defSource: "Ver en Wikcionario ↗",
  defLicense: "Definiciones: Wikcionario, licencia CC BY-SA 4.0",
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
  swapHelpJunior:
    "Una sola letra: la cambias y juegas igualmente. Varias: pasas tu turno.",
  swapOneConfirm: "Cambiar 1 letra y jugar",
  swapNone: "Menos de 7 letras en la bolsa: ya no se puede cambiar.",
  swapConfirm: "Cambiar ({count})",
  passConfirm: "Pasar mi turno",
  bagTitle: "Letras restantes",
  bagSummary: "{bag} en la bolsa · {unseen} sin ver (bolsa + rivales)",
  handoffTitle: "Turno de {name}",
  handoffHint: "Pasa el dispositivo y toca el botón.",
  handoffButton: "Ver mis letras",
  win: "¡Victoria!",
  loss: "Derrota",
  draw: "Empate",
  nameWins: "¡{name} gana!",
  endOut: "{name} colocó todas sus letras.",
  endBlocked: "Dos turnos sin puntos cada uno: la partida termina.",
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
  <li>De 1 a 4 jugadores: solo contra el ordenador, o de 2 a 4 en el mismo dispositivo (se pasa en cada turno).</li>
  <li>Cada jugador tiene 7 letras. En tu turno, pon una o varias letras en una misma fila o columna, sin huecos, tocando las palabras ya colocadas.</li>
  <li>La primera palabra pasa por la estrella ★ del centro.</li>
  <li>Todas las palabras formadas deben estar en el diccionario de uno de los idiomas elegidos: el juego lo comprueba antes de validar, sin penalización. Francés: Officiel du Scrabble (ODS 9). Inglés: ENABLE. Español: lista libre de 635 000 palabras.</li>
  <li>Los acentos no cuentan. En español, la Ñ es una letra propia; CH, LL y RR se escriben con dos letras. Cada idioma tiene sus propias letras y valores.</li>
  <li><strong>Junior</strong> (contra el ordenador, desde 7 años): las reglas de la cara 2 del Scrabble Junior. Tablero pequeño, bolsa de 60 fichas, 5 letras cada uno y las letras del ordenador están a la vista. Solo puntúan las casillas de color: verde 1, azul 2, rosa 3 por cada letra colocada encima (el valor de las letras no cuenta). Al empezar tu turno puedes cambiar 1 letra y jugar igualmente, o pasar para cambiar varias. No se resta nada al final. El botón Pista siempre está y las letras que robas son más fáciles.</li>
  <li><strong>Varios idiomas:</strong> marca FR, EN y/o ES. Una palabra se acepta si existe en al menos uno de los idiomas marcados, para todos, ordenador incluido. Con el español, la bolsa tiene todas las letras y la Ñ (valores franceses); francés + inglés usa la bolsa francesa.</li>
  <li><strong>Puntos:</strong> cada letra tiene su valor. LD y LT doblan o triplican la letra, PD y PT la palabra entera (la estrella cuenta como PD). Una casilla solo cuenta cuando se cubre por primera vez.</li>
  <li>El <strong>comodín</strong> sustituye cualquier letra y vale 0.</li>
  <li><strong>Scrabble:</strong> colocar las 7 letras de una vez da 50 puntos extra.</li>
  <li>En lugar de jugar puedes <strong>cambiar</strong> letras (si quedan al menos 7 en la bolsa) o <strong>pasar</strong>.</li>
  <li><strong>Fin:</strong> cuando la bolsa está vacía y un jugador ha colocado todas sus letras, o cuando cada jugador ha pasado o cambiado dos veces seguidas. Las letras restantes se restan; quien terminó gana las de los demás.</li>
</ul>
<p><strong>Controles:</strong> toca una letra y luego una casilla, o arrástrala. Toca una letra colocada para recuperarla. Truco: toca una casilla vacía (aparece una flecha, tócala otra vez para girarla) y luego tus letras seguidas. Teclado: escribe las letras, Intro para jugar, Retroceso para quitar, Escape para recoger todo.</p>
<p><strong>Definir:</strong> toca el libro y luego una palabra del tablero para leer una definición corta (Wikcionario; palabras francesas incluidas en el juego, otros idiomas requieren conexión).</p>
`;
