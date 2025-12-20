import { builder } from '../builder';

builder.queryField('leagues', (t) =>
  t.prismaField({
    type: ['League'],
    args: {
      countryId: t.arg.int({ required: false }),
      search: t.arg.string({ required: false }),
      type: t.arg.string({ required: false }),
      favoriteOnly: t.arg.boolean({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const where: Record<string, unknown> = {};
      
      if (args.countryId) {
        where.countryId = args.countryId;
      }
      
      if (args.search) {
        where.name = { contains: args.search };
      }
      
      if (args.type) {
        where.type = args.type;
      }
      
      if (args.favoriteOnly && ctx.userId) {
        where.favoriteBy = {
          some: { userId: ctx.userId },
        };
      }
      
      return ctx.prisma.league.findMany({
        ...query,
        where,
        orderBy: { name: 'asc' },
      });
    },
  })
);

builder.queryField('league', (t) =>
  t.prismaField({
    type: 'League',
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.league.findUnique({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

builder.queryField('topLeagues', (t) =>
  t.prismaField({
    type: ['League'],
    description: 'Returns top leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1)',
    resolve: async (query, _parent, _args, ctx) => {
      // Top 5 European leagues by their API-Football IDs
      const topLeagueIds = [39, 140, 135, 78, 61]; // PL, La Liga, Serie A, Bundesliga, Ligue 1
      
      return ctx.prisma.league.findMany({
        ...query,
        where: {
          id: { in: topLeagueIds },
        },
        orderBy: { name: 'asc' },
      });
    },
  })
);

