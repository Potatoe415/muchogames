import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type Lang = 'en' | 'fr';

type Vars = Record<string, string | number>;

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

const en: Record<string, string> = {
  // Lobby
  'lobby.subtitle': 'A cooperative island-finding voyage',
  'lobby.players': '2 players',
  'lobby.cooperative': 'Cooperative',
  'lobby.duration': '~20 min',
  'lobby.local': '🎮 Local (Pass & Play)',
  'lobby.vsBot': '🤖 Play vs Bot',
  'lobby.vsBotGame': 'Play vs Bot',
  'lobby.createOnline': '🌐 Create Online Room',
  'lobby.joinOnline': '🔗 Join Online Room',
  'lobby.localGame': 'Local Game',
  'lobby.player1Name': 'Player 1 name',
  'lobby.player2Name': 'Player 2 name',
  'lobby.startGame': 'Start Game',
  'lobby.back': '← Back',
  'lobby.createRoom': 'Create Room',
  'lobby.yourName': 'Your name',
  'lobby.connecting': 'Connecting…',
  'lobby.shareCode': 'Share this code with your partner:',
  'lobby.waitingPartner': 'Waiting for them to join…',
  'lobby.joinRoom': 'Join Room',
  'lobby.roomCode': 'Room code',
  'lobby.joining': 'Joining…',
  'lobby.join': 'Join',
  'lobby.captainPlaceholder': 'Captain…',
  'lobby.sailorPlaceholder': 'Sailor…',
  'lobby.cancelRoom': '✕ Cancel',
  'lobby.reset': 'Reset',
  'lobby.resetTitle': 'Reset — clear all sessions, cookies & local data',
  'lobby.resetAria': 'Reset browser data',
  'lobby.settingsAria': 'Open settings',
  'lobby.rules': 'Rules',
  'lobby.rulesTitle': 'Rules',
  'lobby.rulesAria': 'Open rules (PDF)',
  'lobby.backToHub': 'Back to hub',
  'difficulty.title': 'Difficulty',
  'difficulty.standard': 'Standard',
  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.noMonsters': 'No monsters',
  'difficulty.monsters': '{count} monsters',
  // GameBoard
  'game.hand': 'Hand',
  'game.deck': 'Deck',
  'game.you': '(you)',
  'game.deselect': '✕ Deselect',
  'game.discard2': '🗑️ Discard 2',
  'game.selectDiscard': 'Select 2 cards to discard ({count}/2)',
  'game.cancel': 'Cancel',
  'game.confirmDiscard': 'Confirm Discard',
  'game.backToMenu': 'Back to menu',
  'game.startPlayed': '⚓ Start played',
  'game.startPending': '⚓ Start pending',
  'game.finishPending': '🐙 Finish card played — all Sea Monsters must be played before victory',
  'status.waiting': 'Waiting for second player… · Room {code}',
  'status.won': '🎉 You win! Paradise found!',
  'status.lost': '💀 The ship is lost…',
  'status.finishMonsterMine': '🐙 Play your Sea Monster to seal the victory!',
  'status.finishMonsterOther': 'Waiting for {name} to play their Sea Monster…',
  'status.startDiscardMine': 'Start card played! Select cards to discard ({remaining} still needed).',
  'status.startDiscardOther': 'Waiting for {name} to contribute to the 8-card discard…',
  'status.mustPlayStart': 'You must play your Start card!',
  'status.yourTurn': 'Your turn — play a card or discard two.',
  'status.waitingForPlay': 'Waiting for {name} to play…',
  // GameOver
  'gameover.won': 'Paradise Found!',
  'gameover.lost': 'The Ship is Lost',
  'gameover.wonMsg': 'Congratulations! You navigated the seas together and found your island paradise.',
  'gameover.lostMsg': "A player couldn't take a legal action and the voyage ended.",
  'gameover.playAgain': '🔄 Play Again',
  'gameover.menu': '🏠 Menu',
  // PassAndPlayTransition
  'transition.title': 'Pass the device',
  'transition.turn': "It's {name}'s turn",
  'transition.hint': 'Hide the screen from your partner before tapping Ready.',
  'transition.ready': "I'm ready 🏝️",
  // DiscardModal
  'discard.title': 'Discard to Pay',
  'discard.placing': 'Placing',
  'discard.requiresDiscard': 'requires discarding',
  'discard.card': 'card',
  'discard.cards': 'cards',
  'discard.selected': '{sel} / {req} selected',
  'discard.cancel': 'Cancel',
  'discard.confirm': 'Confirm',
  // StartDiscardModal
  'startDiscard.title': 'Start Card Played!',
  'startDiscard.waiting': 'Waiting for your partner to contribute their discards…',
  'startDiscard.theirContrib': 'Their contribution',
  'startDiscard.stillNeeded': 'Still needed',
  'startDiscard.together': 'Together you must discard 8 cards. Your partner contributed {n}.',
  'startDiscard.selectUp': 'Select up to {max} cards to contribute ({remaining} still needed).',
  'startDiscard.selectRange': 'Select {min}–{max} cards to contribute — you must discard at least {min} to return to a 5-card hand ({remaining} still needed).',
  'startDiscard.contributing': 'Contributing {sel} / {max} max',
  'startDiscard.contributeBtn': 'Contribute {n} {card}',
  // App
  'app.waitingPartner': 'Room {code} — waiting for partner…',
  'app.connecting': 'Connecting…',
  'app.kicked': 'You were replaced by another player.',
  'app.cancel': 'Cancel',
  'app.shareLink': 'Share game link',
  'app.shareLinkCopied': 'Link copied',
  'app.shareTitle': 'Join my Tranquillity game',
  'app.step.auth': 'Signing in',
  'app.step.create_room': 'Creating room',
  'app.step.join_room': 'Joining room',
  'app.step.sync': 'Loading game',
  'app.step.wait_partner': 'Waiting for partner',
  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.soundOnMyTurn': 'Play a sound on my turn',
  'settings.restartGame': '↺ Restart game',
  'settings.roomCode': 'Room code',
  'settings.myStats': 'My stats',
  'settings.wins': 'Wins',
  'settings.losses': 'Losses',
  'settings.reportProblem': 'Report a problem',
};

