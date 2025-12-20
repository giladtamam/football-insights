import { builder } from '../builder';

export const MatchNote = builder.prismaObject('MatchNote', {
  fields: (t) => ({
    id: t.exposeInt('id'),
    fixtureId: t.exposeInt('fixtureId'),
    userId: t.exposeInt('userId'),
    content: t.exposeString('content'),
    tags: t.expose('tags', { type: 'JSON' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    fixture: t.relation('fixture'),
    user: t.relation('user'),
  }),
});

// Input type for creating/updating notes
export const NoteInput = builder.inputType('NoteInput', {
  fields: (t) => ({
    fixtureId: t.int({ required: true }),
    content: t.string({ required: true }),
    tags: t.stringList({ required: false }),
  }),
});

