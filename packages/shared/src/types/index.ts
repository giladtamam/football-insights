// Football Data Types

export interface Country {
  id: number;
  name: string;
  code: string | null;
  flag: string | null;
}

export interface League {
  id: number;
  name: string;
  type: string;
  logo: string | null;
  countryId: number;
  country?: Country;
}

export interface Season {
  id: number;
  year: number;
  startDate: Date;
  endDate: Date;
  current: boolean;
  leagueId: number;
  league?: League;
}

export interface Team {
  id: number;
  name: string;
  code: string | null;
  logo: string | null;
  venue: string | null;
  venueCapacity: number | null;
  countryId: number;
  country?: Country;
}

export interface Fixture {
  id: number;
  date: Date;
  timestamp: number;
  timezone: string;
  status: FixtureStatus;
  statusShort: string;
  elapsed: number | null;
  round: string | null;
  seasonId: number;
  homeTeamId: number;
  awayTeamId: number;
  goalsHome: number | null;
  goalsAway: number | null;
  xgHome: number | null;
  xgAway: number | null;
  season?: Season;
  homeTeam?: Team;
  awayTeam?: Team;
}

export type FixtureStatus = 
  | 'TBD'      // Time To Be Defined
  | 'NS'       // Not Started
  | '1H'       // First Half
  | 'HT'       // Halftime
  | '2H'       // Second Half
  | 'ET'       // Extra Time
  | 'P'        // Penalty In Progress
  | 'FT'       // Match Finished
  | 'AET'      // Match Finished After Extra Time
  | 'PEN'      // Match Finished After Penalty
  | 'BT'       // Break Time
  | 'SUSP'     // Match Suspended
  | 'INT'      // Match Interrupted
  | 'PST'      // Match Postponed
  | 'CANC'     // Match Cancelled
  | 'ABD'      // Match Abandoned
  | 'AWD'      // Technical Loss
  | 'WO'       // WalkOver
  | 'LIVE';    // In Progress

export interface FixtureStats {
  id: number;
  fixtureId: number;
  homeStats: TeamStats;
  awayStats: TeamStats;
  fixture?: Fixture;
}

export interface TeamStats {
  shotsOnGoal: number | null;
  shotsOffGoal: number | null;
  totalShots: number | null;
  blockedShots: number | null;
  shotsInsideBox: number | null;
  shotsOutsideBox: number | null;
  fouls: number | null;
  cornerKicks: number | null;
  offsides: number | null;
  ballPossession: number | null;
  yellowCards: number | null;
  redCards: number | null;
  goalkeeperSaves: number | null;
  totalPasses: number | null;
  passesAccurate: number | null;
  passAccuracy: number | null;
  expectedGoals: number | null;
}

export interface MatchNote {
  id: number;
  fixtureId: number;
  userId: number;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  fixture?: Fixture;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Standing Types
export interface StandingEntry {
  rank: number;
  teamId: number;
  team?: Team;
  points: number;
  goalsDiff: number;
  group: string | null;
  form: string | null;
  status: string | null;
  description: string | null;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  home: StandingRecord;
  away: StandingRecord;
}

export interface StandingRecord {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
}

// xG Analysis Types
export interface TeamForm {
  teamId: number;
  team?: Team;
  matches: number;
  xgFor: number;
  xgAgainst: number;
  xgDiff: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  finishingDelta: number;  // goals - xG
  keeperDelta: number;     // goals conceded - xG against
  points: number;
  form: string;  // e.g., "WWDLW"
}

// V1 Scaffolded Types - Odds & Market
export interface OddsMarket {
  fixtureId: number;
  bookmaker: string;
  market: string;
  homeOdds: number | null;
  drawOdds: number | null;
  awayOdds: number | null;
  overOdds: number | null;
  underOdds: number | null;
  line: number | null;
  updatedAt: Date;
}

export interface ImpliedProbability {
  market: string;
  homeProb: number | null;
  drawProb: number | null;
  awayProb: number | null;
  overProb: number | null;
  underProb: number | null;
  overround: number;
  fairHomeProb: number | null;
  fairDrawProb: number | null;
  fairAwayProb: number | null;
}

// V1 Scaffolded Types - Model & Predictions
export interface MatchPrediction {
  fixtureId: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  over25Prob: number;
  under25Prob: number;
  bttsYesProb: number;
  bttsNoProb: number;
  confidenceScore: number;
  drivers: PredictionDriver[];
  scorelines: ScorelineProbability[];
}

export interface PredictionDriver {
  name: string;
  direction: 'home' | 'away' | 'over' | 'under' | 'neutral';
  magnitude: number;  // -1 to 1
  description: string;
  evidence?: string;
}

export interface ScorelineProbability {
  homeGoals: number;
  awayGoals: number;
  probability: number;
}

// Filter & Query Types
export interface FixtureFilter {
  leagueIds?: number[];
  seasonIds?: number[];
  teamIds?: number[];
  dateFrom?: Date;
  dateTo?: Date;
  status?: FixtureStatus[];
  hasXg?: boolean;
}

export type QuickFilter = 
  | 'top_leagues'
  | 'favorites'
  | 'live'
  | 'starting_soon'
  | 'today'
  | 'tomorrow';

// UI State Types
export type MatchCenterTab = 
  | 'overview'
  | 'lineups'
  | 'stats'
  | 'tactical'
  | 'odds'
  | 'model'
  | 'notes'
  | 'review';

