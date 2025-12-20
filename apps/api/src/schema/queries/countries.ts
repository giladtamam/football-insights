import { builder } from '../builder';

builder.queryField('countries', (t) =>
  t.prismaField({
    type: ['Country'],
    args: {
      search: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.country.findMany({
        ...query,
        where: args.search
          ? {
              name: {
                contains: args.search,
              },
            }
          : undefined,
        orderBy: { name: 'asc' },
      });
    },
  })
);

builder.queryField('country', (t) =>
  t.prismaField({
    type: 'Country',
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.country.findUnique({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

