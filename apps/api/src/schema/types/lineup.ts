import { builder } from '../builder';

// Player in lineup
const LineupPlayer = builder.objectType('LineupPlayer', {
  fields: (t) => ({
    id: t.int(),
    name: t.string(),
    number: t.int(),
    pos: t.string(),
  }),
});

// Coach
const Coach = builder.objectType('Coach', {
  fields: (t) => ({
    id: t.int(),
    name: t.string(),
    photo: t.string({ nullable: true }),
  }),
});

// Team lineup
export const TeamLineup = builder.objectType('TeamLineup', {
  fields: (t) => ({
    teamId: t.int(),
    teamName: t.string(),
    teamLogo: t.string(),
    formation: t.string(),
    startXI: t.field({ type: [LineupPlayer] }),
    substitutes: t.field({ type: [LineupPlayer] }),
    coach: t.field({ type: Coach, nullable: true }),
  }),
});

// Match event
export const MatchEvent = builder.objectType('MatchEvent', {
  fields: (t) => ({
    time: t.int(),
    extraTime: t.int({ nullable: true }),
    teamId: t.int(),
    teamName: t.string(),
    playerName: t.string(),
    assistName: t.string({ nullable: true }),
    type: t.string(), // "Goal", "Card", "subst", "Var"
    detail: t.string(), // "Normal Goal", "Yellow Card", "Substitution 1"
    comments: t.string({ nullable: true }),
  }),
});

// H2H match result
export const H2HMatch = builder.objectType('H2HMatch', {
  fields: (t) => ({
    fixtureId: t.int(),
    date: t.string(),
    venue: t.string({ nullable: true }),
    homeTeamId: t.int(),
    homeTeamName: t.string(),
    homeTeamLogo: t.string(),
    awayTeamId: t.int(),
    awayTeamName: t.string(),
    awayTeamLogo: t.string(),
    homeGoals: t.int({ nullable: true }),
    awayGoals: t.int({ nullable: true }),
    homeWinner: t.boolean({ nullable: true }),
    leagueName: t.string(),
    leagueLogo: t.string(),
  }),
});

// H2H summary stats
export const H2HSummary = builder.objectType('H2HSummary', {
  fields: (t) => ({
    totalMatches: t.int(),
    team1Wins: t.int(),
    team2Wins: t.int(),
    draws: t.int(),
    team1Goals: t.int(),
    team2Goals: t.int(),
  }),
});

// Player match statistics
const PlayerMatchStats = builder.objectType('PlayerMatchStats', {
  fields: (t) => ({
    playerId: t.int(),
    playerName: t.string(),
    playerPhoto: t.string({ nullable: true }),
    position: t.string({ nullable: true }),
    rating: t.float({ nullable: true }),
    minutes: t.int({ nullable: true }),
    goals: t.int({ nullable: true }),
    assists: t.int({ nullable: true }),
    shots: t.int({ nullable: true }),
    shotsOnTarget: t.int({ nullable: true }),
    passes: t.int({ nullable: true }),
    keyPasses: t.int({ nullable: true }),
    passAccuracy: t.string({ nullable: true }),
    tackles: t.int({ nullable: true }),
    interceptions: t.int({ nullable: true }),
    duelsWon: t.int({ nullable: true }),
    duelsTotal: t.int({ nullable: true }),
    dribblesSuccess: t.int({ nullable: true }),
    dribblesAttempts: t.int({ nullable: true }),
    foulsDrawn: t.int({ nullable: true }),
    foulsCommitted: t.int({ nullable: true }),
    yellowCards: t.int({ nullable: true }),
    redCards: t.int({ nullable: true }),
  }),
});

// Team player stats
export const TeamPlayerStats = builder.objectType('TeamPlayerStats', {
  fields: (t) => ({
    teamId: t.int(),
    teamName: t.string(),
    teamLogo: t.string(),
    players: t.field({ type: [PlayerMatchStats] }),
  }),
});

