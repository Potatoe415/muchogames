// Player-facing copy in FR/EN/ES. `cheers` is a "|"-separated list.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Fruit Slash",
    pitch: "Glisse ton doigt pour trancher tout ce qui vole !",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    sound: "Son",
    on: "Activé",
    off: "Désactivé",
    chooseTheme: "Choisis ton thème",
    fruits: "Fruits",
    veggies: "Légumes",
    sweets: "Bonbons",
    toys: "Jouets",
    space: "Espace",
    mix: "Mélange",
    chooseMode: "Choisis ton niveau",
    kids: "Petit ninja",
    kidsHint: "Tout doux, sans bombes",
    ninja: "Grand ninja",
    ninjaHint: "Plus vite, gare aux bombes !",
    resume: "Reprendre",
    resumeInfo: "{theme} · {mode} · {score} pts · {time} s",
    bestLine: "Records : 🐣 {kids} · 🥷 {ninja}",
    score: "Points",
    time: "Temps",
    pause: "Pause",
    canvas: "Zone de jeu : glisse pour trancher les objets",
    go: "C'est parti !",
    combo: "Combo x{n} ! +{n}",
    cheers: "Super !|Génial !|Waouh !|Bravo !|Trop fort !",
    bombText: "Boum ! -{time} s",
    bonusText: "+{time} s",
    paused: "Pause",
    continue: "Continuer",
    endTitle: "Bravo !",
    endScore: "{score} points",
    endSliced: "{sliced} objets tranchés",
    endCombo: "Meilleur combo : x{combo}",
    newBest: "Nouveau record ! 🎉",
    best: "Record : {best}",
    stars: "{n} étoiles sur 3",
    replay: "Rejouer",
    menu: "Changer de thème"
  },
  en: {
    title: "Fruit Slash",
    pitch: "Swipe your finger to slice everything that flies!",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    sound: "Sound",
    on: "On",
    off: "Off",
    chooseTheme: "Pick your theme",
    fruits: "Fruits",
    veggies: "Veggies",
    sweets: "Sweets",
    toys: "Toys",
    space: "Space",
    mix: "Mix",
    chooseMode: "Pick your level",
    kids: "Little ninja",
    kidsHint: "Nice and easy, no bombs",
    ninja: "Big ninja",
    ninjaHint: "Faster, watch out for bombs!",
    resume: "Resume",
    resumeInfo: "{theme} · {mode} · {score} pts · {time} s",
    bestLine: "Records: 🐣 {kids} · 🥷 {ninja}",
    score: "Points",
    time: "Time",
    pause: "Pause",
    canvas: "Play area: swipe to slice the items",
    go: "Let's go!",
    combo: "Combo x{n}! +{n}",
    cheers: "Super!|Awesome!|Wow!|Well done!|Amazing!",
    bombText: "Boom! -{time} s",
    bonusText: "+{time} s",
    paused: "Paused",
    continue: "Continue",
    endTitle: "Well done!",
    endScore: "{score} points",
    endSliced: "{sliced} items sliced",
    endCombo: "Best combo: x{combo}",
    newBest: "New record! 🎉",
    best: "Record: {best}",
    stars: "{n} stars out of 3",
    replay: "Play again",
    menu: "Change theme"
  },
  es: {
    title: "Fruit Slash",
    pitch: "¡Desliza el dedo para cortar todo lo que vuela!",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    sound: "Sonido",
    on: "Activado",
    off: "Desactivado",
    chooseTheme: "Elige tu tema",
    fruits: "Frutas",
    veggies: "Verduras",
    sweets: "Dulces",
    toys: "Juguetes",
    space: "Espacio",
    mix: "Mezcla",
    chooseMode: "Elige tu nivel",
    kids: "Pequeño ninja",
    kidsHint: "Tranquilo, sin bombas",
    ninja: "Gran ninja",
    ninjaHint: "Más rápido, ¡cuidado con las bombas!",
    resume: "Reanudar",
    resumeInfo: "{theme} · {mode} · {score} pts · {time} s",
    bestLine: "Récords: 🐣 {kids} · 🥷 {ninja}",
    score: "Puntos",
    time: "Tiempo",
    pause: "Pausa",
    canvas: "Zona de juego: desliza para cortar los objetos",
    go: "¡Vamos!",
    combo: "¡Combo x{n}! +{n}",
    cheers: "¡Súper!|¡Genial!|¡Guau!|¡Bravo!|¡Increíble!",
    bombText: "¡Bum! -{time} s",
    bonusText: "+{time} s",
    paused: "Pausa",
    continue: "Continuar",
    endTitle: "¡Bravo!",
    endScore: "{score} puntos",
    endSliced: "{sliced} objetos cortados",
    endCombo: "Mejor combo: x{combo}",
    newBest: "¡Nuevo récord! 🎉",
    best: "Récord: {best}",
    stars: "{n} estrellas de 3",
    replay: "Jugar otra vez",
    menu: "Cambiar de tema"
  }
};

