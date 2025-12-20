import { builder } from '../builder';

builder.mutationField('toggleFavoriteTeam', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      teamId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const userId = ctx.userId ?? 1;
      
      const existing = await ctx.prisma.favoriteTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId: args.teamId,
          },
        },
      });
      
      if (existing) {
        await ctx.prisma.favoriteTeam.delete({
          where: {
            userId_teamId: {
              userId,
              teamId: args.teamId,
            },
          },
        });
        return false; // No longer favorite
      } else {
        await ctx.prisma.favoriteTeam.create({
          data: {
            userId,
            teamId: args.teamId,
          },
        });
        return true; // Now favorite
      }
    },
  })
);

builder.mutationField('toggleFavoriteLeague', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      leagueId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const userId = ctx.userId ?? 1;
      
      const existing = await ctx.prisma.favoriteLeague.findUnique({
        where: {
          userId_leagueId: {
            userId,
            leagueId: args.leagueId,
          },
        },
      });
      
      if (existing) {
        await ctx.prisma.favoriteLeague.delete({
          where: {
            userId_leagueId: {
              userId,
              leagueId: args.leagueId,
            },
          },
        });
        return false; // No longer favorite
      } else {
        await ctx.prisma.favoriteLeague.create({
          data: {
            userId,
            leagueId: args.leagueId,
          },
        });
        return true; // Now favorite
      }
    },
  })
);

builder.queryField('favoriteTeams', (t) =>
  t.prismaField({
    type: ['Team'],
    resolve: async (query, _parent, _args, ctx) => {
      const userId = ctx.userId ?? 1;
      
      const favorites = await ctx.prisma.favoriteTeam.findMany({
        where: { userId },
        include: { team: true },
      });
      
      return favorites.map((f) => f.team);
    },
  })
);

builder.queryField('favoriteLeagues', (t) =>
  t.prismaField({
    type: ['League'],
    resolve: async (query, _parent, _args, ctx) => {
      const userId = ctx.userId ?? 1;
      
      const favorites = await ctx.prisma.favoriteLeague.findMany({
        where: { userId },
        include: { league: true },
      });
      
      return favorites.map((f) => f.league);
    },
  })
);

