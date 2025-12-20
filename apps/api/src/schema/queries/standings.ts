import { builder } from '../builder';

builder.queryField('standings', (t) =>
  t.prismaField({
    type: ['Standing'],
    args: {
      seasonId: t.arg.int({ required: false }),
      leagueId: t.arg.int({ required: false }),
      group: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      let seasonId = args.seasonId;
      
      // If leagueId is provided but not seasonId, find a season with standings
      if (!seasonId && args.leagueId) {
        // First, try to find a season with standings data
        const seasonWithStandings = await ctx.prisma.standing.findFirst({
          where: {
            season: { leagueId: args.leagueId }
          },
          orderBy: { season: { year: 'desc' } },
          select: { seasonId: true },
        });
        
        if (seasonWithStandings) {
          seasonId = seasonWithStandings.seasonId;
        } else {
          // Fall back to current season
          const currentSeason = await ctx.prisma.season.findFirst({
            where: { leagueId: args.leagueId, current: true },
            select: { id: true },
          });
          seasonId = currentSeason?.id;
        }
      }
      
      if (!seasonId) {
        return [];
      }
      
      const where: Record<string, unknown> = {
        seasonId,
      };
      
      if (args.group) {
        where.group = args.group;
      }
      
      return ctx.prisma.standing.findMany({
        ...query,
        where,
        orderBy: { rank: 'asc' },
      });
    },
  })
);

builder.queryField('teamStandings', (t) =>
  t.prismaField({
    type: 'Standing',
    nullable: true,
    args: {
      seasonId: t.arg.int({ required: true }),
      teamId: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.standing.findFirst({
        ...query,
        where: {
          seasonId: args.seasonId,
          teamId: args.teamId,
        },
      });
    },
  })
);

