import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    ...options,
  }).format(new Date(date))
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date))
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2)
}

export function oddsToImpliedProb(odds: number): number {
  return 1 / odds
}

export function removeOverround(probs: number[]): number[] {
  const sum = probs.reduce((a, b) => a + b, 0)
  return probs.map(p => p / sum)
}

export function impliedProbToOdds(prob: number): number {
  return 1 / prob
}

export function calculateEdge(modelProb: number, marketProb: number): number {
  return modelProb - marketProb
}

export function getEdgeClass(edge: number): string {
  if (edge > 0.05) return 'text-accent-success'
  if (edge < -0.05) return 'text-accent-danger'
  return 'text-text-secondary'
}

export function getFormColor(result: string): string {
  switch (result.toUpperCase()) {
    case 'W': return 'bg-accent-success'
    case 'D': return 'bg-accent-warning'
    case 'L': return 'bg-accent-danger'
    default: return 'bg-terminal-muted'
  }
}

export function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
}

function factorial(n: number): number {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

export function generateScorelineDistribution(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals: number = 6
): { home: number; away: number; prob: number }[] {
  const distribution: { home: number; away: number; prob: number }[] = []
  
  for (let home = 0; home <= maxGoals; home++) {
    for (let away = 0; away <= maxGoals; away++) {
      const prob = poissonProbability(lambdaHome, home) * poissonProbability(lambdaAway, away)
      distribution.push({ home, away, prob })
    }
  }
  
  return distribution.sort((a, b) => b.prob - a.prob)
}

export function calculate1X2Probabilities(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals: number = 10
): { home: number; draw: number; away: number } {
  let home = 0
  let draw = 0
  let away = 0
  
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = poissonProbability(lambdaHome, h) * poissonProbability(lambdaAway, a)
      if (h > a) home += prob
      else if (h === a) draw += prob
      else away += prob
    }
  }
  
  return { home, draw, away }
}

export function calculateOverUnderProbabilities(
  lambdaHome: number,
  lambdaAway: number,
  line: number = 2.5,
  maxGoals: number = 10
): { over: number; under: number } {
  let over = 0
  let under = 0
  
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = poissonProbability(lambdaHome, h) * poissonProbability(lambdaAway, a)
      if (h + a > line) over += prob
      else under += prob
    }
  }
  
  return { over, under }
}

export function calculateBTTSProbabilities(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals: number = 10
): { yes: number; no: number } {
  let yes = 0
  let no = 0
  
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = poissonProbability(lambdaHome, h) * poissonProbability(lambdaAway, a)
      if (h > 0 && a > 0) yes += prob
      else no += prob
    }
  }
  
  return { yes, no }
}

export function getStatusText(status: string, elapsed?: number | null): string {
  switch (status) {
    case 'NS': return 'Not Started'
    case 'TBD': return 'TBD'
    case '1H': return `${elapsed}'`
    case 'HT': return 'HT'
    case '2H': return `${elapsed}'`
    case 'ET': return `ET ${elapsed}'`
    case 'P': return 'Penalties'
    case 'FT': return 'FT'
    case 'AET': return 'AET'
    case 'PEN': return 'PEN'
    case 'BT': return 'Break'
    case 'SUSP': return 'Suspended'
    case 'INT': return 'Interrupted'
    case 'PST': return 'Postponed'
    case 'CANC': return 'Cancelled'
    case 'ABD': return 'Abandoned'
    case 'AWD': return 'Awarded'
    case 'WO': return 'Walkover'
    default: return status
  }
}

export function isLiveStatus(status: string): boolean {
  return ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(status)
}

