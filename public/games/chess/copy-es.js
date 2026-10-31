export const STRINGS = {
  title: "Ajedrez",
  pitch: "El rey de los juegos de tablero, contra el ordenador o a dos.",
  back: "Volver",
  options: "Opciones",
  close: "Cerrar",
  language: "Idioma",
  rules: "Reglas",
  sound: "Sonido",
  showMoves: "Jugadas posibles",
  hintOption: "Botón Pista",
  on: "Sí",
  off: "No",
  boardTheme: "Tablero",
  themeWood: "Madera",
  themeClassic: "Clásico",
  themeOcean: "Océano",
  mode: "Modo",
  modeSolo: "Contra el ordenador",
  modeDuo: "A dos",
  level: "Nivel",
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
  expert: "Experto",
  levelRecord: "Victorias: {won} · Tablas: {drawn} · Partidas: {played}",
  noRecord: "Aún sin jugar",
  color: "Tus piezas",
  white: "Blancas",
  black: "Negras",
  random: "Al azar",
  play: "Jugar",
  resume: "Reanudar la partida",
  you: "Tú",
  computer: "Ordenador · {level}",
  toPlay: "Le toca",
  thinking: "Pensando…",
  check: "¡Jaque!",
  lastMove: "jugó {move}",
  letters: "CATDR",
  undo: "Deshacer",
  hint: "Pista",
  quit: "Salir",
  win: "¡Victoria!",
  loss: "Derrota",
  draw: "Tablas",
  whiteWins: "¡Ganan las blancas!",
  blackWins: "¡Ganan las negras!",
  sideWhite: "blanco",
  sideBlack: "negro",
  checkmateLine: "Jaque mate: el rey {side} ya no puede escapar.",
  stalemateLine:
    "Rey ahogado: el jugador al que le toca no tiene jugadas y no está en jaque.",
  materialLine: "No quedan piezas suficientes para dar mate.",
  fiftyLine: "50 jugadas sin captura ni movimiento de peón.",
  repetitionLine: "La misma posición se ha repetido tres veces.",
  replay: "Jugar otra vez",
  changeSettings: "Cambiar ajustes",
  seeBoard: "Ver el tablero",
  board: "Tablero de ajedrez",
  promoteTo: "Coronar el peón como:",
  queen: "Dama",
  rook: "Torre",
  bishop: "Alfil",
  knight: "Caballo",
  cancel: "Cancelar",
  whitePawn: "peón blanco",
  whiteKnight: "caballo blanco",
  whiteBishop: "alfil blanco",
  whiteRook: "torre blanca",
  whiteQueen: "dama blanca",
  whiteKing: "rey blanco",
  blackPawn: "peón negro",
  blackKnight: "caballo negro",
  blackBishop: "alfil negro",
  blackRook: "torre negra",
  blackQueen: "dama negra",
  blackKing: "rey negro"
};

export const RULES = `<p>Cada jugador tiene 16 piezas. Empiezan las blancas. El objetivo: dar <strong>jaque mate</strong> al rey rival, es decir, atacarlo sin que pueda escapar.</p>
<ul>
<li><strong>Jugar:</strong> toca una pieza y luego una casilla resaltada, o arrástrala. Solo se proponen las jugadas permitidas.</li>
<li><strong>Rey:</strong> una casilla en cualquier dirección. Nunca puede ir a una casilla atacada.</li>
<li><strong>Dama:</strong> tantas casillas como quiera, en línea recta o en diagonal.</li>
<li><strong>Torre:</strong> en línea recta. <strong>Alfil:</strong> en diagonal. Ninguno puede saltar por encima de una pieza.</li>
<li><strong>Caballo:</strong> en «L» (dos casillas y luego una al lado). Es la única pieza que salta por encima de las demás.</li>
<li><strong>Peón:</strong> avanza una casilla (dos desde su casilla inicial) y captura en diagonal hacia delante. Al llegar al final, se convierte en la pieza que elijas (coronación).</li>
<li><strong>Captura:</strong> una pieza captura colocándose en la casilla de una pieza rival.</li>
<li><strong>Jaque:</strong> cuando tu rey está atacado, debes protegerlo enseguida.</li>
</ul>
<p><strong>Jugadas especiales:</strong> el <em>enroque</em> (el rey se desliza dos casillas hacia una torre, que salta a su otro lado, si ninguno se ha movido, el camino está libre y el rey no pasa por una casilla atacada — toca el rey y luego su casilla de llegada) y la <em>captura al paso</em> (un peón que acaba de avanzar dos casillas puede capturarse como si solo hubiera avanzado una).</p>
<p><strong>Tablas:</strong> rey ahogado (sin jugadas y sin estar en jaque), piezas insuficientes para dar mate, 50 jugadas sin captura ni movimiento de peón, o la misma posición tres veces.</p>
<p><strong>Ayudas:</strong> Deshacer anula tu última jugada, Pista muestra una buena jugada (actívala en las opciones). Una partida en curso se guarda: puedes reanudarla más tarde.</p>`;
