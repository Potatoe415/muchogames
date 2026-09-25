(function attachYatzyI18n(global) {
  const MESSAGES = {
    en: {
      meta: {
        title: "Yatzy Online Duel"
      },
      header: {
        gameTitle: "Yams"
      },
      splash: {
        title: "Yatzy",
        yourName: "Your name",
        namePlaceholder: "Your name",
        localLabel: "Local game",
        soloGame: "2-player game",
        robotGame: "Solo game",
        playOnline: "Play Online",
        createGame: "Create game",
        createBusy: "Creating...",
        waitingButton: "Waiting...",
        shareLink: "Share Link",
        shareText: "Join my Yatzy game!",
        cancelWaiting: "Cancel Waiting Room",
        joinLabel: "Join with 3-letter code",
        joinGame: "Join Game",
        joinBusy: "Joining...",
        codePlaceholder: "ABC",
        settings: "Game settings",
        backToHub: "Back to game hub",
        reverseSelection: "Reverse dice selection",
        extraRollEasterEgg: "Secret fourth roll",
        defeatModeEnabled: "Defeat mode",
        language: "Language",
        english: "English",
        french: "French",
        spanish: "Spanish",
        rules: "Rules",
        waitingStatus: "Code {code}. Waiting for Player 2...",
        joiningStatus: "Joining {code}...",
        restoringStatus: "Reconnecting to {code}...",
        connectedStatus: "Connected to {code}.",
        shareSuccess: "Link copied.",
        shareError: "Unable to share the link.",
        missingConfig: "Online multiplayer is not configured yet.",
        invalidCode: "Enter a valid 3-letter code.",
        gameNotFound: "Game not found.",
        gameExpired: "This game expired.",
        gameInProgress: "This game is already in progress.",
        sessionReplaced: "This seat was replaced by a new connection.",
        roomClosed: "This game is no longer available.",
        genericError: "Unable to connect right now."
      },
      controls: {
        restart: "Restart",
        leaveGame: "Leave",
        cancel: "Cancel",
        goBack: "Undo previous move",
        confirm: "Confirm",
        confirmSelection: "Confirm {score} in {category}",
        roll: "ROLL",
        sendEmoji: "Send a reaction",
        emojiTab: "Emojis",
        gifTab: "GIF",
        searchGifs: "Search GIFs",
        gifSearchEmpty: "No GIFs",
        gifSearchError: "Could not load GIFs",
        gifSearchLoading: "Searching…",
        sendGif: "Send a GIF",
        poweredByGiphy: "Powered by GIPHY"
      },
      labels: {
        bonus: "BONUS"
      },
      winner: {
        tie: "It's a tie!",
        win: "{name} wins!",
        useRestart: "Use Leave to return to the splash screen."
      },
      celebration: {
        rolledFiveKind: "{playerName} rolled five {faceLabel}s"
      },
      defeatMode: {
        activated: "{playerName}: Defeat mode ON"
      },
      players: {
        player1: "Player 1",
        player2: "Player 2"
      },
      categories: {
        ones: "Ones",
        twos: "Twos",
        threes: "Threes",
        fours: "Fours",
        fives: "Fives",
        sixes: "Sixes",
        fullHouse: "Full House",
        fourKind: "Four",
        largeStraight: "Large Straight",
        smallStraight: "Small Straight",
        threeKind: "3 Dice Same",
        min: "Minimum",
        max: "Maximum",
        luck: "Luck",
        yatzy: "Yatzy"
      },
      categoryIcons: {
        fullHouse: "FULL",
        fourKind: "CARRE",
        largeStraight: "SUITE",
        min: "MIN",
        max: "MAX",
        yatzy: "YATZY"
      },
      faces: {
        1: "one",
        2: "two",
        3: "three",
        4: "four",
        5: "five",
        6: "six"
      },
      aria: {
        categoryScore: "{category} score {score}",
        playerCategoryScore: "{player} {category} score {score}",
        dieWaiting: "Die {order}, waiting to be rolled",
        dieShowing: "Die {order}, showing {value}, {state}"
      },
      diceState: {
        kept: "kept",
        free: "free"
      },
      game: {
        close: "Close"
      }
    },
    es: {
      meta: {
        title: "Duelo Yatzy en linea"
      },
      header: {
        gameTitle: "Yams"
      },
      splash: {
        title: "Yatzy",
        yourName: "Tu nombre",
        namePlaceholder: "Tu nombre",
        localLabel: "Partida local",
        soloGame: "Partida de dos",
        robotGame: "Partida solo",
        playOnline: "Jugar en linea",
        createGame: "Crear partida",
        createBusy: "Creando...",
        waitingButton: "En espera...",
        shareLink: "Compartir enlace",
        shareText: "¡Únete a mi partida de Yatzy!",
        cancelWaiting: "Cancelar sala",
        joinLabel: "Unirse con codigo de 3 letras",
        joinGame: "Unirse",
        joinBusy: "Conectando...",
        codePlaceholder: "ABC",
        settings: "Configuracion",
        backToHub: "Volver al hub",
        reverseSelection: "Seleccion inversa de dados",
        extraRollEasterEgg: "4o lanzamiento secreto",
        defeatModeEnabled: "Modo derrota",
        language: "Idioma",
        english: "Ingles",
        french: "Frances",
        spanish: "Espanol",
        rules: "Reglas",
        waitingStatus: "Codigo {code}. Esperando al Jugador 2...",
        joiningStatus: "Conectando a {code}...",
        restoringStatus: "Reconectando a {code}...",
        connectedStatus: "Conectado a {code}.",
        shareSuccess: "Enlace copiado.",
        shareError: "No se pudo compartir el enlace.",
        missingConfig: "El multijugador en linea aun no esta configurado.",
        invalidCode: "Introduce un codigo valido de 3 letras.",
        gameNotFound: "Partida no encontrada.",
        gameExpired: "Esta partida ha expirado.",
        gameInProgress: "Esta partida ya esta en curso.",
        sessionReplaced: "Tu lugar fue tomado por una nueva conexion.",
        roomClosed: "Esta partida ya no esta disponible.",
        genericError: "No se puede conectar ahora mismo."
      },
      controls: {
        restart: "Reiniciar",
        leaveGame: "Salir",
        cancel: "Cancelar",
        goBack: "Deshacer jugada anterior",
        confirm: "Confirmar",
        confirmSelection: "Confirmar {score} en {category}",
        roll: "LANZAR",
        sendEmoji: "Enviar una reaccion",
        emojiTab: "Emojis",
        gifTab: "GIF",
        searchGifs: "Buscar GIFs",
        gifSearchEmpty: "Sin GIFs",
        gifSearchError: "No se pudieron cargar los GIFs",
        gifSearchLoading: "Buscando…",
        sendGif: "Enviar un GIF",
        poweredByGiphy: "Powered by GIPHY"
      },
      labels: {
        bonus: "BONUS"
      },
      winner: {
        tie: "Empate!",
        win: "{name} gana!",
        useRestart: "Usa Salir para volver al inicio."
      },
      celebration: {
        rolledFiveKind: "{playerName} ha sacado cinco {faceLabel}"
      },
      defeatMode: {
        activated: "{playerName}: Modo derrota ON"
      },
      players: {
        player1: "Jugador 1",
        player2: "Jugador 2"
      },
      categories: {
        ones: "Unos",
        twos: "Doses",
        threes: "Treses",
        fours: "Cuatros",
        fives: "Cincos",
        sixes: "Seises",
        fullHouse: "Full House",
        fourKind: "Poker",
        largeStraight: "Escalera",
        smallStraight: "Escalera corta",
        threeKind: "Trio",
        min: "Minimo",
        max: "Maximo",
        luck: "Suerte",
        yatzy: "Yatzy"
      },
      categoryIcons: {
        fullHouse: "FULL",
        fourKind: "POKER",
        largeStraight: "SCALA",
        min: "MIN",
        max: "MAX",
        yatzy: "YATZY"
      },
      faces: {
        1: "uno",
        2: "dos",
        3: "tres",
        4: "cuatro",
        5: "cinco",
        6: "seis"
      },
      aria: {
        categoryScore: "Puntuacion {score} para {category}",
        playerCategoryScore: "{player} {category} puntuacion {score}",
        dieWaiting: "Dado {order}, esperando ser lanzado",
        dieShowing: "Dado {order}, mostrando {value}, {state}"
      },
      diceState: {
        kept: "guardado",
        free: "libre"
      },
      game: {
        close: "Cerrar"
      }
    },
    fr: {
      meta: {
        title: "Duel Yatzy en ligne"
      },
      header: {
        gameTitle: "Yams"
      },
      splash: {
        title: "Yatzy",
        yourName: "Ton nom",
        namePlaceholder: "Ton nom",
        localLabel: "Partie locale",
        soloGame: "Partie à deux",
        robotGame: "Partie solo",
        playOnline: "Jouer en ligne",
        createGame: "Créer une partie",
        createBusy: "Creation...",
        waitingButton: "En attente...",
        shareLink: "Partager le lien",
        shareText: "Rejoins ma partie de Yatzy !",
        cancelWaiting: "Annuler la salle",
        joinLabel: "Rejoindre avec un code de 3 lettres",
        joinGame: "Rejoindre",
        joinBusy: "Connexion...",
        codePlaceholder: "ABC",
        settings: "Parametres",
        backToHub: "Retour au hub",
        reverseSelection: "Selection inverse des des",
        extraRollEasterEgg: "4e lancer secret",
        defeatModeEnabled: "Mode defaite",
        language: "Langue",
        english: "Anglais",
        french: "Francais",
        spanish: "Espagnol",
        rules: "Regles",
        waitingStatus: "Code {code}. En attente du Joueur 2...",
        joiningStatus: "Connexion a {code}...",
        restoringStatus: "Reconnexion a {code}...",
        connectedStatus: "Connecte a {code}.",
        shareSuccess: "Lien copie.",
        shareError: "Impossible de partager le lien.",
        missingConfig: "Le multijoueur en ligne n'est pas encore configure.",
        invalidCode: "Entrez un code valide de 3 lettres.",
        gameNotFound: "Partie introuvable.",
        gameExpired: "Cette partie a expire.",
        gameInProgress: "Cette partie est deja en cours.",
        sessionReplaced: "Cette place a ete reprise par une nouvelle connexion.",
        roomClosed: "Cette partie n'est plus disponible.",
        genericError: "Connexion impossible pour le moment."
      },
      controls: {
        restart: "Rejouer",
        leaveGame: "Quitter",
        cancel: "Annuler",
        goBack: "Annuler le coup precedent",
        confirm: "Confirmer",
        confirmSelection: "Confirmer {score} dans {category}",
        roll: "LANCER",
        sendEmoji: "Envoyer une reaction",
        emojiTab: "Emojis",
        gifTab: "GIF",
        searchGifs: "Rechercher un GIF",
        gifSearchEmpty: "Aucun GIF",
        gifSearchError: "Impossible de charger les GIFs",
        gifSearchLoading: "Recherche…",
        sendGif: "Envoyer un GIF",
        poweredByGiphy: "Powered by GIPHY"
      },
      labels: {
        bonus: "BONUS"
      },
      winner: {
        tie: "Egalite !",
        win: "{name} gagne !",
        useRestart: "Utilisez Quitter pour revenir a l'accueil."
      },
      celebration: {
        rolledFiveKind: "{playerName} a fait cinq {faceLabel}"
      },
      defeatMode: {
        activated: "{playerName} : Mode defaite ON"
      },
      players: {
        player1: "Joueur 1",
        player2: "Joueur 2"
      },
      categories: {
        ones: "As",
        twos: "Deux",
        threes: "Trois",
        fours: "Quatre",
        fives: "Cinq",
        sixes: "Six",
        fullHouse: "Full",
        fourKind: "Carre",
        largeStraight: "Suite",
        smallStraight: "Petite suite",
        threeKind: "Brelan",
        min: "Minimum",
        max: "Maximum",
        luck: "Chance",
        yatzy: "Yatzy"
      },
      categoryIcons: {
        fullHouse: "FULL",
        fourKind: "CARRE",
        largeStraight: "SUITE",
        min: "MIN",
        max: "MAX",
        yatzy: "YATZY"
      },
      faces: {
        1: "un",
        2: "deux",
        3: "trois",
        4: "quatre",
        5: "cinq",
        6: "six"
      },
      aria: {
        categoryScore: "Score {score} pour {category}",
        playerCategoryScore: "{player} {category} score {score}",
        dieWaiting: "De {order}, en attente",
        dieShowing: "De {order}, valeur {value}, {state}"
      },
      diceState: {
        kept: "garde",
        free: "libre"
      },
      game: {
        close: "Fermer"
      }
    }
  };

  function getMessage(language, key) {
    return key.split(".").reduce((value, part) => value && value[part], MESSAGES[language] || MESSAGES.en);
  }

  function t(language, key, params = {}) {
    const template = getMessage(language, key) ?? getMessage("en", key) ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) => (
      Object.prototype.hasOwnProperty.call(params, name) ? params[name] : `{${name}}`
    ));
  }

  global.YATZY_I18N = {
    messages: MESSAGES,
    t
  };
}(window));
