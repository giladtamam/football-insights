// Odds & Probability Utilities

/**
 * Convert decimal odds to implied probability
 */
export function oddsToImpliedProbability(odds: number): number {
  if (odds <= 0) return 0;
  return 1 / odds;
}

/**
 * Convert implied probability to decimal odds
 */
export function probabilityToOdds(probability: number): number {
  if (probability <= 0 || probability >= 1) return 0;
  return 1 / probability;
}

/**
 * Calculate overround (vig/juice) from odds
 */
export function calculateOverround(odds: number[]): number {
  const impliedProbs = odds.map(oddsToImpliedProbability);
  return impliedProbs.reduce((sum, p) => sum + p, 0) - 1;
}

/**
 * Remove vig from odds to get fair probabilities
 */
export function removeVig(odds: number[]): number[] {
  const impliedProbs = odds.map(oddsToImpliedProbability);
  const total = impliedProbs.reduce((sum, p) => sum + p, 0);
  return impliedProbs.map(p => p / total);
}

// Date Utilities

/**
 * Format date for display
 */
export function formatMatchDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format time only
 */
export function formatMatchTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Check if match is starting within N hours
 */
export function isStartingSoon(date: Date, hours: number = 3): boolean {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hoursInMs = hours * 60 * 60 * 1000;
  return diff > 0 && diff <= hoursInMs;
}

// xG & Statistics Utilities

/**
 * Calculate finishing delta (goals - xG)
 */
export function calculateFinishingDelta(goals: number, xg: number): number {
  return goals - xg;
}

/**
 * Calculate form string from results
 */
export function calculateFormString(results: ('W' | 'D' | 'L')[], limit: number = 5): string {
  return results.slice(0, limit).join('');
}

/**
 * Calculate points from results
 */
export function calculatePoints(results: ('W' | 'D' | 'L')[]): number {
  return results.reduce((points, result) => {
    if (result === 'W') return points + 3;
    if (result === 'D') return points + 1;
    return points;
  }, 0);
}

/**
 * Round xG to 2 decimal places
 */
export function formatXg(xg: number | null): string {
  if (xg === null) return '-';
  return xg.toFixed(2);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Status Utilities

/**
 * Check if fixture is live
 */
export function isFixtureLive(status: string): boolean {
  return ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(status);
}

/**
 * Check if fixture is finished
 */
export function isFixtureFinished(status: string): boolean {
  return ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status);
}

/**
 * Check if fixture is upcoming
 */
export function isFixtureUpcoming(status: string): boolean {
  return ['TBD', 'NS'].includes(status);
}

/**
 * Get human-readable status
 */
export function getStatusText(status: string, elapsed?: number | null): string {
  switch (status) {
    case 'TBD': return 'TBD';
    case 'NS': return 'Not Started';
    case '1H': return elapsed ? `${elapsed}'` : '1st Half';
    case 'HT': return 'Half Time';
    case '2H': return elapsed ? `${elapsed}'` : '2nd Half';
    case 'ET': return elapsed ? `${elapsed}'` : 'Extra Time';
    case 'P': return 'Penalties';
    case 'FT': return 'Full Time';
    case 'AET': return 'AET';
    case 'PEN': return 'Penalties';
    case 'BT': return 'Break';
    case 'SUSP': return 'Suspended';
    case 'INT': return 'Interrupted';
    case 'PST': return 'Postponed';
    case 'CANC': return 'Cancelled';
    case 'ABD': return 'Abandoned';
    case 'AWD': return 'Awarded';
    case 'WO': return 'Walkover';
    case 'LIVE': return 'Live';
    default: return status;
  }
}

