import { builder } from "../builder";

// Get user's saved screens
builder.queryField("savedScreens", (t) =>
  t.prismaField({
    type: ["SavedScreen"],
    resolve: async (query, _parent, _args, ctx) => {
      const userId = 1; // Default user

      return ctx.prisma.savedScreen.findMany({
        ...query,
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
    },
  })
);

// Get single saved screen
builder.queryField("savedScreen", (t) =>
  t.prismaField({
    type: "SavedScreen",
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.savedScreen.findUnique({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

