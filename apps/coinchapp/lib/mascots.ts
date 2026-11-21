/**
 * Player mascots (avatars), `public/mascots/<id>.webp`. Same id list as the
 * hub's `public/shared/js/player-profile.js` (separate app, duplicated on
 * purpose): the hub sends the player's pick as `?mascot=<id>`.
 */
export const MASCOT_IDS = [
  "badger", "baker", "basil", "bear", "beaver", "bike", "bison", "bitterbal", "bocce", "brie",
  "bulldog", "canal-house", "cannolo", "cat", "centurion", "cheese-carrier", "cheese", "clog",
  "coffee", "colosseum", "cookie", "cornicello", "cow", "cowboy-bear", "crepe", "croissant",
  "crown", "cypress", "deer", "delft-teapot", "delft-tile", "detective-badger", "dolphin", "duomo",
  "dutch-girl", "eagle", "eiffel", "fairy", "falcon", "fisherman", "fox", "fries", "friesian",
  "frog", "gelato", "ghost", "goat", "gondolier", "graduate-owl", "grapes", "guard", "hagelslag",
  "hare", "hedgehog", "heron", "herring", "houseboat", "kid", "king-lion", "ladybug", "lemon",
  "lighthouse", "lion", "liquorice", "little-car", "mandolin", "maremma-dog", "mime", "moka",
  "mole", "moon", "mouse", "murano-vase", "nonna", "oliebol", "olive-oil", "otter", "owl",
  "pancakes", "panettone", "phone-box", "pigeon", "pisa-tower", "pizza", "poffertjes", "pony",
  "poodle", "prairie-dog", "pulcinella", "punk-hedgehog", "puppet", "rabbit", "raccoon", "rat",
  "raven", "raviolo", "retriever", "robin", "rooster", "root-beer", "seal", "sheep", "skater",
  "snail", "spaghetti", "sparrow", "speculaas", "squirrel", "stork", "stroopwafel", "taxi",
  "tea-squirrel", "teacup", "tenor", "tiramisu", "tompouce", "tortellino", "tram", "truffle",
  "tulip", "uk-bulldog", "venice-mask", "vespa", "volcano", "windmill", "wolf",
] as const;

export type MascotId = (typeof MASCOT_IDS)[number];

const MASCOT_SET: ReadonlySet<string> = new Set(MASCOT_IDS);

export function isMascotId(value: unknown): value is MascotId {
  return typeof value === "string" && MASCOT_SET.has(value);
}

export function mascotSrc(id: MascotId): string {
  return `/mascots/${id}.webp`;
}

export function randomMascot(rng: () => number = Math.random): MascotId {
  return MASCOT_IDS[Math.floor(rng() * MASCOT_IDS.length)];
}
