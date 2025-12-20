import { builder } from "../builder";
import { ScreenFiltersInput } from "../types/saved-screen";

// Create saved screen
builder.mutationField("createSavedScreen", (t) =>
  t.prismaField({
    type: "SavedScreen",
    args: {
      name: t.arg.string({ required: true }),
      filters: t.arg({ type: ScreenFiltersInput, required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const userId = 1; // Default user

      return ctx.prisma.savedScreen.create({
        ...query,
        data: {
          userId,
          name: args.name,
          filters: args.filters as object,
        },
      });
    },
  })
);

// Update saved screen
builder.mutationField("updateSavedScreen", (t) =>
  t.prismaField({
    type: "SavedScreen",
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
      name: t.arg.string({ required: false }),
      filters: t.arg({ type: ScreenFiltersInput, required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const data: Record<string, unknown> = {};
      if (args.name !== undefined) data.name = args.name;
      if (args.filters !== undefined) data.filters = args.filters as object;

      return ctx.prisma.savedScreen.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  })
);

// Delete saved screen
builder.mutationField("deleteSavedScreen", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      await ctx.prisma.savedScreen.delete({
        where: { id: args.id },
      });
      return true;
    },
  })
);
