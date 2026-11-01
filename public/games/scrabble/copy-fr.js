export const STRINGS = {
  title: "Scrabble",
  pitch:
    "Le jeu de lettres, en français, anglais ou espagnol. Seul contre l'ordinateur ou à deux.",
  words: "Langue des mots",
  p1LangSolo: "Votre langue",
  p1LangDuo: "Langue du joueur 1",
  mixHelp:
    "Chacun pose des mots dans sa langue sur le même plateau. Sac commun avec le Ñ.",
  lang_fr: "français",
  lang_es: "espagnol",
  handoffTitleLang: "Au tour de {name} · {lang}",
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
  junior: "Junior",
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  expert: "Expert",
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
  define: "Définir",
  lookupHint: "Touchez un mot du plateau pour voir sa définition.",
  defLoading: "Recherche de la définition…",
  defMissing: "Pas de définition trouvée.",
  defError: "Définition indisponible (connexion ?).",
  defSource: "Voir sur le Wiktionnaire ↗",
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
  swapHelpJunior:
    "Une seule lettre : vous l'échangez et vous jouez quand même. Plusieurs : vous passez votre tour.",
  swapOneConfirm: "Échanger 1 lettre et jouer",
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
  <li>Tous les mots formés doivent exister dans le dictionnaire de la langue choisie : le jeu vérifie avant de valider, sans pénalité. Français : Officiel du Scrabble (ODS 9). Anglais : ENABLE. Espagnol : liste libre de 635 000 mots.</li>
  <li>Les accents ne comptent pas. En espagnol, Ñ est une lettre à part ; CH, LL et RR s'écrivent avec deux lettres. Chaque langue a ses propres lettres et valeurs.</li>
  <li><strong>Junior</strong> (contre l'ordinateur, dès 7 ans) : les règles de la face 2 du Scrabble Junior. Petit plateau, 5 lettres chacun, et les lettres de l'ordinateur sont visibles. Seules les cases de couleur rapportent des points : vert 1, bleu 2, rose 3 pour chaque lettre posée dessus (la valeur des lettres ne compte pas). Au début de son tour, on peut échanger 1 lettre et jouer quand même, ou passer son tour pour en échanger plusieurs. Rien n'est retiré à la fin. Le bouton Indice est toujours là et les lettres piochées sont plus faciles.</li>
  <li><strong>FR + ES :</strong> un joueur pose des mots français, l'autre des mots espagnols, sur le même plateau. Seuls les mots formés par le joueur doivent exister dans sa langue. Le sac est commun (valeurs françaises, avec le Ñ).</li>
  <li><strong>Points :</strong> chaque lettre a sa valeur. LD et LT doublent ou triplent la lettre, MD et MT le mot entier (l'étoile compte MD). Une case ne compte qu'au moment où on la couvre.</li>
  <li>Le <strong>joker</strong> remplace n'importe quelle lettre et vaut 0 point.</li>
  <li><strong>Scrabble :</strong> poser ses 7 lettres d'un coup rapporte 50 points de bonus.</li>
  <li>Au lieu de jouer, vous pouvez <strong>échanger</strong> des lettres (s'il en reste au moins 7 dans le sac) ou <strong>passer</strong>.</li>
  <li><strong>Fin :</strong> quand le sac est vide et qu'un joueur a posé toutes ses lettres, ou après 4 tours de suite sans points. Les lettres restantes sont retirées du score ; celui qui a fini gagne celles de l'adversaire.</li>
</ul>
<p><strong>Commandes :</strong> touchez une lettre puis une case, ou faites-la glisser. Touchez une lettre posée pour la reprendre. Astuce : touchez une case vide (une flèche apparaît, retouchez pour la tourner) puis vos lettres à la suite. Au clavier : tapez les lettres, Entrée pour jouer, Retour arrière pour enlever, Échap pour tout rappeler.</p>
<p><strong>Définir :</strong> touchez le livre puis un mot du plateau pour lire une définition courte (Wiktionnaire, connexion nécessaire).</p>
`;
