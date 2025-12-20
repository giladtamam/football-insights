import { builder } from "../builder";
import { SelectionStatsType } from "../types/user-selection";

// Get user's selections
builder.queryField("selections", (t) =>
  t.prismaField({
    type: ["UserSelection"],
    args: {
      result: t.arg.string({ required: false }),
      market: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const userId = 1; // Default user
      const where: Record<string, unknown> = { userId };

      if (args.result) where.result = args.result;
      if (args.market) where.market = args.market;

      return ctx.prisma.userSelection.findMany({
        ...query,
        where,
        orderBy: { createdAt: "desc" },
        take: args.limit ?? 100,
      });
    },
  })
);

// Get selection by fixture
builder.queryField("fixtureSelections", (t) =>
  t.prismaField({
    type: ["UserSelection"],
    args: {
      fixtureId: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const userId = 1; // Default user

      return ctx.prisma.userSelection.findMany({
        ...query,
        where: {
          userId,
          fixtureId: args.fixtureId,
        },
        orderBy: { createdAt: "desc" },
      });
    },
  })
);

// Get selection stats (P&L summary)
builder.queryField("selectionStats", (t) =>
  t.field({
    type: SelectionStatsType,
    args: {
      dateFrom: t.arg({ type: "DateTime", required: false }),
      dateTo: t.arg({ type: "DateTime", required: false }),
      market: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      const userId = 1; // Default user
      const where: Record<string, unknown> = { userId };

      if (args.dateFrom || args.dateTo) {
        where.createdAt = {};
        if (args.dateFrom) (where.createdAt as Record<string, Date>).gte = args.dateFrom;
        if (args.dateTo) (where.createdAt as Record<string, Date>).lte = args.dateTo;
      }
      if (args.market) where.market = args.market;

      const selections = await ctx.prisma.userSelection.findMany({ where });

      const stats = {
        totalSelections: selections.length,
        wins: 0,
        losses: 0,
        pending: 0,
        totalStaked: 0,
        totalProfit: 0,
      };

      for (const s of selections) {
        const stake = s.stake ?? 0;
        stats.totalStaked += stake;

        switch (s.result) {
          case "win":
            stats.wins++;
            stats.totalProfit += stake * (s.odds - 1);
            break;
          case "half_win":
            stats.wins++;
            stats.totalProfit += stake * (s.odds - 1) / 2;
            break;
          case "lose":
            stats.losses++;
            stats.totalProfit -= stake;
            break;
          case "half_lose":
            stats.losses++;
            stats.totalProfit -= stake / 2;
            break;
          case "pending":
            stats.pending++;
            break;
          // void = no change
        }
      }

      const settled = stats.wins + stats.losses;
      return {
        ...stats,
        winRate: settled > 0 ? (stats.wins / settled) * 100 : 0,
        roi: stats.totalStaked > 0 ? (stats.totalProfit / stats.totalStaked) * 100 : 0,
      };
    },
  })
);

