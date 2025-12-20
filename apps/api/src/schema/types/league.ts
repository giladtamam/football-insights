import { builder } from '../builder';

export const League = builder.prismaObject('League', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    type: t.exposeString('type'),
    logo: t.exposeString('logo', { nullable: true }),
    countryId: t.exposeInt('countryId'),
    country: t.relation('country'),
    seasons: t.relation('seasons'),
    teams: t.relation('teams'),
    isFavorite: t.boolean({
      resolve: async (league, _args, ctx) => {
        if (!ctx.userId) return false;
        const favorite = await ctx.prisma.favoriteLeague.findUnique({
          where: {
            userId_leagueId: {
              userId: ctx.userId,
              leagueId: league.id,
            },
          },
        });
        return !!favorite;
      },
    }),
  }),
});

