// FR/EN/ES fruit names, "how to play" pages and the rules of the options
// panel. Static copy only: RULES is trusted HTML.
import { DANGER_LIMIT, SWEEPS, UNDOS } from "./world.js";

export const FRUIT_NAMES = {
  fr: [
    "Myrtille",
    "Fraise",
    "Framboise",
    "Pêche",
    "Citron",
    "Prune",
    "Orange",
    "Pomme",
    "Ananas",
    "Melon",
    "Pastèque"
  ],
  en: [
    "Blueberry",
    "Strawberry",
    "Raspberry",
    "Peach",
    "Lemon",
    "Plum",
    "Orange",
    "Apple",
    "Pineapple",
    "Melon",
    "Watermelon"
  ],
  es: [
    "Arándano",
    "Fresa",
    "Frambuesa",
    "Melocotón",
    "Limón",
    "Ciruela",
    "Naranja",
    "Manzana",
    "Piña",
    "Melón",
    "Sandía"
  ]
};

export const TIPS = {
  fr: [
    "Glisse pour viser, lâche pour faire tomber le fruit",
    "Combine deux fruits identiques pour créer un fruit plus gros",
    "Si le tas de fruits dépasse la ligne rouge, tu perds",
    "Tu peux balayer les plus petits fruits pour t'aider",
    "Ou annuler ton dernier fruit si tu veux",
    "En combinant 2 pastèques, elles disparaissent toutes les deux",
    "Ici tu vois les 3 prochains fruits qui tomberont",
    "Ici tu vois quel fruit apparaît quand 2 fruits identiques fusionnent"
  ],
  en: [
    "Slide to aim, release to drop the fruit",
    "Join two identical fruits to make a bigger one",
    "If the pile goes past the red line, you lose",
    "You can sweep away the smallest fruits to help you",
    "Or undo your last fruit if you like",
    "Join 2 watermelons and both of them vanish",
    "Here you see the next 3 fruits to fall",
    "Here you see which fruit comes out when 2 identical fruits merge"
  ],
  es: [
    "Desliza para apuntar, suelta para dejar caer la fruta",
    "Junta dos frutas iguales para crear una más grande",
    "Si el montón pasa la línea roja, pierdes",
    "Puedes barrer las frutas más pequeñas para ayudarte",
    "O deshacer tu última fruta si quieres",
    "Al juntar 2 sandías, desaparecen las dos",
    "Aquí ves las 3 próximas frutas que caerán",
    "Aquí ves qué fruta sale cuando se fusionan 2 frutas iguales"
  ]
};

export const RULES = {
  fr: `<p>Fais tomber les fruits dans la caisse. Deux fruits identiques qui se touchent fusionnent en un fruit plus gros, de la myrtille jusqu'à la pastèque. Deux pastèques disparaissent toutes les deux.</p>
<ul>
<li>Viser : glisse le doigt ou la souris, ou ←/→. Lâcher : relâche, clique, ou Entrée.</li>
<li>Chaque fusion rapporte des points, d'autant plus que le fruit est gros. Deux pastèques : 100 points.</li>
<li>🧹 Balai (${SWEEPS} par partie) : enlève toutes les myrtilles et fraises.</li>
<li>↶ Annuler (${UNDOS} par partie) : reprend le dernier fruit lâché.</li>
<li>Si un fruit reste au-dessus de la ligne rouge pendant ${DANGER_LIMIT} secondes, la partie est finie.</li>
</ul>`,
  en: `<p>Drop the fruits into the crate. Two identical fruits that touch merge into a bigger one, from the blueberry up to the watermelon. Two watermelons both vanish.</p>
<ul>
<li>Aim: slide your finger or the mouse, or ←/→. Drop: release, click, or Enter.</li>
<li>Every merge scores points, more for bigger fruits. Two watermelons: 100 points.</li>
<li>🧹 Broom (${SWEEPS} per game): removes every blueberry and strawberry.</li>
<li>↶ Undo (${UNDOS} per game): takes back the last fruit dropped.</li>
<li>If a fruit stays above the red line for ${DANGER_LIMIT} seconds, the game is over.</li>
</ul>`,
  es: `<p>Deja caer las frutas en la caja. Dos frutas iguales que se tocan se fusionan en una más grande, del arándano a la sandía. Dos sandías desaparecen las dos.</p>
<ul>
<li>Apuntar: desliza el dedo o el ratón, o ←/→. Soltar: suelta, haz clic, o Intro.</li>
<li>Cada fusión da puntos, más cuanto más grande es la fruta. Dos sandías: 100 puntos.</li>
<li>🧹 Escoba (${SWEEPS} por partida): quita todos los arándanos y fresas.</li>
<li>↶ Deshacer (${UNDOS} por partida): recupera la última fruta soltada.</li>
<li>Si una fruta se queda encima de la línea roja ${DANGER_LIMIT} segundos, se acaba la partida.</li>
</ul>`
};
