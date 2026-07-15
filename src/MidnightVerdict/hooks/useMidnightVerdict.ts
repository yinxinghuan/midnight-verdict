import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createShiftDeck } from '../customers'
import type { CustomerSpec } from '../customers'
import type { GamePhase, NightRuleId, RewardChoice, ShiftSummary, Verdict, VerdictResult } from '../types'
import { sounds } from '../utils/sounds'

const ROUND_SECONDS = 18
const BEST_KEY = 'midnight_verdict_best'
const MUTED_KEY = 'midnight_verdict_muted'
const NIGHT_RULES: NightRuleId[] = ['mirror', 'paper', 'physics', 'timing']

function drawNightRules(): NightRuleId[] {
  return [...NIGHT_RULES].sort(() => Math.random() - 0.5).slice(0, 2)
}

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
  const [managerEverUsed, setManagerEverUsed] = useState(false)
  const [nightRules, setNightRules] = useState<NightRuleId[]>(() => drawNightRules())
  const [rewardPending, setRewardPending] = useState(false)
  const [nextRoundBonus, setNextRoundBonus] = useState(0)
  const [deepInspectPulse, setDeepInspectPulse] = useState(0)
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem(BEST_KEY) ?? 0))
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTED_KEY) === '1')
  const submissionLock = useRef(false)
  const lastTick = useRef(ROUND_SECONDS)
  const currentCustomer = deck[currentIndex]
  const nextCustomer = deck[currentIndex + 1] ?? null

  const resetCustomer = useCallback((seconds = ROUND_SECONDS) => {
    setTimeLeft(seconds)
    lastTick.current = seconds
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
    setManagerEverUsed(false)
    setNightRules(drawNightRules())
    setRewardPending(false)
    setNextRoundBonus(0)
    setDeepInspectPulse(0)
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
    const isNewDeepInspect = !checkedClues.includes(index) && checkedClues.length >= 2
    if (isNewDeepInspect) {
      setTimeLeft((current) => Math.max(0.1, current - 2))
      setDeepInspectPulse((value) => value + 1)
      sounds.deepInspect(muted)
    }
    setActiveClue(index)
    setCheckedClues((current) => current.includes(index) ? current : [...current, index])
    sounds.clueOpen(muted)
  }, [checkedClues, muted, phase, suspended])

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
    const timeBonus = Math.min(ROUND_SECONDS, Math.floor(timeLeft)) * 5
    const earned = viaManager ? 0 : isCorrect ? 100 + timeBonus + comboBonus : 0
    const nextStreak = isCorrect && !viaManager ? streak + 1 : 0
    if (viaManager) {
      setManagerUsed(true)
      setManagerEverUsed(true)
    }
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
      if (!viaManager && isCorrect && currentIndex < deck.length - 1 && (nextStreak === 3 || nextStreak === 6)) {
        setRewardPending(true)
        sounds.reward(muted)
      }
      setPhase('reveal')
    }, 140)
  }, [currentCustomer, currentIndex, deck.length, managerUsed, muted, phase, streak, suspended, timeLeft])

  const finishShift = useCallback(() => {
    const failed = strikes >= 3
    const nextSummary: ShiftSummary = {
      score,
      correct: correctCount,
      served: currentIndex + 1,
      maxStreak,
      strikes,
      managerUsed: managerEverUsed,
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
  }, [bestScore, correctCount, currentIndex, managerEverUsed, maxStreak, score, strikes])

  const chooseReward = useCallback((choice: RewardChoice) => {
    if (!rewardPending) return
    if (choice === 'manager' && !managerUsed) return
    if (choice === 'time') setNextRoundBonus(3)
    else setManagerUsed(false)
    setRewardPending(false)
    sounds.reward(muted)
  }, [managerUsed, muted, rewardPending])

  const advance = useCallback(() => {
    if (strikes >= 3 || currentIndex >= deck.length - 1) {
      finishShift()
      return
    }
    setCurrentIndex((index) => index + 1)
    resetCustomer(ROUND_SECONDS + nextRoundBonus)
    setNextRoundBonus(0)
    setPhase('playing')
  }, [currentIndex, deck.length, finishShift, nextRoundBonus, resetCustomer, strikes])

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
    nextCustomer,
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
    nightRules,
    rewardPending,
    nextRoundBonus,
    deepInspectPulse,
    muted,
    suspended,
    beginBriefing,
    nextBriefing,
    openClue,
    closeClue,
    submitVerdict,
    chooseReward,
    advance,
    restart,
    toggleMuted,
    resume,
  }
}
