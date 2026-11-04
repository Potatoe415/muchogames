const fs = require('fs');
const file = 'public/data/ttmc/ttmc_data.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.cards.push(
  {
    theme: 'Scolaire',
    subject: 'L\'histoire de la musique classique',
    questions: [
      { level: 1, q: 'Période associée à Mozart ?', a: 'Classique' },
      { level: 2, q: 'Instrument principal de Chopin ?', a: 'Le piano' },
      { level: 3, q: 'Compositeur des "Quatre Saisons" ?', a: 'Vivaldi' },
      { level: 4, q: 'Œuvre inachevée de Mozart ?', a: 'Le Requiem' },
      { level: 5, q: 'Nombre de symphonies de Beethoven ?', a: '9' },
      { level: 6, q: 'Qu\'est-ce qu\'une fugue ?', a: 'Une forme musicale polyphonique' },
      { level: 7, q: 'Compositeur de "La Flûte Enchantée" ?', a: 'Mozart' },
      { level: 8, q: 'Nationalité de Tchaïkovski ?', a: 'Russe' },
      { level: 9, q: 'Époque de Bach ?', a: 'Baroque' },
      { level: 10, q: 'Qu\'est-ce qu\'un concerto ?', a: 'Une composition pour instrument soliste et orchestre' }
    ]
  },
  {
    theme: 'Mature',
    subject: 'Les superstitions macabres',
    questions: [
      { level: 1, q: 'Animal associé à la malchance ?', a: 'Le chat noir' },
      { level: 2, q: 'Nombre considéré comme maudit en Asie ?', a: '4' },
      { level: 3, q: 'Que faire si l\'on renverse du sel ?', a: 'En jeter par-dessus l\'épaule gauche' },
      { level: 4, q: 'Objet à ne pas ouvrir à l\'intérieur ?', a: 'Un parapluie' },
      { level: 5, q: 'Signification d\'un miroir brisé ?', a: '7 ans de malheur' },
      { level: 6, q: 'Pourquoi éviter de passer sous une échelle ?', a: 'C\'est lié au triangle de la Sainte Trinité' },
      { level: 7, q: 'Oiseau associé à la mort ?', a: 'Le corbeau ou la chouette' },
      { level: 8, q: 'Jour de la semaine considéré comme malchanceux ?', a: 'Le vendredi' },
      { level: 9, q: 'Que signifie un chat noir croisant votre chemin ?', a: 'Un mauvais présage' },
      { level: 10, q: 'Plante associée à la protection contre le mal ?', a: 'L\'ail ou le romarin' }
    ]
  },
  {
    theme: 'Plaisir',
    subject: 'Les types de fromages britanniques',
    questions: [
      { level: 1, q: 'Fromage bleu célèbre ?', a: 'Le Stilton' },
      { level: 2, q: 'Fromage à pâte dure le plus consommé ?', a: 'Le Cheddar' },
      { level: 3, q: 'Fromage du Pays de Galles ?', a: 'Le Caerphilly' },
      { level: 4, q: 'Fromage avec de la ciboulette et des oignons ?', a: 'Le Double Gloucester' },
      { level: 5, q: 'Fromage à croûte lavée ?', a: 'Le Stinking Bishop' },
      { level: 6, q: 'Fromage similaire au Camembert ?', a: 'Le Somerset Brie' },
      { level: 7, q: 'Fromage utilisé dans le "ploughman\'s lunch" ?', a: 'Le Cheddar (souvent)' },
      { level: 8, q: 'Fromage écossais ?', a: 'Le Caboc ou le Dunlop' },
      { level: 9, q: 'Fromage roulé dans de la cendre ?', a: 'Le Cerney Ash' },
      { level: 10, q: 'Fromage à base de lait de brebis ?', a: 'Le Lanark Blue' }
    ]
  }
);

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('done');
