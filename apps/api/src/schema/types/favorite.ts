import { builder } from '../builder';

export const FavoriteTeam = builder.prismaObject('FavoriteTeam', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    userId: t.exposeInt('userId'),
    teamId: t.exposeInt('teamId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    user: t.relation('user'),
    team: t.relation('team'),
  }),
});

export const FavoriteLeague = builder.prismaObject('FavoriteLeague', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    userId: t.exposeInt('userId'),
    leagueId: t.exposeInt('leagueId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    user: t.relation('user'),
    league: t.relation('league'),
  }),
});

