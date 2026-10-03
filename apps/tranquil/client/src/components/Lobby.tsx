import React, { useState, useEffect } from 'react';
import { useT } from '../i18n';
import type { MonsterCount } from '@tranquillity/shared';
import SettingsPanel from './SettingsPanel';

export type GameMode = 'local' | 'online_create' | 'online_join';

// Same hub every sibling Bergamots-launched game links back to — see
// coinchapp's `HomeTopBar.tsx` and `docs/DECISIONS.md` "Player identity contract".
const BERGAMOTS_HUB_URL = 'https://www.muchogames.win/';

interface Props {
  onStartLocal: (p1Name: string, p2Name: string, monsterCount: MonsterCount) => void;
  onStartBot: (playerName: string, monsterCount: MonsterCount) => void;
  onCreateOnline: (playerName: string, monsterCount: MonsterCount) => void;
  onJoinOnline: (roomCode: string, playerName: string) => void;
  onCancelRoom?: () => void;
  onlineRoomCode?: string;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
  initialRoomCode?: string;
  /** Pre-filled from the Bergamots hub's profile name (?name=), forwarded on
   *  launch exactly like ?lang= — see bergamots/docs/TECH.md "Player identity
   *  contract". Never required, never overwritten once the player edits it. */
  initialPlayerName?: string;
}

const DIFFICULTIES: { labelKey: string; count: MonsterCount; monsterCount: number }[] = [
  { labelKey: 'difficulty.standard', count: 0, monsterCount: 0 },
  { labelKey: 'difficulty.easy',     count: 3, monsterCount: 3 },
  { labelKey: 'difficulty.medium',   count: 4, monsterCount: 4 },
  { labelKey: 'difficulty.hard',     count: 5, monsterCount: 5 },
];

