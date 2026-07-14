import { useEffect } from 'react'
import { useMidnightVerdict } from './hooks/useMidnightVerdict'
import { locale, t } from './i18n'
import { CloseIcon, MutedIcon, PhoneIcon, SearchIcon, SoundIcon } from './components/Icons'
import type { ShiftSummary } from './types'
import './MidnightVerdict.less'

const asset = (name: string) => `${import.meta.env.BASE_URL}img/${name}`

function gradeShift(summary: ShiftSummary): 'S' | 'A' | 'B' | 'C' | 'D' {
  let grade: 'S' | 'A' | 'B' | 'C' | 'D'
  if (summary.correct >= 8) grade = 'S'
  else if (summary.correct === 7) grade = 'A'
  else if (summary.correct === 6) grade = 'B'
  else if (summary.correct >= 4) grade = 'C'
  else grade = 'D'
  if (!summary.managerUsed) return grade
  const order: Array<'S' | 'A' | 'B' | 'C' | 'D'> = ['S', 'A', 'B', 'C', 'D']
  return order[Math.min(order.indexOf(grade) + 1, order.length - 1)]
}

export default function MidnightVerdict() {
  const game = useMidnightVerdict()
  const customer = game.currentCustomer
  const roundedTime = Math.ceil(game.timeLeft)
  const warning = roundedTime <= 5
  const normalCustomer = customer.normalAsset
  const revealedCustomer = customer.revealedAsset ?? normalCustomer
  const activeClue = customer.clues.find((clue) => clue.id === game.activeClue)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (game.phase !== 'playing') return
      if (event.key === '1' || event.key === '2' || event.key === '3') game.openClue(Number(event.key))
      if (event.key.toLowerCase() === 'h') game.submitVerdict('human')
      if (event.key.toLowerCase() === 'n') game.submitVerdict('night')
      if (event.key.toLowerCase() === 'm' && !game.managerUsed) game.submitVerdict(customer.identity, true)
      if (event.key === 'Escape') game.closeClue()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [customer.identity, game])

  const soundButton = (
    <button className="mv-icon-button" type="button" onClick={game.toggleMuted} aria-label={game.muted ? t('sound.on') : t('sound.off')}>
      {game.muted ? <MutedIcon /> : <SoundIcon />}
    </button>
  )

  return (
    <main className={`mv mv--${game.phase} mv--direction-c ${locale === 'en' ? 'mv--en' : ''}`}>
      <div className="mv__fluorescent" aria-hidden="true"><i/><i/><i/></div>

      {game.phase === 'start' && (
        <section className="mv-start">
          <header className="mv-start__topline"><span>{t('start.kicker')}</span>{soundButton}</header>
          <div className="mv-start__store" aria-hidden="true">
            <div className="mv-start__shelves"><i/><i/><i/><i/><i/><i/></div>
            <div className="mv-start__counter"><span>02:17</span></div>
          </div>
          <div className="mv-start__receipt">
            <p>{t('subtitle')}</p>
            <h1>{t('title')}</h1>
            <div className="mv-barcode" aria-hidden="true" />
            <p className="mv-start__copy">{t('start.copy')}</p>
            <button className="mv-button mv-button--primary" type="button" onPointerDown={game.beginBriefing}>{t('start.button')}</button>
            <small>{t('start.best')} · {game.bestScore.toString().padStart(4, '0')}</small>
          </div>
        </section>
      )}

      {game.phase === 'briefing' && (
        <section className="mv-briefing">
          <header className="mv-briefing__header"><span>{t('briefing.title')}</span>{soundButton}</header>
          <article className="mv-paper mv-briefing__paper">
            <div className="mv-briefing__number">0{game.briefingStep + 1}</div>
            <p>{t(`briefing.${game.briefingStep + 1}`)}</p>
            <div className="mv-briefing__holes" aria-label={`${game.briefingStep + 1} / 3`}>
              {[0, 1, 2].map((index) => <i key={index} className={index <= game.briefingStep ? 'is-active' : ''}/>)}
            </div>
            <button className="mv-button mv-button--primary" type="button" onPointerDown={game.nextBriefing}>
              {game.briefingStep === 2 ? t('briefing.open') : t('briefing.next')}
            </button>
          </article>
        </section>
      )}

      {(game.phase === 'playing' || game.phase === 'reveal') && (
        <section className={`mv-shift ${game.phase === 'reveal' ? 'is-revealing' : ''} ${game.phase === 'reveal' && customer.identity === 'night' ? 'is-night-reveal' : ''} ${game.result?.correct ? 'is-correct' : ''}`}>
          <header className="mv-hud">
            <div><span>{t('hud.customer')}</span><strong>{String(game.progress.current).padStart(2, '0')}/{String(game.progress.total).padStart(2, '0')}</strong></div>
            <div className={warning ? 'is-warning' : ''}><span>{t('hud.time')}</span><strong>{roundedTime.toString().padStart(2, '0')}</strong></div>
            <div><span>{t('hud.strikes')}</span><strong>{game.strikes}/3</strong></div>
            {soundButton}
          </header>

          <div className="mv-scene">
            <div className="mv-scene__freezer" aria-hidden="true"><i/><i/><i/></div>
            <img className="mv-scene__customer mv-scene__customer--normal" src={asset(normalCustomer)} alt="" draggable={false}/>
            <img className="mv-scene__customer mv-scene__customer--revealed" src={asset(revealedCustomer)} alt="" draggable={false}/>
            <div className="mv-scene__counter" aria-hidden="true"><div className="mv-scene__display">{t('hud.score')} {game.score.toString().padStart(4, '0')}</div></div>
            {game.phase === 'playing' && customer.clues.map((clue) => (
              <button
                className={`mv-clue ${game.checkedClues.includes(clue.id) ? 'is-checked' : ''}`}
                key={clue.id}
                type="button"
                style={{ left: `${clue.x}%`, top: `${clue.y}%` }}
                onClick={() => game.openClue(clue.id)}
                aria-label={`${t(clue.labelKey)}${game.checkedClues.includes(clue.id) ? ` · ${t('aria.checked')}` : ''}`}
              >
                <SearchIcon />
                <span>{clue.id}</span>
              </button>
            ))}
            {game.phase === 'reveal' && customer.identity === 'night' && <div className="mv-signal-tear" aria-hidden="true"/>}
          </div>

          <div className="mv-dialogue">
            <b>{t(customer.nameKey)}</b>
            <p>{t(customer.lineKey)}</p>
          </div>

          {game.phase === 'playing' && (
            <div className="mv-controls">
              <div className="mv-controls__status">
                <span>{game.streak >= 2 ? t('shift.streak', { n: game.streak }) : t('clue.prompt')}</span>
                {game.managerUsed && <span>{t('shift.managerUsed')}</span>}
              </div>
              <div className="mv-controls__verdicts">
                <button className="mv-stamp mv-stamp--human" type="button" onPointerDown={() => game.submitVerdict('human')}><span>H</span>{t('action.human')}</button>
                <button className="mv-stamp mv-stamp--night" type="button" onPointerDown={() => game.submitVerdict('night')}><span>N</span>{t('action.night')}</button>
              </div>
              <button className="mv-manager" type="button" disabled={game.managerUsed} onPointerDown={() => game.submitVerdict(customer.identity, true)}>
                <PhoneIcon />{game.managerUsed ? t('action.managerUsed') : t('action.manager')}
              </button>
            </div>
          )}

          {game.phase === 'reveal' && game.result && (
            <div className="mv-reveal" role="status">
              <article className="mv-paper mv-reveal__paper">
                <span className={`mv-reveal__stamp ${game.result.correct ? 'is-correct' : 'is-wrong'}`}>{game.result.correct ? t('reveal.correct') : t('reveal.wrong')}</span>
                <h2>{t(customer.identityKey)}</h2>
                <p>{game.result.managerUsed ? t('reveal.manager') : t(customer.reasonKey)}</p>
                <blockquote>{t(game.result.correct ? customer.correctReactionKey : customer.wrongReactionKey)}</blockquote>
                <div className="mv-reveal__score">+{game.result.scoreEarned}</div>
                <button className="mv-button mv-button--primary" type="button" onPointerDown={game.advance}>
                  {game.isLastCustomer ? t('reveal.finishShift') : t('reveal.nextCustomer')}
                </button>
              </article>
            </div>
          )}

          {activeClue && game.phase === 'playing' && (
            <div className="mv-clue-modal" role="dialog" aria-modal="true" aria-labelledby="mv-clue-title" onClick={game.closeClue}>
              <article className="mv-paper mv-clue-modal__paper" onClick={(event) => event.stopPropagation()}>
                <button className="mv-icon-button mv-clue-modal__close" type="button" onClick={game.closeClue} aria-label={t('aria.close')}><CloseIcon /></button>
                <span className="mv-clue-modal__paused">{t('clue.paused')}</span>
                <div
                  className="mv-clue-detail"
                  aria-hidden="true"
                  style={{ backgroundImage: `url(${asset(normalCustomer)})`, backgroundPosition: `${activeClue.x}% ${activeClue.y}%` }}
                />
                <small>{t(activeClue.labelKey)}</small>
                <h2 id="mv-clue-title">{t(activeClue.titleKey)}</h2>
                <p>{t(activeClue.copyKey)}</p>
                <button className="mv-button mv-button--ink" type="button" onClick={game.closeClue}>{t('clue.close')}</button>
              </article>
            </div>
          )}

          {game.suspended && game.phase === 'playing' && (
            <div className="mv-pause" role="dialog" aria-modal="true" aria-labelledby="mv-pause-title">
              <article className="mv-paper mv-pause__paper">
                <span>02:17 · HOLD</span>
                <h2 id="mv-pause-title">{t('pause.title')}</h2>
                <p>{t('pause.copy')}</p>
                <button className="mv-button mv-button--primary" type="button" onPointerDown={game.resume}>{t('pause.resume')}</button>
              </article>
            </div>
          )}
        </section>
      )}

      {game.phase === 'result' && game.summary && (
        <ResultScreen summary={game.summary} bestScore={game.bestScore} muted={game.muted} onToggleMuted={game.toggleMuted} onRestart={game.restart}/>
      )}

      <img className="mv__watermark" src={asset('aigram.svg')} alt="" draggable={false}/>
    </main>
  )
}

