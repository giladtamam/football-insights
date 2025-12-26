import { builder } from '../builder';

builder.queryField('teams', (t) =>
  t.prismaField({
    type: ['Team'],
    args: {
      leagueId: t.arg.int({ required: false }),
      countryId: t.arg.int({ required: false }),
      search: t.arg.string({ required: false }),
      favoriteOnly: t.arg.boolean({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const where: Record<string, unknown> = {};
      
      if (args.leagueId) {
        where.leagues = {
          some: { id: args.leagueId },
        };
      }
      
      if (args.countryId) {
        where.countryId = args.countryId;
      }
      
      if (args.search) {
        where.name = { contains: args.search };
      }
      
      if (args.favoriteOnly && ctx.userId) {
        where.favoriteBy = {
          some: { userId: ctx.userId },
        };
      }
      
      return ctx.prisma.team.findMany({
        ...query,
        where,
        orderBy: { name: 'asc' },
        take: args.limit ?? undefined,
      });
    },
  })
);

builder.queryField('team', (t) =>
  t.prismaField({
    type: 'Team',
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.team.findUnique({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