function clearBrowserData() {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(';').forEach(c => {
    const key = c.trim().split('=')[0];
    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
  window.location.reload();
}

export default function Lobby({ onStartLocal, onStartBot, onCreateOnline, onJoinOnline, onCancelRoom, onlineRoomCode, connectionStatus, errorMessage, initialRoomCode, initialPlayerName }: Props) {
  const t = useT();
  const [mode, setMode] = useState<'menu' | 'local' | 'bot' | 'create' | 'join'>('menu');
  const [showSettings, setShowSettings] = useState(false);
  const [p1, setP1] = useState(initialPlayerName || 'Player 1');
  const [p2, setP2] = useState('Player 2');
  const [myName, setMyName] = useState(initialPlayerName || '');
  const [roomCode, setRoomCode] = useState('');
  const [monsterCount, setMonsterCount] = useState<MonsterCount>(0);

  // If a room code was passed in via URL, switch directly to join mode with code pre-filled
  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setMode('join');
    }
  }, [initialRoomCode]);

  return (
    <div className="lobby-bg min-h-screen flex items-center justify-center">
      {/* Back to hub (top-left) / options (top-right) — same layout convention
          as the sibling Bergamots-hub games and coinchapp's home screen. */}
      <a
        href={BERGAMOTS_HUB_URL}
        className="icon-btn-float left-4 top-4"
        title={t('lobby.backToHub')}
        aria-label={t('lobby.backToHub')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </a>
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        className="icon-btn-float right-4 top-4"
        title={t('settings.title')}
        aria-label={t('lobby.settingsAria')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <style>{`
        .lobby-bg {
          background-image: url(/assets/dashboard-mobile.jpg);
          background-size: cover;
          background-position: center;
        }
        @media (min-width: 640px) {
          .lobby-bg {
            background-image: url(/assets/dashboard.jpg);
          }
        }
      `}</style>
      <div className="w-full max-w-sm flex flex-col gap-4 mx-6">

        {mode === 'menu' && (
          <>
            <div className="flex gap-2 justify-center text-black/80 text-xs font-semibold mb-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]">
              <span>{t('lobby.players')}</span><span>·</span><span>{t('lobby.cooperative')}</span><span>·</span><span>{t('lobby.duration')}</span>
            </div>
            {errorMessage && <p className="text-red-300 text-sm text-center">{errorMessage}</p>}
            <button className="btn-primary lobby-btn-size py-4 text-lg" onClick={() => setMode('local')}>
              {t('lobby.local')}
            </button>
            <button className="lobby-btn py-4 text-lg" onClick={() => setMode('bot')}>
              {t('lobby.vsBot')}
            </button>
            <button className="lobby-btn py-4 text-lg" onClick={() => setMode('create')}>
              {t('lobby.createOnline')}
            </button>
            <button className="lobby-btn py-4 text-lg" onClick={() => setMode('join')}>
              {t('lobby.joinOnline')}
            </button>
          </>
        )}

        {mode === 'local' && (
          <>
            <h2 className="text-xl font-bold text-white text-center">{t('lobby.localGame')}</h2>
            <label className="flex flex-col gap-1">
              <span className="text-white/80 text-sm">{t('lobby.player1Name')}</span>
              <input className="input-field" value={p1} onChange={e => setP1(e.target.value)} maxLength={20} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-white/80 text-sm">{t('lobby.player2Name')}</span>
              <input className="input-field" value={p2} onChange={e => setP2(e.target.value)} maxLength={20} />
            </label>
            <DifficultyPicker value={monsterCount} onChange={setMonsterCount} />
            <button className="lobby-btn py-3" onClick={() => onStartLocal(p1.trim() || 'Player 1', p2.trim() || 'Player 2', monsterCount)}>
              {t('lobby.startGame')}
            </button>
            <button className="lobby-btn-ghost py-2 text-sm" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
          </>
        )}

        {mode === 'bot' && (
          <>
            <h2 className="text-xl font-bold text-white text-center">{t('lobby.vsBotGame')}</h2>
            <label className="flex flex-col gap-1">
              <span className="text-white/80 text-sm">{t('lobby.yourName')}</span>
              <input className="input-field" value={myName} onChange={e => setMyName(e.target.value)} maxLength={20} placeholder={t('lobby.captainPlaceholder')} />
            </label>
            <DifficultyPicker value={monsterCount} onChange={setMonsterCount} />
            <button className="lobby-btn py-3" onClick={() => onStartBot(myName.trim() || 'Player 1', monsterCount)}>
              {t('lobby.startGame')}
            </button>
            <button className="lobby-btn-ghost py-2 text-sm" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
          </>
        )}

        {mode === 'create' && (
          <>
            <h2 className="text-xl font-bold text-white text-center">{t('lobby.createRoom')}</h2>
            {!onlineRoomCode ? (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-white/80 text-sm">{t('lobby.yourName')}</span>
                  <input className="input-field" value={myName} onChange={e => setMyName(e.target.value)} maxLength={20} placeholder={t('lobby.captainPlaceholder')} />
                </label>
                <DifficultyPicker value={monsterCount} onChange={setMonsterCount} />
                <button
                  className="lobby-btn py-3"
                  disabled={connectionStatus === 'connecting'}
                  onClick={() => onCreateOnline(myName.trim() || 'Captain', monsterCount)}
                >
                  {connectionStatus === 'connecting' ? t('lobby.connecting') : t('lobby.createRoom')}
                </button>
              </>
            ) : (
              <div className="text-center">
                <p className="text-white/80 text-sm mb-3">{t('lobby.shareCode')}</p>
                <div className="text-4xl font-bold text-yellow-400 tracking-widest bg-black/30 rounded-xl py-4 mb-3">
                  {onlineRoomCode}
                </div>
                <p className="text-white/60 text-xs">{t('lobby.waitingPartner')}</p>
              </div>
            )}
            {errorMessage && <p className="text-red-300 text-sm text-center">{errorMessage}</p>}
            {!onlineRoomCode
              ? <button className="lobby-btn-ghost py-2 text-sm" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
              : <button className="lobby-btn-ghost py-2 text-sm" onClick={() => onCancelRoom?.()}>{t('lobby.cancelRoom')}</button>
            }
          </>
        )}

        {mode === 'join' && (
          <>
            <h2 className="text-xl font-bold text-white text-center">{t('lobby.joinRoom')}</h2>
            <label className="flex flex-col gap-1">
              <span className="text-white/80 text-sm">{t('lobby.yourName')}</span>
              <input className="input-field" value={myName} onChange={e => setMyName(e.target.value)} maxLength={20} placeholder={t('lobby.sailorPlaceholder')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-white/80 text-sm">{t('lobby.roomCode')}</span>
              <input
                className="input-field uppercase tracking-widest text-center text-lg"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="ABC"
              />
            </label>
            <button
              className="lobby-btn py-3"
              disabled={connectionStatus === 'connecting' || roomCode.length < 3}
              onClick={() => onJoinOnline(roomCode, myName.trim() || 'Sailor')}
            >
              {connectionStatus === 'connecting' ? t('lobby.joining') : t('lobby.join')}
            </button>
            {errorMessage && <p className="text-red-300 text-sm text-center">{errorMessage}</p>}
            <button className="lobby-btn-ghost py-2 text-sm" onClick={() => setMode('menu')}>{t('lobby.back')}</button>
          </>
        )}

      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="px-3 py-1.5 rounded-full bg-black/30 text-white/30 text-xs font-mono select-none">
          v0.8.1
        </span>
        <button
          onClick={clearBrowserData}
          title={t('lobby.resetTitle')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 text-white/50 hover:text-white hover:bg-black/50 transition-all text-xs"
          aria-label={t('lobby.resetAria')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          {t('lobby.reset')}
        </button>

        <a
          href="https://website.cdn77.luckyduckgames.com/downloads/October2021/ae6c8593a374f0938eeef5ab872f96ab.pdf"
          target="_blank"
          rel="noopener noreferrer"
          title={t('lobby.rulesTitle')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 text-white/50 hover:text-white hover:bg-black/50 transition-all text-xs"
          aria-label={t('lobby.rulesAria')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {t('lobby.rules')}
        </a>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function DifficultyPicker({ value, onChange }: { value: MonsterCount; onChange: (v: MonsterCount) => void }) {
  const t = useT();

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-ocean-300 text-sm">{t('difficulty.title')}</span>
      <div className="grid grid-cols-4 gap-1.5">
        {DIFFICULTIES.map(d => (
          <button
            key={d.count}
            type="button"
            onClick={() => onChange(d.count)}
            className={[
              'rounded-lg py-2 text-xs font-semibold border transition-all',
              value === d.count
                ? 'bg-ocean-500 border-ocean-400 text-white'
                : 'bg-ocean-800/60 border-ocean-700/40 text-ocean-400 hover:border-ocean-500/60',
            ].join(' ')}
          >
            <div>{t(d.labelKey)}</div>
            <div className={`text-[9px] mt-0.5 ${value === d.count ? 'text-ocean-200' : 'text-ocean-600'}`}>
              {d.monsterCount === 0 ? t('difficulty.noMonsters') : t('difficulty.monsters', { count: d.monsterCount })}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
