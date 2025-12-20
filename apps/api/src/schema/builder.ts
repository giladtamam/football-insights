import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import { prisma, Prisma } from '@football-insights/database';
import type { PrismaClient } from '@prisma/client';

// Generate basic Pothos types from Prisma
type PrismaTypes = {
  Country: { Shape: Prisma.CountryGetPayload<{}>; Include: Prisma.CountryInclude; Where: Prisma.CountryWhereUniqueInput; Fields: string; ListRelations: string };
  League: { Shape: Prisma.LeagueGetPayload<{}>; Include: Prisma.LeagueInclude; Where: Prisma.LeagueWhereUniqueInput; Fields: string; ListRelations: string };
  Team: { Shape: Prisma.TeamGetPayload<{}>; Include: Prisma.TeamInclude; Where: Prisma.TeamWhereUniqueInput; Fields: string; ListRelations: string };
  Season: { Shape: Prisma.SeasonGetPayload<{}>; Include: Prisma.SeasonInclude; Where: Prisma.SeasonWhereUniqueInput; Fields: string; ListRelations: string };
  Fixture: { Shape: Prisma.FixtureGetPayload<{}>; Include: Prisma.FixtureInclude; Where: Prisma.FixtureWhereUniqueInput; Fields: string; ListRelations: string };
  FixtureStats: { Shape: Prisma.FixtureStatsGetPayload<{}>; Include: Prisma.FixtureStatsInclude; Where: Prisma.FixtureStatsWhereUniqueInput; Fields: string; ListRelations: string };
  Standing: { Shape: Prisma.StandingGetPayload<{}>; Include: Prisma.StandingInclude; Where: Prisma.StandingWhereUniqueInput; Fields: string; ListRelations: string };
  MatchNote: { Shape: Prisma.MatchNoteGetPayload<{}>; Include: Prisma.MatchNoteInclude; Where: Prisma.MatchNoteWhereUniqueInput; Fields: string; ListRelations: string };
  User: { Shape: Prisma.UserGetPayload<{}>; Include: Prisma.UserInclude; Where: Prisma.UserWhereUniqueInput; Fields: string; ListRelations: string };
  FavoriteTeam: { Shape: Prisma.FavoriteTeamGetPayload<{}>; Include: Prisma.FavoriteTeamInclude; Where: Prisma.FavoriteTeamWhereUniqueInput; Fields: string; ListRelations: string };
  FavoriteLeague: { Shape: Prisma.FavoriteLeagueGetPayload<{}>; Include: Prisma.FavoriteLeagueInclude; Where: Prisma.FavoriteLeagueWhereUniqueInput; Fields: string; ListRelations: string };
};

export interface Context {
  prisma: typeof prisma;
  userId?: number;
}

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: Context;
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
    JSON: {
      Input: unknown;
      Output: unknown;
    };
  };
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    filterConnectionTotalCount: true,
  },
});

// Add scalar types
builder.scalarType('DateTime', {
  serialize: (value) => value.toISOString(),
  parseValue: (value) => new Date(value as string),
});

builder.scalarType('JSON', {
  serialize: (value) => value,
  parseValue: (value) => value,
});

// Initialize Query and Mutation types
builder.queryType({});
builder.mutationType({});

