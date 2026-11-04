const fs = require('fs');

const dataFile = 'C:/Users/rfaucompret/Documents/DEV/dev-projects/muchogames/public/data/ttmc/ttmc_data.json';
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// Manually derived/guessed answers for missing 7 cards
const missingCards = [
  {
    theme: "Mature",
    subject: "Les tueurs en série (fiction ou réalité)",
    questions: [
      { level: 1, q: "Quel acteur joue Hannibal Lecter dans *Le Silence des Agneaux* ?", a: "Anthony Hopkins" },
      { level: 2, q: "Célèbre tueur britannique du 19ème siècle qui n'a jamais été identifié ?", a: "Jack l'Éventreur" },
      { level: 3, q: "Tueur en série de la série *Dexter* qui tue d'autres tueurs ?", a: "Dexter Morgan" },
      { level: 4, q: "Surnom de Charles Sobhraj, incarné dans une série Netflix ?", a: "Le Serpent" },
      { level: 5, q: "Tueur en série américain célèbre pour s'être déguisé en clown ?", a: "John Wayne Gacy" },
      { level: 6, q: "Quel est le nom du tueur au masque de hockey dans *Vendredi 13* ?", a: "Jason Voorhees" },
      { level: 7, q: "Tueur en série français surnommé \"Le tueur de l'Est parisien\" ?", a: "Guy Georges" },
      { level: 8, q: "Quel tueur américain a inspiré les films *Psychose* et *Massacre à la tronçonneuse* ?", a: "Ed Gein" },
      { level: 9, q: "Quel tueur en série envoyait des lettres cryptées à la police de San Francisco ?", a: "Le Tueur du Zodiaque" },
      { level: 10, q: "Tueur en série américain exécuté en 1989, qui avouera 30 meurtres de jeunes femmes ?", a: "Ted Bundy" }
    ]
  },
  {
    theme: "Mature",
    subject: "Les métiers",
    questions: [
      { level: 1, q: "Personne qui éteint les incendies ?", a: "Pompier" },
      { level: 2, q: "Personne qui fabrique et vend du pain ?", a: "Boulanger" },
      { level: 3, q: "Médecin spécialiste des dents ?", a: "Dentiste" },
      { level: 4, q: "Artisan qui travaille le bois ?", a: "Menuisier / Charpentier" },
      { level: 5, q: "Spécialiste de la réparation des tuyauteries ?", a: "Plombier" },
      { level: 6, q: "Médecin spécialiste du cœur ?", a: "Cardiologue" },
      { level: 7, q: "Professionnel qui étudie les astres ?", a: "Astronome" },
      { level: 8, q: "Artisan qui travaille le fer ou les métaux à la forge ?", a: "Forgeron" },
      { level: 9, q: "Spécialiste qui étudie les fossiles et les restes du passé ?", a: "Paléontologue" },
      { level: 10, q: "Professionnel de la création et de l'entretien des fûts en bois (tonneaux) ?", a: "Tonnelier" }
    ]
  },
  {
    theme: "Improbable",
    subject: "Les essuie-glaces",
    questions: [
      { level: 1, q: "Sur quoi trouve-t-on généralement des essuie-glaces ?", a: "Sur un véhicule (voiture, camion...)" },
      { level: 2, q: "À quoi servent-ils principalement ?", a: "À essuyer la pluie / l'eau sur le pare-brise" },
      { level: 3, q: "Le produit liquide utilisé avec s'appelle du liquide...", a: "Lave-glace" },
      { level: 4, q: "Qui a inventé l'essuie-glace (une femme en 1903) ?", a: "Mary Anderson" },
      { level: 5, q: "Les balais d'essuie-glace sont principalement faits de quelle matière ?", a: "De caoutchouc" },
      { level: 6, q: "Quel mouvement font généralement les essuie-glaces traditionnels ?", a: "Un mouvement de balayage (arc de cercle)" },
      { level: 7, q: "Comment s'appelle l'essuie-glace situé à l'arrière du véhicule ?", a: "L'essuie-glace arrière" },
      { level: 8, q: "Quel phénomène indique qu'un essuie-glace est usé ?", a: "Il grince ou laisse des traces" },
      { level: 9, q: "En quelle année l'essuie-glace automatique (détecteur de pluie) a-t-il été introduit en grande série ?", a: "Dans les années 1990" },
      { level: 10, q: "Quel inventeur a créé l'essuie-glace intermittent en 1963 ?", a: "Robert Kearns" }
    ]
  },
  {
    theme: "Improbable",
    subject: "Les topinambours",
    questions: [
      { level: 1, q: "Le topinambour est un : fruit, légume ou viande ?", a: "Un légume" },
      { level: 2, q: "De quel tubercule célèbre le topinambour se rapproche-t-il le plus visuellement ?", a: "La pomme de terre (ou le gingembre)" },
      { level: 3, q: "Le topinambour est souvent surnommé l'artichaut de... ?", a: "Jérusalem" },
      { level: 4, q: "Pendant quelle guerre a-t-il été beaucoup consommé en France, laissant un mauvais souvenir ?", a: "La Seconde Guerre mondiale" },
      { level: 5, q: "Son goût rappelle fortement quel autre légume ?", a: "L'artichaut" },
      { level: 6, q: "Le topinambour appartient à la famille de quelle grande fleur jaune ?", a: "Le tournesol (Helianthus)" },
      { level: 7, q: "De quel continent le topinambour est-il originaire ?", a: "L'Amérique du Nord" },
      { level: 8, q: "Quel est l'inconvénient gastrique bien connu du topinambour ?", a: "Il provoque des flatulences / ballonnements" },
      { level: 9, q: "Quel explorateur français a découvert le topinambour au 17ème siècle ?", a: "Samuel de Champlain" },
      { level: 10, q: "Quel glucide complexe, responsable de ses effets digestifs, le topinambour contient-il en grande quantité ?", a: "L'inuline" }
    ]
  },
  {
    theme: "Improbable",
    subject: "Les demis",
    questions: [
      { level: 1, q: "Un demi au bar correspond généralement à quelle boisson ?", a: "Une bière" },
      { level: 2, q: "Quelle est la contenance classique d'un demi en France (en centilitres) ?", a: "25 cl" },
      { level: 3, q: "Comment s'appelle le joueur de rugby qui porte le numéro 9 ?", a: "Le demi de mêlée" },
      { level: 4, q: "Comment s'appelle une personne dont un seul parent est commun avec vous ?", a: "Un demi-frère ou une demi-sœur" },
      { level: 5, q: "Comment appelle-t-on 50% d'un cercle ?", a: "Un demi-cercle" },
      { level: 6, q: "Dans le vocabulaire musical, quelle note vaut la moitié d'une blanche ?", a: "Une noire (ou croche si on parle de valeur temps plein)" },
      { level: 7, q: "Au football, comment s'appelle la ligne qui sépare le terrain en deux ?", a: "La ligne médiane (ou demi-terrain)" },
      { level: 8, q: "Comment s'appelle le joueur de rugby qui porte le numéro 10 ?", a: "Le demi d'ouverture" },
      { level: 9, q: "En mathématiques, comment écrit-on un demi en fraction ?", a: "1/2" },
      { level: 10, q: "Quel est le nom de la pièce de monnaie américaine valant 50 cents ?", a: "Le Half Dollar (demi-dollar)" }
    ]
  },
  {
    theme: "Improbable",
    subject: "La poupée Barbie",
    questions: [
      { level: 1, q: "Quel est le prénom de l'amoureux historique de Barbie ?", a: "Ken" },
      { level: 2, q: "De quelle couleur est traditionnellement associée Barbie ?", a: "Rose" },
      { level: 3, q: "Quelle entreprise fabrique la poupée Barbie ?", a: "Mattel" },
      { level: 4, q: "En quelle année la première poupée Barbie a-t-il été commercialisée ?", a: "1959" },
      { level: 5, q: "Quel est le vrai prénom complet de Barbie ?", a: "Barbara (Millicent Roberts)" },
      { level: 6, q: "Qui a réalisé le film à succès *Barbie* sorti en 2023 ?", a: "Greta Gerwig" },
      { level: 7, q: "Quelle actrice incarne Barbie dans le film de 2023 ?", a: "Margot Robbie" },
      { level: 8, q: "Comment s'appelle la petite sœur la plus connue de Barbie ?", a: "Skipper" },
      { level: 9, q: "De quelle poupée allemande pour adultes Barbie s'est-elle inspirée ?", a: "La poupée Bild Lilli" },
      { level: 10, q: "Quel est le prénom de l'inventrice de la poupée Barbie ?", a: "Ruth Handler" }
    ]
  },
  {
    theme: "Improbable",
    subject: "Les eaux gazeuses",
    questions: [
      { level: 1, q: "Quelle marque française d'eau gazeuse a pour slogan \"L'eau qui fait pschitt\" ou qui pétille ?", a: "Perrier" },
      { level: 2, q: "Quelle célèbre marque italienne d'eau gazeuse a une étoile rouge sur son logo ?", a: "San Pellegrino" },
      { level: 3, q: "Comment appelle-t-on le gaz contenu dans l'eau gazeuse ?", a: "Du dioxyde de carbone (CO2) / Gaz carbonique" },
      { level: 4, q: "Quelle eau gazeuse auvergnate est réputée pour sa très forte minéralité et son goût salé ?", a: "Vichy Célestins / Saint-Yorre" },
      { level: 5, q: "Comment appelle-t-on de l'eau plate que l'on a gazéifiée artificiellement ?", a: "De l'eau gazéifiée (ou eau seltz)" },
      { level: 6, q: "Quelle machine domestique permet de gazéifier l'eau du robinet ?", a: "Sodastream" },
      { level: 7, q: "L'eau de Seltz tire son nom d'une ville thermale située dans quel pays européen ?", a: "L'Allemagne (Selters)" },
      { level: 8, q: "Quelle marque d'eau pétillante française est souvent associée à la couleur verte et vient de la source des Bouillens ?", a: "Perrier" },
      { level: 9, q: "Comment dit-on \"eau gazeuse\" en anglais ?", a: "Sparkling water" },
      { level: 10, q: "Quelle marque corse d'eau minérale gazeuse naturelle est connue pour sa bouteille bleue ?", a: "Orezza" }
    ]
  }
];

data.cards.push(...missingCards);
fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log('Added 7 inferred normal cards');