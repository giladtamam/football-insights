import { builder } from "../builder";

// Selection result enum
export const SelectionResultEnum = builder.enumType("SelectionResult", {
  values: ["win", "lose", "void", "pending", "half_win", "half_lose"] as const,
});

// UserSelection GraphQL type
builder.prismaObject("UserSelection", {
  fields: (t) => ({
    id: t.exposeInt("id"),
    userId: t.exposeInt("userId"),
    fixtureId: t.exposeInt("fixtureId"),
    market: t.exposeString("market"),
    selection: t.exposeString("selection"),
    odds: t.exposeFloat("odds"),
    openingOdds: t.expose("openingOdds", { type: "Float", nullable: true }),
    closingOdds: t.expose("closingOdds", { type: "Float", nullable: true }),
    stake: t.expose("stake", { type: "Float", nullable: true }),
    result: t.expose("result", { type: "String", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    // Computed fields
    profit: t.float({
      nullable: true,
      resolve: (selection) => {
        if (!selection.stake || !selection.result) return null;
        if (selection.result === "pending") return null;
        if (selection.result === "void") return 0;
        if (selection.result === "win") return selection.stake * (selection.odds - 1);
        if (selection.result === "half_win") return selection.stake * (selection.odds - 1) / 2;
        if (selection.result === "lose") return -selection.stake;
        if (selection.result === "half_lose") return -selection.stake / 2;
        return null;
      },
    }),
    fixture: t.relation("fixture", {
      nullable: true,
    }),
  }),
});

// Selection stats type for P&L summary
export const SelectionStatsType = builder.objectRef<{
  totalSelections: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
  totalStaked: number;
  totalProfit: number;
  roi: number;
}>("SelectionStats").implement({
  fields: (t) => ({
    totalSelections: t.exposeInt("totalSelections"),
    wins: t.exposeInt("wins"),
    losses: t.exposeInt("losses"),
    pending: t.exposeInt("pending"),
    winRate: t.exposeFloat("winRate"),
    totalStaked: t.exposeFloat("totalStaked"),
    totalProfit: t.exposeFloat("totalProfit"),
    roi: t.exposeFloat("roi"),
  }),
});

