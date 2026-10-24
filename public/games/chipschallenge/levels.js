// The five levels. Each map is centred in the 32x32 board and padded with
// walls; the legend lives in level.js. `dirs` and `clones` use map
// coordinates ("x,y"). Passwords are the original CHIPS.EXE ones.
export const LEVELS = [
  {
    title: "LESSON 1",
    password: "BDHP",
    time: 100,
    hint: {
      fr: "Ramassez les puces pour franchir la prise. Les clés ouvrent les portes de leur couleur ; la verte sert à l'infini.",
      en: "Pick up chips to get past the chip socket. Keys open doors of their colour; the green one never wears out.",
      es: "Recoge los chips para pasar el zócalo. Las llaves abren las puertas de su color; la verde sirve siempre."
    },
    map: [
      "#####################",
      "########..E..########",
      "########.....########",
      "##########S##########",
      "##########.##########",
      "##########.##########",
      "##########.##########",
      "##....####G####....##",
      "#.c..c.#?...c#.c..c.#",
      "#......#.....#......#",
      "#r.....B..@..R.....y#",
      "#......#.....#......#",
      "#.c..c.#c...b#.c..c.#",
      "##....####Y####....##",
      "#######.......#######",
      "######c.......c######",
      "######.........######",
      "######....g....######",
      "######..c...c..######",
      "#######.......#######",
      "##########G##########",
      "##########c##########",
      "#####################"
    ]
  },
  {
    title: "LESSON 2",
    password: "JXMJ",
    time: 150,
    hint: {
      fr: "Poussez les blocs dans l'eau pour faire un pont, puis marchez sur la boue. Les insectes longent le mur à leur gauche.",
      en: "Push blocks into the water to build a bridge, then walk over the mud. Bugs follow the wall on their left.",
      es: "Empuja los bloques al agua para hacer un puente y pisa el barro. Los bichos siguen la pared de su izquierda."
    },
    map: [
      "########################",
      "#.........~~.###########",
      "#.c.......~~.#x......###",
      "#...o.....~~.#.......###",
      "#.........~~.#..c.c..###",
      "#.......o.~~.:...c...###",
      "#.........~~.#..c.c..###",
      "#.?.@.....~~.#.......###",
      "#.......o.~~.#......x###",
      "#.........~~.###########",
      "#.........~~.###########",
      "#.........~~.###########",
      "#.....o...~~.......SE###",
      "#.........~~.###########",
      "#.c....c..~~.###########",
      "#.........~~.###########",
      "########################"
    ],
    dirs: { "14,2": "E", "20,8": "W" }
  },
  {
    title: "LESSON 3",
    password: "ECBQ",
    time: 200,
    hint: {
      fr: "Palmes : eau. Bottes de feu : feu. Patins : glace. Ventouses : tapis roulants. Gare au voleur, il prend toutes les bottes !",
      en: "Flippers: water. Fire boots: fire. Skates: ice. Suction boots: force floors. Beware the thief: he takes all your boots!",
      es: "Aletas: agua. Botas de fuego: fuego. Patines: hielo. Ventosas: cintas. ¡Cuidado con el ladrón, se lleva todas las botas!"
    },
    map: [
      "#######################",
      "########...h...########",
      "########.c...c.########",
      "########.......########",
      "########.......########",
      "########~~~~~~~########",
      "########~~~~~~~########",
      "########~~~~~~~########",
      "#....>>>###.###%%%....#",
      "#.c..>>>###.###%%%.c..#",
      "####.>>>##?.w##%%%....#",
      "#ETS.>>>...@...%%%...k#",
      "####.>>>##...##%%%....#",
      "#.c..>>>###.###%%%.c..#",
      "#....>>>###.###%%%....#",
      "########_______########",
      "########_______########",
      "########_______########",
      "########_c___c_########",
      "########_______########",
      "########_______########",
      "########_u_____########",
      "#######################"
    ]
  },
  {
    title: "SLIDE & SKATE",
    password: "YMCJ",
    time: 150,
    hint: {
      fr: "Sur la glace, impossible de s'arrêter : les coins courbes vous font tourner. Le bouton vert inverse les murs verts. Un téléporteur mène au suivant.",
      en: "You can't stop on ice: curved corners turn you. The green button flips the green walls. A teleport sends you to the next one.",
      es: "En el hielo no puedes pararte: las curvas te hacen girar. El botón verde invierte los muros verdes. Un teletransporte lleva al siguiente."
    },
    map: [
      "########################",
      "########################",
      "##1________2############",
      "##_########_############",
      "##_########_############",
      "##_########_############",
      "##_#######...c##########",
      "##_#######....##########",
      "##_#######c..!##########",
      "##_################E####",
      "##_################S####",
      "##_###########..._____##",
      "#?..'#########c..#######",
      "#....########t..._____2#",
      "#.@..|....t###...#####_#",
      "#....#################_#",
      "#....|c##############kc#",
      "########################"
    ]
  },
  {
    title: "MONSTER MAZE",
    password: "TQKB",
    time: 150,
    hint: {
      fr: "Le bouton bleu fait demi-tourner les tanks, le rouge actionne le cloneur. Un bloc sur une bombe la désamorce. Certains murs bleus sont faux. Vite !",
      en: "The blue button turns tanks around, the red one runs the clone machine. A block on a bomb sets it off. Some blue walls are fake. Hurry!",
      es: "El botón azul da la vuelta a los tanques, el rojo activa la clonadora. Un bloque sobre una bomba la hace estallar. Algunos muros azules son falsos. ¡Rápido!"
    },
    map: [
      "###########C##############",
      "###########v######c#######",
      "##c$o....##v###F......####",
      "##.,.....##v###.#####.####",
      "##.........$..:.#####.####",
      "##.......######.#####.c###",
      "##......c######.#####.####",
      "##.......######.#####.####",
      "##.############......F####",
      "##.###############c#######",
      "##.###############.#######",
      "##.############WLL.LWW####",
      "##.############WLWWcWW####",
      "##K..........##cLLLLLW####",
      "####.##########WWWWWLW####",
      "#?.....########WWWWWLW####",
      "#......#############.#####",
      "#..@...########.......####",
      "#......########p......SE##",
      "#....;.########.......####",
      "#.....c########.......####",
      "##########################"
    ],
    dirs: { "2,13": "W", "15,2": "E", "21,8": "W", "15,18": "E" },
    clones: { "11,0": ["o", "S"] }
  }
];
