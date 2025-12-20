import { builder } from '../builder';

export const Season = builder.prismaObject('Season', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    year: t.exposeInt('year'),
    startDate: t.expose('startDate', { type: 'DateTime' }),
    endDate: t.expose('endDate', { type: 'DateTime' }),
    current: t.exposeBoolean('current'),
    leagueId: t.exposeInt('leagueId'),
    league: t.relation('league'),
    fixtures: t.relation('fixtures'),
  }),
});

