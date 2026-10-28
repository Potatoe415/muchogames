// Rules shown in the options panel, FR/EN/ES.
const RULES = {
  fr: `<p>Complétez la grille de 9×9 cases : chaque ligne, chaque colonne et chaque carré de 3×3 doit contenir tous les chiffres de 1 à 9, sans répétition. Chaque grille n'a qu'une seule solution.</p>
<ul>
<li>Touchez une case, puis un chiffre du pavé. Retouchez le même chiffre pour l'enlever.</li>
<li><strong>Notes</strong> : activez-les pour noter de petits chiffres candidats dans une case. Ils s'effacent seuls quand vous placez ce chiffre dans la ligne, la colonne ou le carré.</li>
<li><strong>Indice</strong> : révèle la case choisie (ou une case au hasard). <strong>Annuler</strong> revient en arrière, coup par coup.</li>
<li>Le pavé indique combien de chaque chiffre il reste à placer. Les erreurs s'affichent en rouge (désactivable dans les options).</li>
<li>Au clavier : chiffres 1 à 9, flèches pour se déplacer, Retour arrière pour effacer, N pour les notes, Z pour annuler, H pour un indice, P pour la pause.</li>
<li>Votre partie est sauvegardée : vous pouvez la reprendre plus tard. Battez votre record de temps à chaque niveau !</li>
</ul>`,
  en: `<p>Complete the 9×9 grid: every row, every column and every 3×3 box must hold all the digits 1 to 9, with no repeats. Each grid has exactly one solution.</p>
<ul>
<li>Tap a cell, then a digit on the pad. Tap the same digit again to remove it.</li>
<li><strong>Notes</strong>: turn them on to pencil small candidate digits into a cell. They clear themselves when you place that digit in the row, column or box.</li>
<li><strong>Hint</strong>: reveals the chosen cell (or a random one). <strong>Undo</strong> steps back one move at a time.</li>
<li>The pad shows how many of each digit are left to place. Mistakes show in red (can be turned off in the options).</li>
<li>Keyboard: digits 1 to 9, arrows to move, Backspace to erase, N for notes, Z to undo, H for a hint, P to pause.</li>
<li>Your game is saved, so you can resume it later. Beat your best time on each level!</li>
</ul>`,
  es: `<p>Completa la cuadrícula de 9×9: cada fila, cada columna y cada cuadro de 3×3 debe contener todas las cifras del 1 al 9, sin repetir. Cada cuadrícula tiene una sola solución.</p>
<ul>
<li>Toca una casilla y luego una cifra del teclado. Vuelve a tocar la misma cifra para quitarla.</li>
<li><strong>Notas</strong>: actívalas para apuntar cifras candidatas pequeñas en una casilla. Se borran solas cuando colocas esa cifra en la fila, la columna o el cuadro.</li>
<li><strong>Pista</strong>: revela la casilla elegida (o una al azar). <strong>Deshacer</strong> vuelve atrás jugada a jugada.</li>
<li>El teclado indica cuántas cifras de cada tipo quedan por colocar. Los errores se ven en rojo (se puede desactivar en las opciones).</li>
<li>Con el teclado: cifras del 1 al 9, flechas para moverse, Retroceso para borrar, N para las notas, Z para deshacer, H para una pista, P para la pausa.</li>
<li>Tu partida se guarda: puedes reanudarla más tarde. ¡Bate tu mejor tiempo en cada nivel!</li>
</ul>`
};

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
