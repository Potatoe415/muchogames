// Rules HTML per language, shown in the collapsed rules section.
const RULES = {
  fr: `
    <p>De 1 à 6 joueurs sur le même appareil. Tous les pions partent du centre.</p>
    <ul>
      <li>Lancez le dé et avancez du nombre exact de cases, dans le sens de votre choix, sans repasser par la même case.</li>
      <li>La couleur de la case donne la catégorie : <b>bleu</b> Géographie, <b>rose</b> Divertissement, <b>jaune</b> Histoire, <b>violet</b> Arts et littérature, <b>vert</b> Sciences et nature, <b>orange</b> Sports et loisirs.</li>
      <li>Répondez à voix haute, puis touchez « Voir la réponse » et indiquez honnêtement si c'était juste.</li>
      <li>Bonne réponse : vous rejouez. Mauvaise réponse : au joueur suivant.</li>
      <li>Une bonne réponse sur une case camembert (au bout d'un rayon) vous donne le camembert de cette couleur.</li>
      <li>Case « Rejouez » (dé) : relancez le dé.</li>
      <li>Au centre sans les 6 camemberts : vous choisissez la catégorie.</li>
      <li>Avec les 6 camemberts, rejoignez le centre au compte exact : les adversaires choisissent la catégorie de la question finale. Bonne réponse : vous gagnez.</li>
    </ul>
    <p><b>Partie rapide</b> : chaque bonne réponse donne le camembert de sa catégorie, sur n'importe quelle case. La question finale au centre reste obligatoire.</p>
    <p>« Autre question » remplace une question illisible ou déjà connue, sans pénalité.</p>`,
  en: `
    <p>1 to 6 players on one device. Every pawn starts in the middle.</p>
    <ul>
      <li>Roll the die and move exactly that many spaces, in any direction, without passing the same space twice.</li>
      <li>The space colour gives the category: <b>blue</b> Geography, <b>pink</b> Entertainment, <b>yellow</b> History, <b>purple</b> Arts &amp; Literature, <b>green</b> Science &amp; Nature, <b>orange</b> Sports &amp; Leisure.</li>
      <li>Answer out loud, then tap “Show the answer” and say honestly whether you were right.</li>
      <li>Right answer: play again. Wrong answer: next player.</li>
      <li>A right answer on a wedge space (at the end of a spoke) wins the wedge of that colour.</li>
      <li>“Roll again” space (die): roll once more.</li>
      <li>In the middle without all 6 wedges: you pick the category.</li>
      <li>With all 6 wedges, reach the middle by exact count: the opponents pick the category of the final question. Right answer: you win.</li>
    </ul>
    <p><b>Quick game</b>: every right answer wins the wedge of its category, on any space. The final question in the middle is still required.</p>
    <p>Questions are in French only for now. “Another question” swaps an unreadable or known question, no penalty.</p>`,
  es: `
    <p>De 1 a 6 jugadores en el mismo dispositivo. Todas las fichas salen del centro.</p>
    <ul>
      <li>Tira el dado y avanza el número exacto de casillas, en la dirección que quieras, sin pasar dos veces por la misma casilla.</li>
      <li>El color de la casilla da la categoría: <b>azul</b> Geografía, <b>rosa</b> Entretenimiento, <b>amarillo</b> Historia, <b>violeta</b> Arte y literatura, <b>verde</b> Ciencia y naturaleza, <b>naranja</b> Deportes y ocio.</li>
      <li>Responde en voz alta, toca «Ver la respuesta» y di con sinceridad si acertaste.</li>
      <li>Respuesta correcta: vuelves a jugar. Incorrecta: turno del siguiente.</li>
      <li>Acertar en una casilla de quesito (al final de un radio) te da el quesito de ese color.</li>
      <li>Casilla «Vuelve a tirar» (dado): tira otra vez.</li>
      <li>En el centro sin los 6 quesitos: eliges la categoría.</li>
      <li>Con los 6 quesitos, llega al centro con el número exacto: los rivales eligen la categoría de la pregunta final. Si aciertas, ganas.</li>
    </ul>
    <p><b>Partida rápida</b>: cada acierto da el quesito de su categoría, en cualquier casilla. La pregunta final en el centro sigue siendo obligatoria.</p>
    <p>Por ahora las preguntas solo están en francés. «Otra pregunta» cambia una pregunta ilegible o conocida, sin penalización.</p>`
};

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
