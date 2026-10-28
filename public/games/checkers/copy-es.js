export const STRINGS = {
  title: "Damas",
  pitch: "El gran clásico, contra el ordenador o entre dos.",
  back: "Volver",
  options: "Opciones",
  close: "Cerrar",
  language: "Idioma",
  rules: "Reglas",
  sound: "Sonido",
  showMoves: "Mostrar jugadas posibles",
  on: "Sí",
  off: "No",
  boardTheme: "Tablero",
  themeWood: "Madera",
  themeClassic: "Clásico",
  themeOcean: "Océano",
  mode: "Modo",
  modeSolo: "Contra el ordenador",
  modeDuo: "Dos jugadores",
  level: "Nivel",
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
  expert: "Experto",
  levelRecord: "Victorias: {won}/{played}",
  noRecord: "Aún sin jugar",
  color: "Tus fichas",
  light: "Blancas",
  dark: "Negras",
  random: "Al azar",
  variant: "Reglamento",
  international: "Internacional 10×10",
  english: "Inglesa 8×8",
  play: "Jugar",
  resume: "Reanudar la partida",
  you: "Tú",
  computer: "Ordenador · {level}",
  toPlay: "Le toca",
  thinking: "Pensando…",
  mustCapture: "¡Captura obligatoria!",
  lastMove: "jugó {move}",
  pieces: "Peones {men} · Damas {kings}",
  undo: "Deshacer",
  hint: "Pista",
  quit: "Salir",
  win: "¡Has ganado!",
  loss: "Has perdido",
  draw: "Tablas",
  lightWins: "¡Ganan las blancas!",
  darkWins: "¡Ganan las negras!",
  sideLight: "blancas",
  sideDark: "negras",
  blockedLine: "Las {side} ya no tienen ninguna jugada.",
  capturedLine: "Las {side} ya no tienen piezas.",
  quietLine: "Demasiadas jugadas de damas sin captura.",
  repetitionLine: "La misma posición se ha repetido tres veces.",
  replay: "Jugar de nuevo",
  changeSettings: "Cambiar los ajustes",
  seeBoard: "Ver el tablero",
  board: "Tablero",
  square: "Casilla {n}",
  lightMan: "peón blanco",
  darkMan: "peón negro",
  lightKing: "dama blanca",
  darkKing: "dama negra"
};

export const RULES = `<p>Cada jugador mueve sus fichas en diagonal, por las casillas oscuras. El objetivo: capturar todas las piezas rivales o dejarlas sin jugada.</p>
<ul>
<li><strong>Jugar:</strong> toca una ficha y luego una casilla resaltada, o arrástrala. Solo se proponen las fichas que pueden jugar.</li>
<li><strong>Movimiento:</strong> un peón avanza una casilla en diagonal.</li>
<li><strong>Captura:</strong> salta por encima de una pieza rival vecina para caer justo detrás. Se pueden encadenar varias capturas en la misma jugada. Capturar es obligatorio.</li>
<li><strong>Dama:</strong> un peón que termina su jugada en la última fila se convierte en dama (corona). Se mueve hacia delante y hacia atrás.</li>
<li><strong>Final:</strong> quien ya no puede jugar pierde. Hay tablas si la misma posición se repite tres veces, o tras una larga serie de jugadas de damas sin captura.</li>
</ul>
<p><strong>Reglamento internacional (10×10)</strong>: empiezan las blancas. Los peones también capturan hacia atrás. Las damas recorren toda la diagonal. Hay que capturar el mayor número de piezas posible. Un peón que pasa por la última fila durante una captura sin detenerse sigue siendo peón.</p>
<p><strong>Reglamento inglés (8×8)</strong>: empiezan las negras. Los peones solo capturan hacia delante. Las damas avanzan una sola casilla. Se elige libremente la captura, pero una vez empezada hay que terminarla. Un peón que corona termina su jugada.</p>
<p><strong>Ayudas:</strong> Deshacer anula tu última jugada, Pista muestra una buena jugada. Una partida en curso se guarda: puedes reanudarla más tarde.</p>`;
