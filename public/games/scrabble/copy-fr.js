export const STRINGS = {
  title: "Scrabble",
  pitch: "Le jeu de lettres, en français. Seul contre l'ordinateur ou à deux.",
  back: "Retour",
  options: "Options",
  close: "Fermer",
  language: "Langue",
  sound: "Son",
  on: "Oui",
  off: "Non",
  hintOption: "Bouton Indice",
  rules: "Règles",
  dictLoading: "Préparation du dictionnaire…",
  dictError: "Le dictionnaire n'a pas pu être chargé.",
  retry: "Réessayer",
  resume: "Reprendre la partie",
  mode: "Mode",
  modeSolo: "Contre l'ordinateur",
  modeDuo: "À deux",
  level: "Niveau",
  easy: "Facile",
  medium: "Moyen",
  hard: "Fort",
  levelRecord: "Victoires à ce niveau : {won} sur {played}",
  noRecord: "Pas encore de partie à ce niveau",
  players: "Joueurs",
  player1: "Joueur 1",
  player2: "Joueur 2",
  start: "Commencer",
  you: "Vous",
  computer: "Ordinateur",
  bag: "Sac",
  shuffle: "Mélanger",
  recall: "Rappeler",
  hint: "Indice",
  pass: "Passer",
  quit: "Quitter",
  playWord: "Jouer",
  firstTurn:
    "Premier mot : il passe par l'étoile ★. Touchez une lettre puis une case.",
  yourTurn: "À vous ! Posez des lettres sur le plateau.",
  turnOf: "À {name} de jouer.",
  thinking: "{name} réfléchit…",
  err_line: "Les lettres doivent être sur une même ligne.",
  err_gap: "Pas de case vide au milieu du mot.",
  err_center: "Le premier mot doit passer par l'étoile ★.",
  err_short: "Il faut au moins deux lettres.",
  err_detached: "Le mot doit toucher une lettre déjà posée.",
  badWord: "« {word} » n'est pas dans le dictionnaire.",
  okWord: "{words} · {score} pts",
  bingo: "Scrabble ! +50",
  lastPlay: "{name} : {word} · {score} pts",
  lastSwap: "{name} a échangé {count} lettre(s).",
  lastPass: "{name} a passé son tour.",
  noMove: "Aucun mot possible : échangez des lettres ou passez.",
  blankTitle: "Quelle lettre pour le joker ?",
  cancel: "Annuler",
  swapTitle: "Échanger ou passer",
  swapHelp: "Touchez les lettres à remettre dans le sac.",
  swapNone: "Moins de 7 lettres dans le sac : l'échange n'est plus possible.",
  swapConfirm: "Échanger ({count})",
  passConfirm: "Passer mon tour",
  bagTitle: "Lettres restantes",
  bagSummary: "{bag} dans le sac · {unseen} non vues (sac + adversaire)",
  handoffTitle: "Au tour de {name}",
  handoffHint: "Passez l'appareil, puis touchez le bouton.",
  handoffButton: "Voir mes lettres",
  win: "Victoire !",
  loss: "Défaite",
  draw: "Égalité",
  nameWins: "{name} gagne !",
  endOut: "{name} a posé toutes ses lettres.",
  endBlocked: "Quatre tours sans points : la partie s'arrête.",
  endPlayer: "{name} : {score} pts ({adjust} en fin de partie)",
  bestWord: "Meilleur mot : {word} ({score} pts)",
  replay: "Rejouer",
  changeSettings: "Changer de réglages",
  seeBoard: "Voir le plateau",
  premTW: "MT",
  premDW: "MD",
  premTL: "LT",
  premDL: "LD"
};

export const RULES = `
<p><strong>But :</strong> marquer le plus de points en formant des mots sur la grille, comme des mots croisés.</p>
<ul>
  <li>Chaque joueur a 7 lettres. À votre tour, posez une ou plusieurs lettres sur une même ligne ou colonne, sans trou, collées aux mots déjà posés.</li>
  <li>Le premier mot passe par l'étoile ★ au centre.</li>
  <li>Tous les mots formés doivent exister dans l'Officiel du Scrabble (ODS 9) : le jeu vérifie avant de valider, sans pénalité.</li>
  <li><strong>Points :</strong> chaque lettre a sa valeur. LD et LT doublent ou triplent la lettre, MD et MT le mot entier (l'étoile compte MD). Une case ne compte qu'au moment où on la couvre.</li>
  <li>Le <strong>joker</strong> remplace n'importe quelle lettre et vaut 0 point.</li>
  <li><strong>Scrabble :</strong> poser ses 7 lettres d'un coup rapporte 50 points de bonus.</li>
  <li>Au lieu de jouer, vous pouvez <strong>échanger</strong> des lettres (s'il en reste au moins 7 dans le sac) ou <strong>passer</strong>.</li>
  <li><strong>Fin :</strong> quand le sac est vide et qu'un joueur a posé toutes ses lettres, ou après 4 tours de suite sans points. Les lettres restantes sont retirées du score ; celui qui a fini gagne celles de l'adversaire.</li>
</ul>
<p><strong>Commandes :</strong> touchez une lettre puis une case, ou faites-la glisser. Touchez une lettre posée pour la reprendre. Astuce : touchez une case vide (une flèche apparaît, retouchez pour la tourner) puis vos lettres à la suite. Au clavier : tapez les lettres, Entrée pour jouer, Retour arrière pour enlever, Échap pour tout rappeler.</p>
`;
