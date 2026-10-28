export const STRINGS = {
  title: "Jeu de dames",
  pitch: "Le grand classique, contre l'ordinateur ou à deux.",
  back: "Retour",
  options: "Options",
  close: "Fermer",
  language: "Langue",
  rules: "Règles",
  sound: "Son",
  showMoves: "Coups possibles",
  on: "Oui",
  off: "Non",
  boardTheme: "Plateau",
  themeWood: "Bois",
  themeClassic: "Classique",
  themeOcean: "Océan",
  mode: "Mode",
  modeSolo: "Contre l'ordinateur",
  modeDuo: "À deux",
  level: "Niveau",
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  expert: "Expert",
  levelRecord: "Victoires : {won}/{played}",
  noRecord: "Pas encore joué",
  color: "Vos pions",
  light: "Blancs",
  dark: "Noirs",
  random: "Au hasard",
  variant: "Règle",
  international: "Internationale 10×10",
  english: "Anglaise 8×8",
  play: "Jouer",
  resume: "Reprendre la partie",
  you: "Vous",
  computer: "Ordinateur · {level}",
  toPlay: "À jouer",
  thinking: "Réfléchit…",
  mustCapture: "Prise obligatoire !",
  lastMove: "a joué {move}",
  pieces: "Pions {men} · Dames {kings}",
  undo: "Annuler",
  hint: "Indice",
  quit: "Quitter",
  win: "Victoire !",
  loss: "Défaite",
  draw: "Match nul",
  lightWins: "Les blancs gagnent !",
  darkWins: "Les noirs gagnent !",
  sideLight: "blancs",
  sideDark: "noirs",
  blockedLine: "Plus aucun coup possible pour les {side}.",
  capturedLine: "Les {side} n'ont plus aucune pièce.",
  quietLine: "Trop de coups de dames sans prise.",
  repetitionLine: "La même position est revenue trois fois.",
  replay: "Rejouer",
  changeSettings: "Changer les réglages",
  seeBoard: "Voir le plateau",
  board: "Damier",
  square: "Case {n}",
  lightMan: "pion blanc",
  darkMan: "pion noir",
  lightKing: "dame blanche",
  darkKing: "dame noire"
};

export const RULES = `<p>Chaque joueur déplace ses pions en diagonale, sur les cases foncées. Le but : prendre toutes les pièces adverses ou les bloquer.</p>
<ul>
<li><strong>Jouer :</strong> touchez un pion puis une case en surbrillance, ou faites-le glisser. Seuls les pions qui peuvent jouer sont proposés.</li>
<li><strong>Déplacement :</strong> un pion avance d'une case en diagonale.</li>
<li><strong>Prise :</strong> sautez par-dessus une pièce adverse voisine pour atterrir juste derrière. Plusieurs prises peuvent s'enchaîner dans le même coup (rafle). La prise est obligatoire.</li>
<li><strong>Dame :</strong> un pion qui termine son coup sur la dernière rangée devient une dame (couronne). Elle se déplace en avant et en arrière.</li>
<li><strong>Fin :</strong> le joueur qui ne peut plus jouer a perdu. La partie est nulle si la même position revient trois fois, ou après une longue série de coups de dames sans prise.</li>
</ul>
<p><strong>Règle internationale (10×10)</strong> : les blancs commencent. Les pions prennent aussi en arrière. Les dames volent sur toute la diagonale. Il faut prendre le plus grand nombre de pièces possible. Un pion qui passe sur la dernière rangée pendant une rafle sans s'y arrêter reste un pion.</p>
<p><strong>Règle anglaise (8×8)</strong> : les noirs commencent. Les pions ne prennent qu'en avant. Les dames n'avancent que d'une case. On choisit librement sa prise, mais une rafle commencée doit être terminée. Un pion qui devient dame termine son coup.</p>
<p><strong>Aides :</strong> Annuler reprend votre dernier coup, Indice montre un bon coup. Une partie en cours est gardée : vous pouvez la reprendre plus tard.</p>`;
