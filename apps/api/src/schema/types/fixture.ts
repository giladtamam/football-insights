import { builder } from '../builder';

export const Fixture = builder.prismaObject('Fixture', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    date: t.expose('date', { type: 'DateTime' }),
    timestamp: t.exposeInt('timestamp'),
    timezone: t.exposeString('timezone'),
    status: t.exposeString('status'),
    statusShort: t.exposeString('statusShort'),
    elapsed: t.exposeInt('elapsed', { nullable: true }),
    round: t.exposeString('round', { nullable: true }),
    venue: t.exposeString('venue', { nullable: true }),
    referee: t.exposeString('referee', { nullable: true }),
    seasonId: t.exposeInt('seasonId'),
    homeTeamId: t.exposeInt('homeTeamId'),
    awayTeamId: t.exposeInt('awayTeamId'),
    goalsHome: t.exposeInt('goalsHome', { nullable: true }),
    goalsAway: t.exposeInt('goalsAway', { nullable: true }),
    xgHome: t.exposeFloat('xgHome', { nullable: true }),
    xgAway: t.exposeFloat('xgAway', { nullable: true }),
    season: t.relation('season'),
    homeTeam: t.relation('homeTeam'),
    awayTeam: t.relation('awayTeam'),
    stats: t.relation('stats', { nullable: true }),
    notes: t.relation('notes'),
    // Computed fields
    isLive: t.boolean({
      resolve: (fixture) => {
        return ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(fixture.statusShort);
      },
    }),
    isFinished: t.boolean({
      resolve: (fixture) => {
        return ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(fixture.statusShort);
      },
    }),
    isUpcoming: t.boolean({
      resolve: (fixture) => {
        return ['TBD', 'NS'].includes(fixture.statusShort);
      },
    }),
  }),
});

// Input type for filtering fixtures
export const FixtureFilterInput = builder.inputType('FixtureFilterInput', {
  fields: (t) => ({
    leagueIds: t.intList({ required: false }),
    seasonIds: t.intList({ required: false }),
    teamIds: t.intList({ required: false }),
    dateFrom: t.field({ type: 'DateTime', required: false }),
    dateTo: t.field({ type: 'DateTime', required: false }),
    status: t.stringList({ required: false }),
    live: t.boolean({ required: false }),
    upcoming: t.boolean({ required: false }),
    finished: t.boolean({ required: false }),
  }),
});

