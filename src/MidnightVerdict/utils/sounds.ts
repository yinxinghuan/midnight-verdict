let context: AudioContext | null = null

function getContext() {
  if (!context) context = new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

function tone(
  from: number,
  to: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  delay = 0,
) {
  const ctx = getContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const start = ctx.currentTime + delay
  const end = start + duration
  oscillator.type = type
  oscillator.frequency.setValueAtTime(from, start)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), end)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(end + 0.02)
}

export const sounds = {
  clueOpen(muted: boolean) {
    if (!muted) tone(620, 760, 0.08, 'sine', 0.1)
  },
  clueClose(muted: boolean) {
    if (!muted) tone(520, 420, 0.07, 'sine', 0.07)
  },
  deepInspect(muted: boolean) {
    if (!muted) tone(310, 220, 0.09, 'square', 0.07)
  },
  stamp(muted: boolean) {
    if (!muted) tone(180, 95, 0.09, 'triangle', 0.12)
  },
  correct(muted: boolean) {
    if (muted) return
    tone(440, 440, 0.07, 'triangle', 0.1)
    tone(554, 554, 0.07, 'triangle', 0.1, 0.095)
    tone(659, 659, 0.09, 'triangle', 0.11, 0.19)
  },
  wrong(muted: boolean) {
    if (!muted) tone(150, 72, 0.28, 'sawtooth', 0.1)
  },
  tick(muted: boolean) {
    if (!muted) tone(880, 880, 0.045, 'square', 0.045)
  },
  reward(muted: boolean) {
    if (muted) return
    tone(523, 523, 0.065, 'triangle', 0.08)
    tone(659, 659, 0.065, 'triangle', 0.09, 0.075)
    tone(784, 784, 0.08, 'triangle', 0.1, 0.15)
  },
}
