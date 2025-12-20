import { builder } from "../builder";

// Screen filters input
export const ScreenFiltersInput = builder.inputType("ScreenFiltersInput", {
  fields: (t) => ({
    leagueIds: t.intList({ required: false }),
    minOdds: t.float({ required: false }),
    maxOdds: t.float({ required: false }),
    minXgDiff: t.float({ required: false }),
    markets: t.stringList({ required: false }),
    formFilter: t.string({ required: false }), // "good_home", "poor_away", etc.
    valueThreshold: t.float({ required: false }), // Min edge % to show
    timeWindow: t.string({ required: false }), // "today", "tomorrow", "week"
  }),
});

// JSON scalar for screen filters
const ScreenFiltersJSON = builder.scalarType("ScreenFiltersJSON", {
  serialize: (value) => value,
  parseValue: (value) => value as Record<string, unknown>,
});

// SavedScreen GraphQL type
builder.prismaObject("SavedScreen", {
  fields: (t) => ({
    id: t.exposeInt("id"),
    userId: t.exposeInt("userId"),
    name: t.exposeString("name"),
    filters: t.field({
      type: ScreenFiltersJSON,
      resolve: (screen) => screen.filters as Record<string, unknown>,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