interface ResultScreenProps {
  summary: ShiftSummary
  bestScore: number
  muted: boolean
  onToggleMuted: () => void
  onRestart: () => void
}

function ResultScreen({ summary, bestScore, muted, onToggleMuted, onRestart }: ResultScreenProps) {
  const grade = gradeShift(summary)
  return (
    <section className="mv-result">
      <header className="mv-result__header">
        <span>{t('result.kicker')}</span>
        <button className="mv-icon-button" type="button" onClick={onToggleMuted} aria-label={muted ? t('sound.on') : t('sound.off')}>
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>
      </header>
      <article className="mv-paper mv-result__paper">
        <p className="mv-result__store">{t('subtitle')}</p>
        <h1>{t(summary.failed ? 'result.failedTitle' : 'result.completeTitle')}</h1>
        <div className="mv-result__grade"><span>{t('result.grade')}</span><strong>{grade}</strong></div>
        <dl>
          <div><dt>{t('result.score')}</dt><dd>{summary.score}</dd></div>
          <div><dt>{t('result.best')}</dt><dd>{bestScore}</dd></div>
          <div><dt>{t('result.correctCount')}</dt><dd>{summary.correct}/{summary.served}</dd></div>
          <div><dt>{t('result.maxStreak')}</dt><dd>{summary.maxStreak}</dd></div>
          <div><dt>{t('result.strikes')}</dt><dd>{summary.strikes}/3</dd></div>
        </dl>
        {summary.managerUsed && <p className="mv-result__penalty">{t('result.managerPenalty')}</p>}
        <p className="mv-result__comment">{t(`result.comment${grade}`)}</p>
        <div className="mv-barcode" aria-hidden="true" />
        <button className="mv-button mv-button--primary" type="button" onPointerDown={onRestart}>{t('result.again')}</button>
      </article>
    </section>
  )
}
