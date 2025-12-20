import { builder } from "../builder";

// Get user's alerts
builder.queryField("alerts", (t) =>
  t.prismaField({
    type: ["Alert"],
    args: {
      type: t.arg.string({ required: false }),
      isActive: t.arg.boolean({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const userId = 1; // Default user
      const where: Record<string, unknown> = { userId };

      if (args.type) where.type = args.type;
      if (args.isActive !== undefined) where.isActive = args.isActive;

      return ctx.prisma.alert.findMany({
        ...query,
        where,
        orderBy: { createdAt: "desc" },
      });
    },
  })
);

// Get single alert
builder.queryField("alert", (t) =>
  t.prismaField({
    type: "Alert",
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.alert.findUnique({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