const fr: Record<string, string> = {
  // Lobby
  'lobby.subtitle': 'Un voyage coopératif à la recherche d\'une île',
  'lobby.players': '2 joueurs',
  'lobby.cooperative': 'Coopératif',
  'lobby.duration': '~20 min',
  'lobby.local': '🎮 Local (Passez & Jouez)',
  'lobby.vsBot': '🤖 Jouer contre le bot',
  'lobby.vsBotGame': 'Jouer contre le bot',
  'lobby.createOnline': '🌐 Créer une salle en ligne',
  'lobby.joinOnline': '🔗 Rejoindre une salle',
  'lobby.localGame': 'Partie locale',
  'lobby.player1Name': 'Nom du joueur 1',
  'lobby.player2Name': 'Nom du joueur 2',
  'lobby.startGame': 'Démarrer',
  'lobby.back': '← Retour',
  'lobby.createRoom': 'Créer la salle',
  'lobby.yourName': 'Votre nom',
  'lobby.connecting': 'Connexion…',
  'lobby.shareCode': 'Partagez ce code avec votre partenaire :',
  'lobby.waitingPartner': 'En attente de leur connexion…',
  'lobby.joinRoom': 'Rejoindre',
  'lobby.roomCode': 'Code de salle',
  'lobby.joining': 'Connexion…',
  'lobby.join': 'Rejoindre',
  'lobby.captainPlaceholder': 'Capitaine…',
  'lobby.sailorPlaceholder': 'Marin…',
  'lobby.cancelRoom': '✕ Annuler',
  'lobby.reset': 'Réinitialiser',
  'lobby.resetTitle': 'Réinitialiser — effacer les sessions, cookies et données locales',
  'lobby.resetAria': 'Réinitialiser les données du navigateur',
  'lobby.settingsAria': 'Ouvrir les paramètres',
  'lobby.rules': 'Règles',
  'lobby.rulesTitle': 'Règles',
  'lobby.rulesAria': 'Ouvrir les règles (PDF)',
  'lobby.backToHub': 'Retour au hub',
  'difficulty.title': 'Difficulté',
  'difficulty.standard': 'Standard',
  'difficulty.easy': 'Facile',
  'difficulty.medium': 'Moyen',
  'difficulty.hard': 'Difficile',
  'difficulty.noMonsters': 'Aucun monstre',
  'difficulty.monsters': '{count} monstres',
  // GameBoard
  'game.hand': 'Main',
  'game.deck': 'Pioche',
  'game.you': '(vous)',
  'game.deselect': '✕ Désélectionner',
  'game.discard2': '🗑️ Défausser 2',
  'game.selectDiscard': 'Choisissez 2 cartes à défausser ({count}/2)',
  'game.cancel': 'Annuler',
  'game.confirmDiscard': 'Confirmer la défausse',
  'game.backToMenu': 'Retour au menu',
  'game.startPlayed': '⚓ Départ joué',
  'game.startPending': '⚓ Départ en attente',
  'game.finishPending': '🐙 Carte Arrivée jouée — tous les monstres marins doivent être joués avant la victoire',
  'status.waiting': 'En attente du deuxième joueur… · Salle {code}',
  'status.won': '🎉 Vous avez gagné ! Paradis trouvé !',
  'status.lost': '💀 Le bateau est perdu…',
  'status.finishMonsterMine': '🐙 Jouez votre monstre marin pour valider la victoire !',
  'status.finishMonsterOther': 'En attente que {name} joue son monstre marin…',
  'status.startDiscardMine': 'Carte Départ jouée ! Choisissez des cartes à défausser ({remaining} encore nécessaires).',
  'status.startDiscardOther': 'En attente que {name} contribue à la défausse de 8 cartes…',
  'status.mustPlayStart': 'Vous devez jouer votre carte Départ !',
  'status.yourTurn': 'À vous — jouez une carte ou défaussez-en deux.',
  'status.waitingForPlay': 'En attente que {name} joue…',
  // GameOver
  'gameover.won': 'Paradis trouvé !',
  'gameover.lost': 'Le bateau est perdu',
  'gameover.wonMsg': 'Félicitations ! Vous avez navigué ensemble et trouvé votre île paradisiaque.',
  'gameover.lostMsg': 'Un joueur ne pouvait plus jouer et le voyage s\'est terminé.',
  'gameover.playAgain': '🔄 Rejouer',
  'gameover.menu': '🏠 Menu',
  // PassAndPlayTransition
  'transition.title': 'Passez l\'appareil',
  'transition.turn': 'C\'est au tour de {name}',
  'transition.hint': 'Cachez l\'écran de votre partenaire avant d\'appuyer sur Prêt.',
  'transition.ready': 'Je suis prêt 🏝️',
  // DiscardModal
  'discard.title': 'Défausser pour payer',
  'discard.placing': 'Poser',
  'discard.requiresDiscard': 'nécessite de défausser',
  'discard.card': 'carte',
  'discard.cards': 'cartes',
  'discard.selected': '{sel} / {req} sélectionnée(s)',
  'discard.cancel': 'Annuler',
  'discard.confirm': 'Confirmer',
  // StartDiscardModal
  'startDiscard.title': 'Carte de départ jouée !',
  'startDiscard.waiting': 'En attente de la contribution de votre partenaire…',
  'startDiscard.theirContrib': 'Sa contribution',
  'startDiscard.stillNeeded': 'Encore nécessaire',
  'startDiscard.together': 'Ensemble vous devez défausser 8 cartes. Votre partenaire en a contribué {n}.',
  'startDiscard.selectUp': 'Choisissez jusqu\'à {max} cartes à contribuer ({remaining} encore nécessaires).',
  'startDiscard.selectRange': 'Choisissez {min}–{max} cartes à contribuer — vous devez en défausser au moins {min} pour revenir à 5 cartes en main ({remaining} encore nécessaires).',
  'startDiscard.contributing': 'Contribution : {sel} / {max} max',
  'startDiscard.contributeBtn': 'Contribuer {n} {card}',
  // App
  'app.waitingPartner': 'Salle {code} — en attente d\'un partenaire…',
  'app.connecting': 'Connexion…',
  'app.kicked': 'Vous avez été remplacé(e) par un autre joueur.',
  'app.cancel': 'Annuler',
  'app.shareLink': 'Partager le lien de la partie',
  'app.shareLinkCopied': 'Lien copié',
  'app.shareTitle': 'Rejoins ma partie Tranquillity',
  'app.step.auth': 'Connexion en cours',
  'app.step.create_room': 'Création de la salle',
  'app.step.join_room': 'Connexion à la salle',
  'app.step.sync': 'Chargement de la partie',
  'app.step.wait_partner': 'En attente du partenaire',
  // Settings
  'settings.title': 'Paramètres',
  'settings.language': 'Langue',
  'settings.soundOnMyTurn': 'Jouer un son à mon tour',
  'settings.restartGame': '↺ Recommencer la partie',
  'settings.roomCode': 'Code de salle',
  'settings.myStats': 'Mes stats',
  'settings.wins': 'Victoires',
  'settings.losses': 'Défaites',
  'settings.reportProblem': 'Signaler un problème',
};

const translations: Record<Lang, Record<string, string>> = { en, fr };

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Vars) => string;
}

const Context = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  function t(key: string, vars?: Vars): string {
    const str = translations[lang][key] ?? translations['en'][key] ?? key;
    return interpolate(str, vars);
  }

  return <Context.Provider value={{ lang, setLang, t }}>{children}</Context.Provider>;
}

export function useT() {
  return useContext(Context).t;
}

export function useLang() {
  const { lang, setLang } = useContext(Context);
  return { lang, setLang };
}

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs font-semibold tracking-widest uppercase text-ocean-300 hover:text-white transition-colors px-1.5 py-0.5 rounded"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {lang}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1 w-32 bg-ocean-900 border border-ocean-700 rounded shadow-lg z-50 overflow-hidden"
        >
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              role="option"
              aria-selected={lang === code}
              onClick={() => { setLang(code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                lang === code
                  ? 'text-white bg-ocean-700'
                  : 'text-ocean-300 hover:bg-ocean-800 hover:text-white'
              }`}
            >
              <span className="font-semibold uppercase text-xs tracking-wider mr-2">{code}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
