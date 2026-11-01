// Junior level: words the computer never plays and the Hint never suggests
// (rude or crude words that are valid in the dictionaries). Best effort, not
// exhaustive; a child may still play them, they are not refused.
const BLOCKED = [
  // fr
  "BAISA BAISE BAISER BAISES BITE BITES CHATTE CHATTES CHIE CHIER CHIES CHIOTTE CHIOTTES",
  "CON CONNARD CONNARDS CONNASSE CONNE CONNES CONS COUILLE COUILLES CUL CULS ENCULE",
  "FION FIONS FOUTRE FOUTU MERDE MERDES MERDEUX NIBAR NIBARD NIBARDS NIBARS NICHON",
  "NICHONS PET PETER PETS PINE PINES PUTAIN PUTE PUTES SALAUD SALOP SALOPE TEUB TEUBS",
  "ZIZI ZIZIS ZOB ZOBS",
  // en
  "ARSE ASS BITCH BOOB BOOBS COCK COCKS CRAP CUNT DICK DICKS FAG FUCK FUCKS PISS PORN",
  "PRICK SEX SHIT SLUT TIT TITS TURD TWAT WHORE",
  // es
  "CABRON CAGA CAGAR CHOCHO COÑO COÑOS CULO CULOS JODE JODER MEAR MIERDA PEDO PEDOS",
  "POLLA POLLAS PUTA PUTAS PUTO TETA TETAS VERGA"
].flatMap((line) => line.split(" "));

const blocked = new Set(BLOCKED);

export const isKidFriendly = (word) => !blocked.has(word);
