import { builder } from '../builder';

export const FixtureStats = builder.prismaObject('FixtureStats', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    fixtureId: t.exposeInt('fixtureId'),
    fixture: t.relation('fixture'),
    homeStats: t.expose('homeStats', { type: 'JSON' }),
    awayStats: t.expose('awayStats', { type: 'JSON' }),
  }),
});

// Team stats as a separate type for easier querying
export const TeamStatsType = builder.objectType('TeamStats', {
  fields: (t) => ({
    shotsOnGoal: t.int({ nullable: true }),
    shotsOffGoal: t.int({ nullable: true }),
    totalShots: t.int({ nullable: true }),
    blockedShots: t.int({ nullable: true }),
    shotsInsideBox: t.int({ nullable: true }),
    shotsOutsideBox: t.int({ nullable: true }),
    fouls: t.int({ nullable: true }),
    cornerKicks: t.int({ nullable: true }),
    offsides: t.int({ nullable: true }),
    ballPossession: t.int({ nullable: true }),
    yellowCards: t.int({ nullable: true }),
    redCards: t.int({ nullable: true }),
    goalkeeperSaves: t.int({ nullable: true }),
    totalPasses: t.int({ nullable: true }),
    passesAccurate: t.int({ nullable: true }),
    passAccuracy: t.int({ nullable: true }),
    expectedGoals: t.float({ nullable: true }),
  }),
});

