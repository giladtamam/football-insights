import { builder } from '../builder';

export const Country = builder.prismaObject('Country', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    name: t.exposeString('name'),
    code: t.exposeString('code', { nullable: true }),
    flag: t.exposeString('flag', { nullable: true }),
    leagues: t.relation('leagues'),
  }),
});

