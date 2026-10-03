import React, { useState } from 'react';
import { useSettings } from '../settings';
import { useT, LanguageSwitcher } from '../i18n';
import { getMatchResultStats } from '../lib/matchResultStats';

// The hub's "Report a problem" dialog, pre-filled with this game's hub id;
// reports land in the hub's admin inbox.
const HUB_FEEDBACK_URL = 'https://www.muchogames.win/?feedback=tranquil';

interface Props {
  onClose: () => void;
  onRestartGame?: () => void;
  roomCode?: string;
}

export default function SettingsPanel({ onClose, onRestartGame, roomCode }: Props) {
  const t = useT();
  const { settings, update } = useSettings();
  const [stats] = useState(() => getMatchResultStats());

  function handleRestart() {
    onClose();
    onRestartGame?.();
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-ocean-900 border border-ocean-700 rounded-2xl p-5 w-72 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-base">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="text-ocean-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {roomCode && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/80 text-sm">{t('settings.roomCode')}</span>
              <span className="text-lg font-bold text-yellow-400 tracking-widest bg-black/30 border border-yellow-500/30 rounded px-2.5 py-0.5 select-all">
                {roomCode}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-white/80 text-sm">{t('settings.language')}</span>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-white/80 text-sm">{t('settings.myStats')}</span>
            <span className="text-sm font-bold text-white/90">
              {t('settings.wins')} {stats.wins} · {t('settings.losses')} {stats.losses}
            </span>
          </div>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-white/80 text-sm">{t('settings.soundOnMyTurn')}</span>
            <Toggle
              value={settings.soundOnMyTurn}
              onChange={v => update({ soundOnMyTurn: v })}
            />
          </label>

          <a
            href={HUB_FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-id="settings-feedback-link"
            className="w-full py-2 rounded-xl bg-ocean-800 hover:bg-ocean-700 text-center text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            {t('settings.reportProblem')}
          </a>

          {onRestartGame && (
            <>
              <div className="border-t border-ocean-700/60" />
              <button
                onClick={handleRestart}
                className="w-full py-2 rounded-xl bg-ocean-800 hover:bg-ocean-700 text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                {t('settings.restartGame')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={[
        'relative shrink-0 w-11 h-6 rounded-full transition-colors',
        value ? 'bg-ocean-500' : 'bg-ocean-700',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          value ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}
