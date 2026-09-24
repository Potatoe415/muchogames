import React, { useState, useEffect } from 'react';
import type { ClientGameState, GameState, MonsterCount, Card } from '@tranquillity/shared';
import { useT, LanguageSwitcher } from './i18n';
import {
  initializeGame,
  buildClientState,
  applyPlayCard,
  applyDiscardTwo,
  applyContributeStartDiscard,
  chooseBotAction,
} from '@tranquillity/shared';
import { useOnlineGame } from './lib/useOnlineGame';
import { readHubAvatar, readHubName } from './lib/hubAvatar';
import { captureProfileCode } from './lib/profileSync';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import PassAndPlayTransition from './components/PassAndPlayTransition';
import ConnectingScreen from './components/ConnectingScreen';

type AppMode = 'lobby' | 'local' | 'online';

// ── Local (pass-and-play) state ───────────────────────────────────────────────

interface LocalState {
  gameState: GameState;
  viewingAs: 0 | 1;
  showTransition: boolean;
  pendingPlayer: 0 | 1 | null; // player whose turn it will be after transition
  pendingOpponentPlay: { card: Card; position: number } | null;
  vsBot: boolean; // when true, player 1 is an automated co-op bot
}

const BOT_NAME = 'Bot';
const BOT_PLAYER_INDEX = 1 as const;
const BOT_THINK_MS = 900;

// Who must take the next action (contributor during start_discard, otherwise the
// current player). Returns null when the game is over.
function nextLocalActor(s: GameState): 0 | 1 | null {
  if (s.phase === 'won' || s.phase === 'lost') return null;
  if (s.phase === 'start_discard') return s.startDiscardState!.currentContributor;
  return s.currentPlayerIndex;
}

