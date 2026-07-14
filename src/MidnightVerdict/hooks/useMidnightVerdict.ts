import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createShiftDeck } from '../customers'
import type { CustomerSpec } from '../customers'
import type { GamePhase, ShiftSummary, Verdict, VerdictResult } from '../types'
import { sounds } from '../utils/sounds'

const ROUND_SECONDS = 18
const BEST_KEY = 'midnight_verdict_best'
const MUTED_KEY = 'midnight_verdict_muted'

export function useMidnightVerdict() {
  const [phase, setPhase] = useState<GamePhase>('start')
  const [briefingStep, setBriefingStep] = useState(0)
  const [deck, setDeck] = useState<CustomerSpec[]>(() => createShiftDeck())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [activeClue, setActiveClue] = useState<number | null>(null)
  const [checkedClues, setCheckedClues] = useState<number[]>([])
  const [result, setResult] = useState<VerdictResult | null>(null)
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [suspended, setSuspended] = useState(false)
  const [score, setScore] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [managerUsed, setManagerUsed] = useState(false)
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem(BEST_KEY) ?? 0))
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTED_KEY) === '1')
  const submissionLock = useRef(false)
  const lastTick = useRef(ROUND_SECONDS)
  const currentCustomer = deck[currentIndex]

  const resetCustomer = useCallback(() => {
    setTimeLeft(ROUND_SECONDS)
    lastTick.current = ROUND_SECONDS
    setCheckedClues([])
    setActiveClue(null)
    setResult(null)
    setSuspended(false)
    submissionLock.current = false
  }, [])

  const beginBriefing = useCallback(() => {
    sounds.stamp(muted)
    setBriefingStep(0)
    setPhase('briefing')
  }, [muted])

  const beginRound = useCallback(() => {
    setDeck(createShiftDeck())
    setCurrentIndex(0)
    setScore(0)
    setStrikes(0)
    setCorrectCount(0)
    setStreak(0)
    setMaxStreak(0)
    setManagerUsed(false)
    setSummary(null)
    resetCustomer()
    setPhase('playing')
  }, [resetCustomer])

  const nextBriefing = useCallback(() => {
    if (briefingStep >= 2) beginRound()
    else setBriefingStep((step) => step + 1)
  }, [beginRound, briefingStep])

  const openClue = useCallback((index: number) => {
    if (phase !== 'playing' || suspended || submissionLock.current) return
    setActiveClue(index)
    setCheckedClues((current) => current.includes(index) ? current : [...current, index])
    sounds.clueOpen(muted)
  }, [muted, phase, suspended])

  const closeClue = useCallback(() => {
    if (activeClue === null) return
    setActiveClue(null)
    sounds.clueClose(muted)
  }, [activeClue, muted])

  const submitVerdict = useCallback((verdict: Verdict, viaManager = false) => {
    if (phase !== 'playing' || suspended || submissionLock.current || !currentCustomer) return
    if (viaManager && managerUsed) return
    submissionLock.current = true
    const isCorrect = viaManager || verdict === currentCustomer.identity
    const comboBonus = isCorrect && !viaManager ? Math.min(streak * 25, 100) : 0
    const earned = viaManager ? 0 : isCorrect ? 100 + Math.floor(timeLeft) * 5 + comboBonus : 0
    const nextStreak = isCorrect && !viaManager ? streak + 1 : 0
    if (viaManager) setManagerUsed(true)
    if (isCorrect && !viaManager) setCorrectCount((count) => count + 1)
    if (!isCorrect) setStrikes((count) => count + 1)
    setStreak(nextStreak)
    setMaxStreak((current) => Math.max(current, nextStreak))
    setScore((current) => current + earned)
    sounds.stamp(muted)
    window.setTimeout(() => {
      if (isCorrect) sounds.correct(muted)
      else sounds.wrong(muted)
      setResult({
        verdict: viaManager ? currentCustomer.identity : verdict,
        correct: isCorrect,
        managerUsed: viaManager,
        scoreEarned: earned,
      })
      setPhase('reveal')
    }, 140)
  }, [currentCustomer, managerUsed, muted, phase, streak, suspended, timeLeft])

  const finishShift = useCallback(() => {
    const failed = strikes >= 3
    const nextSummary: ShiftSummary = {
      score,
      correct: correctCount,
      served: currentIndex + 1,
      maxStreak,
      strikes,
      managerUsed,
      failed,
    }
    setSummary(nextSummary)
    const nextBest = Math.max(bestScore, score)
    setBestScore(nextBest)
    try {
      localStorage.setItem(BEST_KEY, String(nextBest))
    } catch {
      // The current result remains visible when storage is unavailable.
    }
    setPhase('result')
  }, [bestScore, correctCount, currentIndex, managerUsed, maxStreak, score, strikes])

  const advance = useCallback(() => {
    if (strikes >= 3 || currentIndex >= deck.length - 1) {
      finishShift()
      return
    }
    setCurrentIndex((index) => index + 1)
    resetCustomer()
    setPhase('playing')
  }, [currentIndex, deck.length, finishShift, resetCustomer, strikes])

  const restart = useCallback(() => {
    setPhase('start')
    setBriefingStep(0)
    setResult(null)
    setSummary(null)
    setActiveClue(null)
    setSuspended(false)
    submissionLock.current = false
  }, [])

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current
      try {
        localStorage.setItem(MUTED_KEY, next ? '1' : '0')
      } catch {
        // Audio preference can remain session-only.
      }
      return next
    })
  }, [])

  const resume = useCallback(() => setSuspended(false), [])

  useEffect(() => {
    if (phase !== 'playing' || activeClue !== null || suspended) return
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        const next = Math.max(0, current - 0.1)
        const whole = Math.ceil(next)
        if (whole <= 5 && whole < lastTick.current) sounds.tick(muted)
        lastTick.current = whole
        if (next <= 0) window.setTimeout(() => submitVerdict(currentCustomer.identity === 'night' ? 'human' : 'night'), 0)
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [activeClue, currentCustomer, muted, phase, submitVerdict, suspended])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && phase === 'playing') setSuspended(true)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [phase])

  const isLastCustomer = currentIndex >= deck.length - 1 || strikes >= 3
  const progress = useMemo(() => ({ current: currentIndex + 1, total: deck.length }), [currentIndex, deck.length])

  return {
    phase,
    briefingStep,
    currentCustomer,
    progress,
    isLastCustomer,
    timeLeft,
    activeClue,
    checkedClues,
    result,
    summary,
    score,
    bestScore,
    strikes,
    correctCount,
    streak,
    maxStreak,
    managerUsed,
    muted,
    suspended,
    beginBriefing,
    nextBriefing,
    openClue,
    closeClue,
    submitVerdict,
    advance,
    restart,
    toggleMuted,
    resume,
  }
}
