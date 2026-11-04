const fs = require('fs');

const dataFile = 'C:/Users/rfaucompret/Documents/DEV/dev-projects/muchogames/public/data/ttmc/ttmc_data.json';
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

const newCards = [
  {
    theme: "Mature",
    subject: "Les organisations criminelles",
    questions: [
      { level: 1, q: "La mafia sicilienne est aussi connue sous le nom de... ?", a: "Cosa Nostra." },
      { level: 2, q: "Organisation criminelle japonaise dont les membres ont souvent des tatouages corporels entiers ?", a: "Les Yakuza." },
      { level: 3, q: "Mafia originaire de la région de Naples en Italie ?", a: "La Camorra." },
      { level: 4, q: "Célèbre cartel de la drogue colombien dirigé par Pablo Escobar ?", a: "Le cartel de Medellín." },
      { level: 5, q: "Terme désignant la mafia russe (ou les voleurs dans la loi) ?", a: "La Bratva (ou Vor v zakone)." },
      { level: 6, q: "Gang de motards américain formé en 1948 au nom diabolique ?", a: "Les Hells Angels." },
      { level: 7, q: "Cartel mexicain actuellement parmi les plus puissants, souvent abrégé CJNG ?", a: "Cartel de Jalisco Nouvelle Génération." },
      { level: 8, q: "Célèbre syndicat du crime organisé judéo-américain des années 1930 (nommé par la presse) ?", a: "Murder, Inc." },
      { level: 9, q: "Gang de rue hispanique transnational formé à Los Angeles dans les années 1980 ?", a: "MS-13 (Mara Salvatrucha)." },
      { level: 10, q: "Organisation criminelle originaire de Calabre (Italie), aujourd'hui l'une des plus puissantes au monde ?", a: "La 'Ndrangheta." }
    ]
  },
  {
    theme: "Plaisir",
    subject: "Les cocktails classiques",
    questions: [
      { level: 1, q: "Rhum, citron vert, sucre de canne, menthe fraîche, eau gazeuse ?", a: "Le Mojito." },
      { level: 2, q: "Vodka, crème de coco, bière de gingembre (ou lait de coco), jus d'ananas ?", a: "La Piña Colada." },
      { level: 3, q: "Tequila, Cointreau, jus de citron vert (servi avec un bord givré de sel) ?", a: "La Margarita." },
      { level: 4, q: "Gin, vodka, Lillet blanc, Kina Lillet (ou vermouth) ? (Cocktail inventé par James Bond)", a: "Le Vesper (ou Vesper Martini)." },
      { level: 5, q: "Bourbon, jus de citron, sirop de sucre, blanc d'œuf (optionnel) ?", a: "Le Whiskey Sour." },
      { level: 6, q: "Campari, vermouth rouge, gin ?", a: "Le Negroni." },
      { level: 7, q: "Rhum, jus de citron vert, sirop de sucre ? (Très simple)", a: "Le Daiquiri." },
      { level: 8, q: "Vodka, jus de tomate, jus de citron, sauce Worcestershire, Tabasco, sel de céleri, poivre ?", a: "Le Bloody Mary." },
      { level: 9, q: "Cognac (ou Rye whiskey), absinthe, bitter Peychaud's, sucre ? (Cocktail de la Nouvelle-Orléans)", a: "Le Sazerac." },
      { level: 10, q: "Gin, jus de citron, sirop de sucre, eau gazeuse ? (Créé au 19ème siècle)", a: "Le Tom Collins." }
    ]
  },
  {
    theme: "Improbable",
    subject: "L'improbable de l'océan",
    questions: [
      { level: 1, q: "L'océan Pacifique est plus grand que la surface totale des terres émergées ?", a: "Vrai." },
      { level: 2, q: "Les baleines bleues ont des cordes vocales ?", a: "Faux (elles utilisent leur larynx différemment, sans vraies cordes vocales)." },
      { level: 3, q: "Il y a des lacs sous-marins au fond de l'océan ?", a: "Vrai (des bassins de saumure)." },
      { level: 4, q: "Les requins peuvent éternuer ?", a: "Faux." },
      { level: 5, q: "Le point le plus profond de l'océan a été visité par plus de personnes que la Lune ?", a: "Faux (environ 27 pour la fosse des Mariannes contre 12 pour la Lune... c'est serré !)." },
      { level: 6, q: "La grande barrière de corail est visible depuis l'espace ?", a: "Vrai." },
      { level: 7, q: "Les pieuvres n'ont pas d'os du tout ?", a: "Vrai." },
      { level: 8, q: "L'eau de l'océan est bleue car elle reflète le ciel ?", a: "Faux (elle absorbe les couleurs rouges du spectre lumineux, laissant le bleu)." },
      { level: 9, q: "On a exploré seulement 5% des océans de la planète ?", a: "Vrai (environ 5 à 20% selon les définitions d'\"exploration\")." },
      { level: 10, q: "Les dauphins dorment avec un œil ouvert ?", a: "Vrai (pour surveiller les prédateurs et respirer)." }
    ]
  },
  {
    theme: "Scolaire",
    subject: "L'histoire du train",
    questions: [
      { level: 1, q: "Dans quel pays est né le premier chemin de fer public à vapeur en 1825 ?", a: "Le Royaume-Uni (Angleterre)." },
      { level: 2, q: "Nom de la célèbre locomotive à vapeur de George Stephenson (1829) ?", a: "La Fusée (The Rocket)." },
      { level: 3, q: "Quelle énergie a remplacé la vapeur au milieu du XXe siècle ?", a: "Le diesel (puis l'électricité)." },
      { level: 4, q: "Célèbre ligne de train inaugurée en 1883 reliant Paris à Istanbul (via Vienne) ?", a: "L'Orient-Express." },
      { level: 5, q: "Nom de la ligne de chemin de fer qui traverse la Russie d'ouest en est ?", a: "Le Transsibérien." },
      { level: 6, q: "Acronyme du train à grande vitesse français mis en service en 1981 ?", a: "TGV (Train à Grande Vitesse)." },
      { level: 7, q: "Train à grande vitesse japonais surnommé \"train-balle\" ?", a: "Le Shinkansen." },
      { level: 8, q: "Tunnel ferroviaire sous-marin reliant la France et l'Angleterre (1994) ?", a: "Le tunnel sous la Manche (ou Eurotunnel)." },
      { level: 9, q: "Technologie de train utilisant des aimants pour léviter au-dessus des rails ?", a: "La sustentation magnétique (Maglev)." },
      { level: 10, q: "Célèbre train luxueux sud-africain traversant le continent du nord au sud ?", a: "Le Rovos Rail (ou le Blue Train)." }
    ]
  },
  {
    theme: "Mature",
    subject: "Les sectes tristement célèbres",
    questions: [
      { level: 1, q: "Chef de la \"Famille\" responsable des meurtres de Sharon Tate en 1969 ?", a: "Charles Manson." },
      { level: 2, q: "Secte ayant commis un suicide collectif massif à Jonestown (Guyana) en 1978 ?", a: "Le Temple du Peuple (dirigé par Jim Jones)." },
      { level: 3, q: "Secte japonaise responsable de l'attentat au gaz sarin dans le métro de Tokyo en 1995 ?", a: "Aum Shinrikyo." },
      { level: 4, q: "Groupe sectaire dont 39 membres se sont suicidés en 1997, croyant rejoindre un vaisseau spatial ?", a: "Heaven's Gate (La Porte du Paradis)." },
      { level: 5, q: "Secte impliquée dans un siège mortel de 51 jours avec le FBI à Waco (Texas) en 1993 ?", a: "Les Davidiens (dirigés par David Koresh)." },
      { level: 6, q: "Ordre sectaire fondé en Suisse, connu pour plusieurs suicides collectifs dans les années 1990 ?", a: "L'Ordre du Temple Solaire (OTS)." },
      { level: 7, q: "Mouvement fondé par Claude Vorilhon (Raël), croyant que l'humanité a été créée par des extraterrestres ?", a: "Le Mouvement raëlien." },
      { level: 8, q: "Secte ougandaise responsable du massacre de Kanungu en 2000 (plus de 700 morts) ?", a: "Le Mouvement pour la restauration des dix commandements de Dieu." },
      { level: 9, q: "Célèbre \"gourou\" indien de la secte Rajneeshpuram (documentaire \"Wild Wild Country\") ?", a: "Osho (ou Bhagwan Shree Rajneesh)." },
      { level: 10, q: "Secte apocalyptique russe responsable d'une prise d'otages dans une grotte en 2007 ?", a: "La secte de Penza (ou la Véritable Église orthodoxe russe)." }
    ]
  },
  {
    theme: "Plaisir",
    subject: "Les desserts du monde",
    questions: [
      { level: 1, q: "Dessert italien à base de mascarpone, café et biscuits à la cuillère ?", a: "Le Tiramisu." },
      { level: 2, q: "Petit gâteau français en forme de dôme strié ?", a: "La Madeleine." },
      { level: 3, q: "Pâtisserie marocaine à base de pâte à choux, miel et amandes ?", a: "Le Makrout (ou la corne de gazelle)." },
      { level: 4, q: "Gâteau autrichien à base de pâte feuilletée, pommes et raisins secs ?", a: "Le Strudel (Apfelstrudel)." },
      { level: 5, q: "Dessert turc en forme de nid d'oiseau garni de pistaches ou de noix ?", a: "Le Baklava (aussi commun en Grèce et au Moyen-Orient)." },
      { level: 6, q: "Pâtisserie portugaise à base de pâte feuilletée et crème pâtissière ?", a: "Le Pastel de nata." },
      { level: 7, q: "Gâteau japonais roulé rempli de crème fouettée ?", a: "Le Roulé au thé matcha (Matcha roll cake)." },
      { level: 8, q: "Dessert indien sous forme de boulettes frites baignant dans un sirop sucré ?", a: "Le Gulab jamun." },
      { level: 9, q: "Gâteau mexicain épongé aux trois laits ?", a: "Le Tres leches." },
      { level: 10, q: "Gâteau russe en couches avec du miel et de la crème aigre ?", a: "Le Medovik." }
    ]
  }
];

data.cards.push(...newCards);
fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
console.log('Added 6 cards');