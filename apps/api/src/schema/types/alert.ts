import { builder } from "../builder";

// Alert type enum
export const AlertTypeEnum = builder.enumType("AlertType", {
  values: ["lineup", "odds_move", "value", "kickoff"] as const,
});

// Alert configuration input
export const AlertConfigInput = builder.inputType("AlertConfigInput", {
  fields: (t) => ({
    fixtureId: t.int({ required: false }),
    teamId: t.int({ required: false }),
    leagueId: t.int({ required: false }),
    threshold: t.float({ required: false }), // For odds movement %
    market: t.string({ required: false }), // "1X2", "O/U 2.5", etc.
    minutesBefore: t.int({ required: false }), // For kickoff alerts
  }),
});

// Alert GraphQL type
builder.prismaObject("Alert", {
  fields: (t) => ({
    id: t.exposeInt("id"),
    userId: t.exposeInt("userId"),
    type: t.exposeString("type"),
    config: t.field({
      type: JSONScalar,
      resolve: (alert) => alert.config as Record<string, unknown>,
    }),
    isActive: t.exposeBoolean("isActive"),
    lastTriggered: t.expose("lastTriggered", {
      type: "DateTime",
      nullable: true,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// JSON scalar for config objects
const JSONScalar = builder.scalarType("AlertJSON", {
  serialize: (value) => value,
  parseValue: (value) => value as Record<string, unknown>,
});

