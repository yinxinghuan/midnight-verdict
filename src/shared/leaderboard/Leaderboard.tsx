import { useEffect, useState } from 'react';
import { openAigramProfile } from '../runtime/bridge';
import type { LeaderboardEntry } from './useGameScore';
import './Leaderboard.less';

// ─── Built-in i18n (no dependency on game's i18n) ────────────────────────

const STRINGS = {
  zh: {
    title: '排行榜',
    me: '我',
    empty: '暂无记录，快来第一个上榜！',
    openInAlterU: '在 AlterU 中打开即可查看排行榜',
    downloadAlterU: '下载 AlterU',
  },
  en: {
    title: 'Leaderboard',
    me: 'me',
    empty: 'No records yet. Be the first!',
    openInAlterU: 'Open in AlterU to view the leaderboard.',
    downloadAlterU: 'Get AlterU',
  },
} as const;

function detectLang(): 'zh' | 'en' {
  try {
    const override = localStorage.getItem('game_locale');
    if (override === 'zh' || override === 'en') return override;
  } catch { /* ignore */ }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const s = STRINGS[detectLang()];

// ─── Sub-components ───────────────────────────────────────────────────────

function Avatar({ url, name, size = 40 }: { url: string; name: string; size?: number }) {
  return (
    <div className="lb-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {url
        ? <img src={url} alt="" draggable={false} />
        : <span>{name.charAt(0).toUpperCase()}</span>
      }
    </div>
  );
}

function RowContent({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return <>
    <div className="lb-row__rank"><span className={index < 3 ? 'lb-row__medal' : 'lb-row__num'}>{index + 1}</span></div>
    <Avatar url={entry.avatar_url} name={entry.name} size={index < 3 ? 44 : 38} />
    <div className="lb-row__info">
      <span className="lb-row__name">{entry.name}</span>
      {entry.isMe && <span className="lb-row__me">{s.me}</span>}
    </div>
    <span className="lb-row__score">{entry.score.toLocaleString()}</span>
  </>;
}

// ─── Props ────────────────────────────────────────────────────────────────

interface Props {
  gameName: string;
  isInAigram: boolean;
  onClose: () => void;
  fetch: () => Promise<LeaderboardEntry[]>;
}

const ALTERU_APP_URL = 'https://alteru.app';

function RankIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M9 18h6M12 13v5M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function Leaderboard({ gameName, isInAigram, onClose, fetch }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInAigram) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    fetch()
      .then(data => { if (alive) setEntries(data); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [fetch, isInAigram]);

  return (
    <div className="lb-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lb-panel">

        {/* Header */}
        <div className="lb-header">
          <div className="lb-header__left">
            <span className="lb-header__icon"><RankIcon /></span>
            <div>
              <div className="lb-header__title">{s.title}</div>
              <div className="lb-header__game">{gameName}</div>
            </div>
          </div>
          <button className="lb-close" type="button" onClick={onClose} aria-label="Close leaderboard"><CloseIcon /></button>
        </div>

        {/* List */}
        <div className="lb-body">
          {loading && (
            <div className="lb-state">
              <span className="lb-spinner" />
            </div>
          )}

          {!loading && !isInAigram && (
            <div className="lb-state lb-state--download">
              <span className="lb-state__icon"><RankIcon /></span>
              <span className="lb-state__text">{s.openInAlterU}</span>
              <a
                className="lb-state__download"
                href={ALTERU_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.downloadAlterU}
              </a>
            </div>
          )}

          {!loading && isInAigram && entries.length === 0 && (
            <div className="lb-state">
              <span className="lb-state__icon"><RankIcon /></span>
              <span className="lb-state__text">{s.empty}</span>
            </div>
          )}

          {!loading && isInAigram && entries.map((entry, i) => entry.isMe ? (
            <div key={entry.user_id} className={`lb-row lb-row--me ${i < 3 ? 'lb-row--top' : ''}`}>
              <RowContent entry={entry} index={i} />
            </div>
          ) : (
            <button key={entry.user_id} type="button" className={`lb-row lb-row--clickable ${i < 3 ? 'lb-row--top' : ''}`} onClick={() => openAigramProfile(entry.user_id)}>
              <RowContent entry={entry} index={i} />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
