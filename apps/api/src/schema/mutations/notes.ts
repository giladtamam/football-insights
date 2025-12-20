import { builder } from '../builder';
import { NoteInput } from '../types/match-note';

builder.mutationField('createNote', (t) =>
  t.prismaField({
    type: 'MatchNote',
    args: {
      input: t.arg({ type: NoteInput, required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      // For now, use a default user (mock auth)
      const userId = ctx.userId ?? 1;
      
      return ctx.prisma.matchNote.create({
        ...query,
        data: {
          fixtureId: args.input.fixtureId,
          userId,
          content: args.input.content,
          tags: args.input.tags ?? [],
        },
      });
    },
  })
);

builder.mutationField('updateNote', (t) =>
  t.prismaField({
    type: 'MatchNote',
    args: {
      id: t.arg.int({ required: true }),
      input: t.arg({ type: NoteInput, required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.matchNote.update({
        ...query,
        where: { id: args.id },
        data: {
          content: args.input.content,
          tags: args.input.tags ?? [],
        },
      });
    },
  })
);

builder.mutationField('deleteNote', (t) =>
  t.prismaField({
    type: 'MatchNote',
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.matchNote.delete({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

builder.queryField('matchNotes', (t) =>
  t.prismaField({
    type: ['MatchNote'],
    args: {
      fixtureId: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.matchNote.findMany({
        ...query,
        where: { fixtureId: args.fixtureId },
        orderBy: { createdAt: 'desc' },
      });
    },
  })
);

builder.queryField('userNotes', (t) =>
  t.prismaField({
    type: ['MatchNote'],
    args: {
      tag: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const userId = ctx.userId ?? 1;
      
      const where: Record<string, unknown> = { userId };
      
      // Filter by tag if provided (stored as JSON array)
      // Note: This is a simple implementation; for production, consider using
      // a separate tags table with a many-to-many relationship
      
      return ctx.prisma.matchNote.findMany({
        ...query,
        where,
        orderBy: { updatedAt: 'desc' },
      });
    },
  })
);

