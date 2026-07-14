export type GamePhase = 'start' | 'briefing' | 'playing' | 'reveal' | 'result'
export type Verdict = 'human' | 'night'
export type NightRuleId = 'mirror' | 'paper' | 'physics' | 'timing'
export type RewardChoice = 'time' | 'manager'

export interface VerdictResult {
  verdict: Verdict
  correct: boolean
  managerUsed: boolean
  scoreEarned: number
}

export interface ShiftSummary {
  score: number
  correct: number
  served: number
  maxStreak: number
  strikes: number
  managerUsed: boolean
  failed: boolean
}
