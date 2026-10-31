export const STRINGS = {
  title: "Échecs",
  pitch: "Le roi des jeux de plateau, contre l'ordinateur ou à deux.",
  back: "Retour",
  options: "Options",
  close: "Fermer",
  language: "Langue",
  rules: "Règles",
  sound: "Son",
  showMoves: "Coups possibles",
  hintOption: "Bouton Indice",
  on: "Oui",
  off: "Non",
  boardTheme: "Échiquier",
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
  levelRecord: "Victoires : {won} · Nuls : {drawn} · Parties : {played}",
  noRecord: "Pas encore joué",
  color: "Vos pièces",
  white: "Blancs",
  black: "Noirs",
  random: "Au hasard",
  play: "Jouer",
  resume: "Reprendre la partie",
  you: "Vous",
  computer: "Ordinateur · {level}",
  toPlay: "À jouer",
  thinking: "Réfléchit…",
  check: "Échec !",
  lastMove: "a joué {move}",
  letters: "CFTDR",
  undo: "Annuler",
  hint: "Indice",
  quit: "Quitter",
  win: "Victoire !",
  loss: "Défaite",
  draw: "Partie nulle",
  whiteWins: "Les blancs gagnent !",
  blackWins: "Les noirs gagnent !",
  sideWhite: "blanc",
  sideBlack: "noir",
  checkmateLine: "Échec et mat : le roi {side} ne peut plus s'échapper.",
  stalemateLine:
    "Pat : le joueur au trait n'a plus aucun coup, sans être en échec.",
  materialLine: "Plus assez de pièces pour faire mat.",
  fiftyLine: "50 coups sans prise ni mouvement de pion.",
  repetitionLine: "La même position est revenue trois fois.",
  replay: "Rejouer",
  changeSettings: "Changer les réglages",
  seeBoard: "Voir l'échiquier",
  board: "Échiquier",
  promoteTo: "Promouvoir le pion en :",
  queen: "Dame",
  rook: "Tour",
  bishop: "Fou",
  knight: "Cavalier",
  cancel: "Annuler",
  whitePawn: "pion blanc",
  whiteKnight: "cavalier blanc",
  whiteBishop: "fou blanc",
  whiteRook: "tour blanche",
  whiteQueen: "dame blanche",
  whiteKing: "roi blanc",
  blackPawn: "pion noir",
  blackKnight: "cavalier noir",
  blackBishop: "fou noir",
  blackRook: "tour noire",
  blackQueen: "dame noire",
  blackKing: "roi noir"
};

export const RULES = `<p>Chaque joueur a 16 pièces. Les blancs commencent. Le but : mettre le roi adverse <strong>échec et mat</strong>, c'est-à-dire l'attaquer sans qu'il puisse y échapper.</p>
<ul>
<li><strong>Jouer :</strong> touchez une pièce puis une case en surbrillance, ou faites-la glisser. Seuls les coups autorisés sont proposés.</li>
<li><strong>Roi :</strong> une case dans toutes les directions. Il ne peut jamais aller sur une case attaquée.</li>
<li><strong>Dame :</strong> autant de cases qu'elle veut, en ligne droite ou en diagonale.</li>
<li><strong>Tour :</strong> en ligne droite. <strong>Fou :</strong> en diagonale. Ni l'une ni l'autre ne saute par-dessus une pièce.</li>
<li><strong>Cavalier :</strong> en « L » (deux cases puis une sur le côté). C'est la seule pièce qui saute par-dessus les autres.</li>
<li><strong>Pion :</strong> avance d'une case (deux depuis sa case de départ) et prend en diagonale vers l'avant. Arrivé au bout, il devient la pièce de votre choix (promotion).</li>
<li><strong>Prise :</strong> une pièce prend en se posant sur la case d'une pièce adverse.</li>
<li><strong>Échec :</strong> quand votre roi est attaqué, vous devez le protéger tout de suite.</li>
</ul>
<p><strong>Coups spéciaux :</strong> le <em>roque</em> (le roi glisse de deux cases vers une tour qui saute de l'autre côté, si aucun des deux n'a bougé, que la voie est libre et que le roi ne passe pas par une case attaquée — touchez le roi puis sa case d'arrivée) et la <em>prise en passant</em> (un pion qui vient d'avancer de deux cases peut être pris comme s'il n'avait avancé que d'une).</p>
<p><strong>Partie nulle :</strong> pat (plus aucun coup sans être en échec), plus assez de pièces pour mater, 50 coups sans prise ni mouvement de pion, ou la même position trois fois.</p>
<p><strong>Aides :</strong> Annuler reprend votre dernier coup, Indice montre un bon coup (à activer dans les options). Une partie en cours est gardée : vous pouvez la reprendre plus tard.</p>`;
