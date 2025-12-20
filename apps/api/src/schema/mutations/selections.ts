import { builder } from "../builder";

// Create selection
builder.mutationField("createSelection", (t) =>
  t.prismaField({
    type: "UserSelection",
    args: {
      fixtureId: t.arg.int({ required: true }),
      market: t.arg.string({ required: true }),
      selection: t.arg.string({ required: true }),
      odds: t.arg.float({ required: true }),
      stake: t.arg.float({ required: false }),
      openingOdds: t.arg.float({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const userId = 1; // Default user

      return ctx.prisma.userSelection.create({
        ...query,
        data: {
          userId,
          fixtureId: args.fixtureId,
          market: args.market,
          selection: args.selection,
          odds: args.odds,
          stake: args.stake,
          openingOdds: args.openingOdds,
          result: "pending",
        },
      });
    },
  })
);

// Update selection (primarily for adding result)
builder.mutationField("updateSelection", (t) =>
  t.prismaField({
    type: "UserSelection",
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
      result: t.arg.string({ required: false }),
      closingOdds: t.arg.float({ required: false }),
      stake: t.arg.float({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const data: Record<string, unknown> = {};
      if (args.result !== undefined) data.result = args.result;
      if (args.closingOdds !== undefined) data.closingOdds = args.closingOdds;
      if (args.stake !== undefined) data.stake = args.stake;

      return ctx.prisma.userSelection.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  })
);

// Delete selection
builder.mutationField("deleteSelection", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      await ctx.prisma.userSelection.delete({
        where: { id: args.id },
      });
      return true;
    },
  })
);

// Bulk update results (for settling multiple selections at once)
builder.mutationField("settleSelections", (t) =>
  t.field({
    type: "Int",
    args: {
      fixtureId: t.arg.int({ required: true }),
      results: t.arg({
        type: builder.inputType("SelectionResultInput", {
          fields: (t) => ({
            selectionId: t.int({ required: true }),
            result: t.string({ required: true }),
          }),
        }),
        required: true,
      }),
    },
    resolve: async (_parent, args, ctx) => {
      const updates = Array.isArray(args.results) ? args.results : [args.results];
      
      let count = 0;
      for (const update of updates) {
        await ctx.prisma.userSelection.update({
          where: { id: update.selectionId },
          data: { result: update.result },
        });
        count++;
      }
      return count;
    },
  })
);