export default function App() {
  const t = useT();
  const [mode, setMode] = useState<AppMode>('lobby');
  const [local, setLocal] = useState<LocalState | null>(null);
  const [lobbyInitialRoom, setLobbyInitialRoom] = useState<string | undefined>(
    () => new URLSearchParams(window.location.search).get('room')?.toUpperCase() || undefined
  );
  // Pre-filled from the Bergamots hub's profile name (?name=), forwarded on
  // launch exactly like ?lang= — see bergamots/docs/TECH.md "Player identity
  // contract". Never required, never overwritten once the player edits it.
  const [lobbyInitialName] = useState<string | undefined>(
    () => readHubName() || undefined
  );
  const [hubAvatar] = useState(() => readHubAvatar());

  useEffect(() => {
    captureProfileCode();
  }, []);
  const {
    online,
    createRoom,
    joinRoom,
    playCard: onlinePlayCard,
    discardTwo: onlineDiscardTwo,
    contributeStartDiscard: onlineContributeStartDiscard,
    leave: leaveOnline,
  } = useOnlineGame();

  // ── Local mode ─────────────────────────────────────────────────────────────

  function startLocal(p1Name: string, p2Name: string, monsterCount: MonsterCount = 0) {
    leaveOnline();
    const gameState = initializeGame('LOCAL', { id: 'p0', name: p1Name }, { id: 'p1', name: p2Name }, monsterCount);
    setLocal({ gameState, viewingAs: 0, showTransition: false, pendingPlayer: null, pendingOpponentPlay: null, vsBot: false });
    setMode('local');
  }

  function startBot(playerName: string, monsterCount: MonsterCount = 0) {
    leaveOnline();
    const gameState = initializeGame('LOCAL', { id: 'p0', name: playerName }, { id: 'p1', name: BOT_NAME }, monsterCount);
    setLocal({ gameState, viewingAs: 0, showTransition: false, pendingPlayer: null, pendingOpponentPlay: null, vsBot: true });
    setMode('local');
  }

  function localClientState(): ClientGameState | null {
    if (!local) return null;
    return buildClientState(local.gameState, local.viewingAs);
  }

  // Commit a new local state, deciding whether a pass-and-play transition is
  // needed. In bot mode the human always keeps viewing as player 0 and the bot
  // effect drives player 1's turns — so no transition is ever shown.
  function advanceLocal(newState: GameState, opponentPlay: { card: Card; position: number } | null) {
    setLocal(prev => {
      if (!prev) return null;
      const actor = nextLocalActor(newState);
      if (prev.vsBot || actor === null || actor === prev.viewingAs) {
        return { ...prev, gameState: newState, showTransition: false, pendingPlayer: null, pendingOpponentPlay: null };
      }
      return { ...prev, gameState: newState, showTransition: true, pendingPlayer: actor, pendingOpponentPlay: opponentPlay };
    });
  }

  function localPlayCard(cardId: string, position: number, discardCardIds: string[]) {
    if (!local) return;
    const result = applyPlayCard(local.gameState, local.viewingAs, cardId, position, discardCardIds);
    if (!result.ok) { alert(result.error); return; }
    const playedCard = local.gameState.players[local.viewingAs].hand.find(c => c.id === cardId) ?? null;
    const opponentPlay = playedCard && position >= 0 ? { card: playedCard, position } : null;
    advanceLocal(result.state, opponentPlay);
  }

  function localDiscardTwo(cardIds: [string, string]) {
    if (!local) return;
    const result = applyDiscardTwo(local.gameState, local.viewingAs, cardIds);
    if (!result.ok) { alert(result.error); return; }
    advanceLocal(result.state, null);
  }

  function localContributeStartDiscard(cardIds: string[]) {
    if (!local) return;
    const result = applyContributeStartDiscard(local.gameState, local.viewingAs, cardIds);
    if (!result.ok) { alert(result.error); return; }
    advanceLocal(result.state, null);
  }

  // Bot auto-play: whenever it is player 1's turn in a bot game, compute and
  // apply the bot's action after a short "thinking" delay.
  useEffect(() => {
    if (!local || !local.vsBot) return;
    if (nextLocalActor(local.gameState) !== BOT_PLAYER_INDEX) return;

    const timer = setTimeout(() => {
      setLocal(prev => {
        if (!prev || !prev.vsBot) return prev;
        if (nextLocalActor(prev.gameState) !== BOT_PLAYER_INDEX) return prev;
        const action = chooseBotAction(prev.gameState, BOT_PLAYER_INDEX);
        if (!action) return prev;
        let result;
        if (action.type === 'play') result = applyPlayCard(prev.gameState, BOT_PLAYER_INDEX, action.cardId, action.position, action.discardCardIds);
        else if (action.type === 'discard_two') result = applyDiscardTwo(prev.gameState, BOT_PLAYER_INDEX, action.cardIds);
        else result = applyContributeStartDiscard(prev.gameState, BOT_PLAYER_INDEX, action.cardIds);
        if (!result.ok) return prev;
        return { ...prev, gameState: result.state, showTransition: false, pendingPlayer: null, pendingOpponentPlay: null };
      });
    }, BOT_THINK_MS);

    return () => clearTimeout(timer);
  }, [local]);

  function localHandleReady() {
    if (!local || local.pendingPlayer === null) return;
    setLocal(prev => prev ? { ...prev, viewingAs: prev.pendingPlayer!, showTransition: false, pendingPlayer: null } : null);
  }

  function localRematch() {
    if (!local) return;
    const gs = local.gameState;
    const [p0, p1] = gs.players;
    if (local.vsBot) startBot(p0.name, gs.monsterCount);
    else startLocal(p0.name, p1.name, gs.monsterCount);
  }

  // ── Online mode ────────────────────────────────────────────────────────────
  // Connection/session/realtime plumbing lives in useOnlineGame (Supabase).
  // This component only decides *when* to switch into 'online' mode and
  // handles the one-time resume-from-URL / resume-from-localStorage flows.

  // Restore a local (pass-and-play) session on mount.
  useEffect(() => {
    const savedLocal = localStorage.getItem('tranquillity_local');
    if (!savedLocal) return;
    try {
      setLocal(JSON.parse(savedLocal) as LocalState);
      setMode('local');
    } catch {
      localStorage.removeItem('tranquillity_local');
    }
  }, []);

  // Resume a saved online session, or auto-join via a ?room= URL param.
  useEffect(() => {
    if (localStorage.getItem('tranquillity_local')) return; // local mode took over above

    const savedGameId = localStorage.getItem('tranquillity_gameId');
    const savedRoom = localStorage.getItem('tranquillity_room');
    const urlRoom = new URLSearchParams(window.location.search).get('room')?.toUpperCase();

    if (savedGameId && (!urlRoom || urlRoom === savedRoom)) {
      // useOnlineGame's own mount effect resumes this session; just switch view.
      setMode('online');
      return;
    }

    if (urlRoom) {
      const name = localStorage.getItem('tranquillity_name');
      if (name) {
        setMode('online');
        void joinRoom(urlRoom, name);
      } else {
        setLobbyInitialRoom(urlRoom);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep ?room= in the address bar; never leave hub identity params there
  // (a share/copy of this URL must not give the partner our name or avatar).
  useEffect(() => {
    writeRoomUrl(online.roomCode);
  }, [online.roomCode]);

  // Persist local state on every change
  useEffect(() => {
    if (local) localStorage.setItem('tranquillity_local', JSON.stringify(local));
  }, [local]);

  function createOnline(playerName: string, monsterCount: MonsterCount = 0) {
    localStorage.removeItem('tranquillity_local');
    setMode('online');
    void createRoom(playerName, monsterCount);
  }

  function joinOnline(roomCode: string, playerName: string) {
    localStorage.removeItem('tranquillity_local');
    setMode('online');
    void joinRoom(roomCode, playerName);
  }

  function goToMenu() {
    leaveOnline();
    localStorage.removeItem('tranquillity_local');
    writeRoomUrl(null);
    setLobbyInitialRoom(undefined);
    setMode('lobby');
    setLocal(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const langSwitcher = (
    <div className="fixed top-3 right-3 z-[200]">
      <LanguageSwitcher />
    </div>
  );

  if (mode === 'lobby') {
    // Lobby has its own back-to-hub / options buttons (top-left/top-right);
    // language lives inside its options panel, so no floating langSwitcher here.
    return (
      <>
        <Lobby
          onStartLocal={startLocal}
          onStartBot={startBot}
          onCreateOnline={createOnline}
          onJoinOnline={(code, name) => { setLobbyInitialRoom(undefined); joinOnline(code, name); }}
          onCancelRoom={goToMenu}
          onlineRoomCode={online.roomCode ?? undefined}
          connectionStatus={online.connectionStatus}
          errorMessage={online.error ?? undefined}
          initialRoomCode={lobbyInitialRoom}
          initialPlayerName={lobbyInitialName}
        />
      </>
    );
  }

  if (mode === 'local' && local) {
    if (local.showTransition && local.pendingPlayer !== null) {
      const nextName = local.gameState.players[local.pendingPlayer].name;
      return (
        <>
          {langSwitcher}
          <PassAndPlayTransition nextPlayerName={nextName} onReady={localHandleReady} />
        </>
      );
    }

    const cs = localClientState();
    if (!cs) return null;

    return (
      <GameBoard
        gameState={cs}
        onPlayCard={localPlayCard}
        onDiscardTwo={localDiscardTwo}
        onContributeStartDiscard={localContributeStartDiscard}
        onRematch={localRematch}
        onMenu={goToMenu}
        initialOpponentPlay={local.pendingOpponentPlay ?? undefined}
      />
    );
  }

  if (mode === 'online') {
    if (!online.clientState) {
      return (
        <>
          {langSwitcher}
          <ConnectingScreen
            kind={online.connectionKind}
            step={online.connectionStep}
            roomCode={online.roomCode}
            onCancel={goToMenu}
          />
        </>
      );
    }

    return (
      <GameBoard
        gameState={online.clientState}
        onPlayCard={onlinePlayCard}
        onDiscardTwo={onlineDiscardTwo}
        onContributeStartDiscard={onlineContributeStartDiscard}
        onRematch={goToMenu}
        onMenu={goToMenu}
        selfAvatar={hubAvatar}
      />
    );
  }

  return null;
}

function writeRoomUrl(roomCode: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.delete('name');
  url.searchParams.delete('avatar');
  url.searchParams.delete('profileCode');
  if (roomCode) {
    url.searchParams.set('room', roomCode);
  } else {
    url.searchParams.delete('room');
  }
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}
