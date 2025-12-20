import { builder } from "../builder";
import { AlertConfigInput } from "../types/alert";

// Create alert
builder.mutationField("createAlert", (t) =>
  t.prismaField({
    type: "Alert",
    args: {
      type: t.arg.string({ required: true }),
      config: t.arg({ type: AlertConfigInput, required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      // Default user ID 1 for now (would use auth in production)
      const userId = 1;

      return ctx.prisma.alert.create({
        ...query,
        data: {
          userId,
          type: args.type,
          config: args.config as object,
          isActive: true,
        },
      });
    },
  })
);

// Update alert
builder.mutationField("updateAlert", (t) =>
  t.prismaField({
    type: "Alert",
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
      type: t.arg.string({ required: false }),
      config: t.arg({ type: AlertConfigInput, required: false }),
      isActive: t.arg.boolean({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const data: Record<string, unknown> = {};
      if (args.type !== undefined) data.type = args.type;
      if (args.config !== undefined) data.config = args.config as object;
      if (args.isActive !== undefined) data.isActive = args.isActive;

      return ctx.prisma.alert.update({
        ...query,
        where: { id: args.id },
        data,
      });
    },
  })
);

// Delete alert
builder.mutationField("deleteAlert", (t) =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      await ctx.prisma.alert.delete({
        where: { id: args.id },
      });
      return true;
    },
  })
);

// Toggle alert active status
builder.mutationField("toggleAlert", (t) =>
  t.prismaField({
    type: "Alert",
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const alert = await ctx.prisma.alert.findUnique({
        where: { id: args.id },
      });
      if (!alert) return null;

      return ctx.prisma.alert.update({
        ...query,
        where: { id: args.id },
        data: { isActive: !alert.isActive },
      });
    },
  })
);

