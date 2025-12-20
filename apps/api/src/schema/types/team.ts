import { builder } from '../builder';

export const Team = builder.prismaObject('Team', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    code: t.exposeString('code', { nullable: true }),
    logo: t.exposeString('logo', { nullable: true }),
    venue: t.exposeString('venue', { nullable: true }),
    venueCapacity: t.exposeInt('venueCapacity', { nullable: true }),
    countryId: t.exposeInt('countryId'),
    country: t.relation('country'),
    leagues: t.relation('leagues'),
    homeFixtures: t.relation('homeFixtures'),
    awayFixtures: t.relation('awayFixtures'),
    isFavorite: t.boolean({
      resolve: async (team, _args, ctx) => {
        if (!ctx.userId) return false;
        const favorite = await ctx.prisma.favoriteTeam.findUnique({
          where: {
            userId_teamId: {
              userId: ctx.userId,
              teamId: team.id,
            },
          },
        });
        return !!favorite;
      },
    }),
  }),
});

