export const STRINGS = {
  title: "Scrabble",
  words: "Langue des mots",
  mixHelp: "Un mot est bon s'il existe dans au moins une des langues cochées.",
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
  vsComputer: "Contre l'ordinateur",
  onOneDevice: "{n} joueurs sur le même appareil",
  level: "Niveau",
  junior: "Junior",
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  expert: "Expert",
  levelRecord: "Victoires à ce niveau : {won} sur {played}",
  noRecord: "Pas encore de partie à ce niveau",
  bestScore: "Record à ce niveau : {score} pts",
  newBest: "Nouveau record à ce niveau : {score} pts !",
  players: "Joueurs",
  names: "Prénoms",
  player1: "Joueur 1",
  player2: "Joueur 2",
  player3: "Joueur 3",
  player4: "Joueur 4",
  start: "Commencer",
  you: "Vous",
  computer: "Ordinateur",
  bag: "Sac",
  shuffle: "Mélanger",
  recall: "Rappeler",
  hintLeft: "Indice ({n})",
  hintZero: "indice utilisé",
  pass: "Passer",
  define: "Définir",
  lookupHint: "Touchez un mot du plateau pour voir sa définition.",
  defLoading: "Recherche de la définition…",
  defMissing: "Pas de définition trouvée.",
  defError: "Définition indisponible (connexion ?).",
  defSource: "Voir sur le Wiktionnaire ↗",
  defLicense: "Définitions : Wiktionnaire, licence CC BY-SA 4.0",
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
  bagSummary: "{bag} dans le sac · {unseen} non vues (sac + adversaires)",
  handoffTitle: "Au tour de {name}",
  handoffHint: "Passez l'appareil, puis touchez le bouton.",
  handoffButton: "Voir mes lettres",
  win: "Victoire !",
  loss: "Défaite",
  draw: "Égalité",
  nameWins: "{name} gagne !",
  endOut: "{name} a posé toutes ses lettres.",
  endBlocked: "Deux tours sans points pour chacun : la partie s'arrête.",
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
  <li>De 1 à 4 joueurs : seul contre l'ordinateur, ou de 2 à 4 sur le même appareil (on se le passe à chaque tour).</li>
  <li>Chaque joueur a 7 lettres. À votre tour, posez une ou plusieurs lettres sur une même ligne ou colonne, sans trou, collées aux mots déjà posés.</li>
  <li>Le premier mot passe par l'étoile ★ au centre.</li>
  <li>Tous les mots formés doivent exister dans le dictionnaire d'une des langues choisies : le jeu vérifie avant de valider, sans pénalité. Français : Officiel du Scrabble (ODS 9). Anglais : ENABLE. Espagnol : liste libre de 635 000 mots.</li>
  <li>Les accents ne comptent pas. En espagnol, Ñ est une lettre à part ; CH, LL et RR s'écrivent avec deux lettres. Chaque langue a ses propres lettres et valeurs.</li>
  <li><strong>Junior</strong> (contre l'ordinateur, dès 7 ans) : les règles de la face 2 du Scrabble Junior. Petit plateau, sac de 60 lettres, 5 lettres chacun, et les lettres de l'ordinateur sont visibles. Seules les cases de couleur rapportent des points : vert 1, bleu 2, rose 3 pour chaque lettre posée dessus (la valeur des lettres ne compte pas). Au début de son tour, on peut échanger 1 lettre et jouer quand même, ou passer son tour pour en échanger plusieurs. Rien n'est retiré à la fin. Le bouton Indice est toujours là et les lettres piochées sont plus faciles.</li>
  <li><strong>Plusieurs langues :</strong> cochez FR, EN et/ou ES. Un mot est accepté s'il existe dans au moins une des langues cochées, pour tout le monde, ordinateur compris. Avec l'espagnol, le sac a toutes les lettres et le Ñ (valeurs françaises) ; français + anglais : sac français.</li>
  <li><strong>Points :</strong> chaque lettre a sa valeur. LD et LT doublent ou triplent la lettre, MD et MT le mot entier (l'étoile compte MD). Une case ne compte qu'au moment où on la couvre.</li>
  <li>Le <strong>joker</strong> remplace n'importe quelle lettre et vaut 0 point.</li>
  <li><strong>Scrabble :</strong> poser ses 7 lettres d'un coup rapporte 50 points de bonus.</li>
  <li><strong>Indice</strong> (si activé dans les options) : jusqu'à 5 par tour, chacun propose un mot. Un tour où l'on a pris un indice rapporte 0 point ; le tour suivant compte normalement.</li>
  <li>Au lieu de jouer, vous pouvez <strong>échanger</strong> des lettres (s'il en reste au moins 7 dans le sac) ou <strong>passer</strong>.</li>
  <li><strong>Fin :</strong> quand le sac est vide et qu'un joueur a posé toutes ses lettres, ou quand chaque joueur a passé ou échangé deux fois de suite. Les lettres restantes sont retirées du score ; celui qui a fini gagne celles des autres.</li>
</ul>
<p><strong>Commandes :</strong> touchez une lettre puis une case, ou faites-la glisser. Touchez une lettre posée pour la reprendre. Astuce : touchez une case vide (une flèche apparaît, retouchez pour la tourner) puis vos lettres à la suite. Au clavier : tapez les lettres, Entrée pour jouer, Retour arrière pour enlever, Échap pour tout rappeler.</p>
<p><strong>Définir :</strong> touchez le livre puis un mot du plateau pour lire une définition courte (Wiktionnaire ; mots français inclus dans le jeu, autres langues : connexion nécessaire).</p>
`;