const RULES = {
  fr: `<p>Des fruits, des bonbons, des jouets… volent dans le ciel. Tranche-les avant la fin du chrono !</p>
<ul>
<li>Glisse le doigt sur l'écran (ou la souris, bouton enfoncé) : la lame arc-en-ciel coupe tout ce qu'elle touche. Au clavier, les flèches déplacent la lame.</li>
<li>Chaque objet tranché rapporte 1 point. Ceux qui retombent ne font rien perdre.</li>
<li>Combo : 3 objets ou plus d'un seul geste rapportent autant de points en plus (combo x4 = +4).</li>
<li>🌟 Étoile dorée : +5 points et +2 secondes.</li>
<li>Une partie dure 60 secondes.</li>
<li>Petit ninja : objets plus gros et plus lents, sans bombes.</li>
<li>Grand ninja : plus d'objets, plus rapides, et des bombes 💣 : en couper une enlève 5 secondes.</li>
<li>Thèmes : fruits, légumes, bonbons, jouets, espace ou mélange. Un record par niveau.</li>
<li>⏸ met en pause. La partie est sauvegardée : si tu quittes, « Reprendre » la relance là où tu en étais.</li>
</ul>`,
  en: `<p>Fruits, sweets, toys… fly across the sky. Slice them before the clock runs out!</p>
<ul>
<li>Swipe your finger across the screen (or the mouse, button held): the rainbow blade cuts everything it touches. On a keyboard, the arrow keys move the blade.</li>
<li>Every item sliced is worth 1 point. Items that fall back cost nothing.</li>
<li>Combo: 3 or more items in one swipe earn as many extra points (combo x4 = +4).</li>
<li>🌟 Golden star: +5 points and +2 seconds.</li>
<li>A game lasts 60 seconds.</li>
<li>Little ninja: bigger, slower items, no bombs.</li>
<li>Big ninja: more items, faster, and 💣 bombs: slicing one takes 5 seconds off.</li>
<li>Themes: fruits, veggies, sweets, toys, space or mix. One record per level.</li>
<li>⏸ pauses. The game is saved: if you leave, "Resume" brings it back where you were.</li>
</ul>`,
  es: `<p>Frutas, dulces, juguetes… vuelan por el cielo. ¡Córtalos antes de que se acabe el tiempo!</p>
<ul>
<li>Desliza el dedo por la pantalla (o el ratón, con el botón pulsado): la espada arcoíris corta todo lo que toca. Con el teclado, las flechas mueven la espada.</li>
<li>Cada objeto cortado vale 1 punto. Los que caen no restan nada.</li>
<li>Combo: 3 objetos o más de un solo gesto dan tantos puntos extra (combo x4 = +4).</li>
<li>🌟 Estrella dorada: +5 puntos y +2 segundos.</li>
<li>Una partida dura 60 segundos.</li>
<li>Pequeño ninja: objetos más grandes y lentos, sin bombas.</li>
<li>Gran ninja: más objetos, más rápidos, y bombas 💣: cortar una quita 5 segundos.</li>
<li>Temas: frutas, verduras, dulces, juguetes, espacio o mezcla. Un récord por nivel.</li>
<li>⏸ pone en pausa. La partida se guarda: si sales, «Reanudar» la retoma donde estabas.</li>
</ul>`
};

export function translate(lang, key, vars = {}) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
