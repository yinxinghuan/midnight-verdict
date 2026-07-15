import type { Verdict } from './types'

export interface CustomerClue {
  id: number
  labelKey: string
  titleKey: string
  copyKey: string
  x: number
  y: number
}

export interface CustomerSpec {
  id: string
  identity: Verdict
  nameKey: string
  lineKey: string
  identityKey: string
  reasonKey: string
  correctReactionKey: string
  wrongReactionKey: string
  normalAsset: string
  revealedAsset?: string
  clues: CustomerClue[]
}

const clue = (customer: string, id: number, x: number, y: number): CustomerClue => ({
  id,
  labelKey: `customers.${customer}.clue${id}.label`,
  titleKey: `customers.${customer}.clue${id}.title`,
  copyKey: `customers.${customer}.clue${id}.copy`,
  x,
  y,
})

function customer(id: string, identity: Verdict, points: Array<[number, number]>): CustomerSpec {
  return {
    id,
    identity,
    nameKey: `customers.${id}.name`,
    lineKey: `customers.${id}.line`,
    identityKey: `customers.${id}.identity`,
    reasonKey: `customers.${id}.reason`,
    correctReactionKey: `customers.${id}.correct`,
    wrongReactionKey: `customers.${id}.wrong`,
    normalAsset: `customers/${id}-normal.jpg`,
    revealedAsset: identity === 'night' ? `customers/${id}-revealed.jpg` : undefined,
    clues: points.map(([x, y], index) => clue(id, index + 1, x, y)),
  }
}

export const CUSTOMERS: CustomerSpec[] = [
  customer('lin', 'human', [[24, 73], [75, 24], [48, 68]]),
  customer('omar', 'human', [[27, 70], [76, 27], [52, 62]]),
  customer('jun', 'human', [[25, 72], [77, 25], [48, 62]]),
  customer('eve', 'human', [[25, 70], [77, 25], [53, 64]]),
  customer('hassan', 'human', [[24, 72], [77, 25], [52, 64]]),
  customer('rosa', 'human', [[26, 70], [78, 26], [51, 61]]),
  customer('theo', 'human', [[24, 72], [76, 25], [51, 63]]),
  customer('nia', 'human', [[42, 63], [56, 69], [70, 64]]),
  customer('farah', 'human', [[37, 59], [58, 70], [77, 25]]),
  customer('mateo', 'human', [[40, 70], [54, 34], [58, 66]]),
  customer('anika', 'human', [[41, 66], [36, 76], [60, 70]]),
  customer('ivo', 'human', [[37, 62], [56, 63], [73, 75]]),
  customer('grace', 'human', [[36, 53], [39, 65], [58, 72]]),
  customer('sol', 'human', [[38, 62], [49, 69], [58, 68]]),
  customer('yuki', 'human', [[39, 61], [55, 69], [49, 64]]),
  customer('dalia', 'human', [[38, 68], [53, 65], [43, 75]]),
  customer('ravi', 'human', [[36, 63], [45, 69], [61, 63]]),
  customer('chen', 'human', [[40, 62], [50, 67], [59, 66]]),
  customer('leila', 'human', [[40, 63], [56, 65], [59, 38]]),
  customer('mira', 'night', [[24, 72], [79, 23], [45, 63]]),
  customer('tuesday', 'night', [[23, 70], [76, 25], [51, 61]]),
  customer('lumen', 'night', [[25, 71], [78, 24], [51, 61]]),
  customer('echo', 'night', [[24, 71], [76, 25], [50, 62]]),
  customer('paper', 'night', [[24, 71], [77, 25], [50, 62]]),
  customer('seam', 'night', [[58, 53], [42, 64], [61, 70]]),
  customer('rain', 'night', [[38, 59], [56, 69], [65, 52]]),
  customer('vacancy', 'night', [[37, 60], [54, 53], [68, 74]]),
  customer('wax', 'night', [[40, 62], [55, 68], [54, 30]]),
  customer('tide', 'night', [[39, 62], [55, 67], [68, 69]]),
  customer('blank', 'night', [[38, 60], [58, 65], [50, 74]]),
]

const TUTORIAL_CUSTOMER = CUSTOMERS[0]
const HUMAN_POOL = CUSTOMERS.filter((item) => item.identity === 'human' && item.id !== TUTORIAL_CUSTOMER.id)
const NIGHT_POOL = CUSTOMERS.filter((item) => item.identity === 'night')

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[target]] = [next[target], next[index]]
  }
  return next
}

export function createShiftDeck(): CustomerSpec[] {
  const humans = shuffle(HUMAN_POOL).slice(0, 4)
  const nights = shuffle(NIGHT_POOL).slice(0, 3)
  return [TUTORIAL_CUSTOMER, ...shuffle([...humans, ...nights])]
}
