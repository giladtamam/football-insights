import { builder } from "../builder";
import { FixtureFilterInput } from "../types/fixture";
import { footballApiClient } from "../../services/football-api/client";

builder.queryField("fixtures", (t) =>
  t.prismaField({
    type: ["Fixture"],
    args: {
      filter: t.arg({ type: FixtureFilterInput, required: false }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const where: Record<string, unknown> = {};
      const filter = args.filter;

      if (filter) {
        if (filter.leagueIds?.length) {
          where.season = {
            leagueId: { in: filter.leagueIds },
          };
        }

        if (filter.seasonIds?.length) {
          where.seasonId = { in: filter.seasonIds };
        }

        if (filter.teamIds?.length) {
          where.OR = [
            { homeTeamId: { in: filter.teamIds } },
            { awayTeamId: { in: filter.teamIds } },
          ];
        }

        if (filter.dateFrom || filter.dateTo) {
          where.date = {};
          if (filter.dateFrom) {
            (where.date as Record<string, Date>).gte = filter.dateFrom;
          }
          if (filter.dateTo) {
            (where.date as Record<string, Date>).lte = filter.dateTo;
          }
        }

        if (filter.status?.length) {
          where.statusShort = { in: filter.status };
        }

        if (filter.live) {
          where.statusShort = {
            in: ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"],
          };
        }

        if (filter.upcoming) {
          where.statusShort = { in: ["TBD", "NS"] };
        }

        if (filter.finished) {
          where.statusShort = { in: ["FT", "AET", "PEN", "AWD", "WO"] };
        }
      }

      return ctx.prisma.fixture.findMany({
        ...query,
        where,
        orderBy: { date: "asc" },
        take: args.limit ?? 50,
        skip: args.offset ?? 0,
      });
    },
  })
);

builder.queryField("fixture", (t) =>
  t.prismaField({
    type: "Fixture",
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.fixture.findUnique({
        ...query,
        where: { id: args.id },
      });
    },
  })
);

builder.queryField("todayFixtures", (t) =>
  t.prismaField({
    type: ["Fixture"],
    args: {
      leagueIds: t.arg.intList({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const where: Record<string, unknown> = {
        date: {
          gte: today,
          lt: tomorrow,
        },
      };

      if (args.leagueIds?.length) {
        where.season = {
          leagueId: { in: args.leagueIds },
        };
      }

      return ctx.prisma.fixture.findMany({
        ...query,
        where,
        orderBy: { date: "asc" },
      });
    },
  })
);

builder.queryField("liveFixtures", (t) =>
  t.prismaField({
    type: ["Fixture"],
    resolve: async (query, _parent, _args, ctx) => {
      return ctx.prisma.fixture.findMany({
        ...query,
        where: {
          statusShort: { in: ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"] },
        },
        orderBy: { date: "asc" },
      });
    },
  })
);

builder.queryField("upcomingFixtures", (t) =>
  t.prismaField({
    type: ["Fixture"],
    args: {
      hours: t.arg.int({ required: false, defaultValue: 24 }),
      leagueIds: t.arg.intList({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const now = new Date();
      const future = new Date(
        now.getTime() + (args.hours ?? 24) * 60 * 60 * 1000
      );

      const where: Record<string, unknown> = {
        date: {
          gte: now,
          lte: future,
        },
        statusShort: { in: ["TBD", "NS"] },
      };

      if (args.leagueIds?.length) {
        where.season = {
          leagueId: { in: args.leagueIds },
        };
      }

      return ctx.prisma.fixture.findMany({
        ...query,
        where,
        orderBy: { date: "asc" },
      });
    },
  })
);

builder.queryField("headToHead", (t) =>
  t.prismaField({
    type: ["Fixture"],
    args: {
      team1Id: t.arg.int({ required: true }),
      team2Id: t.arg.int({ required: true }),
      limit: t.arg.int({ required: false, defaultValue: 10 }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.fixture.findMany({
        ...query,
        where: {
          OR: [
            { homeTeamId: args.team1Id, awayTeamId: args.team2Id },
            { homeTeamId: args.team2Id, awayTeamId: args.team1Id },
          ],
          statusShort: { in: ["FT", "AET", "PEN"] },
        },
        orderBy: { date: "desc" },
        take: args.limit ?? 10,
      });
    },
  })
);

// Team fixtures (for form display)
builder.queryField("teamFixtures", (t) =>
  t.prismaField({
    type: ["Fixture"],
    args: {
      teamId: t.arg.int({ required: true }),
      last: t.arg.int({ required: false, defaultValue: 5 }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.fixture.findMany({
        ...query,
        where: {
          OR: [{ homeTeamId: args.teamId }, { awayTeamId: args.teamId }],
          statusShort: { in: ["FT", "AET", "PEN"] },
        },
        orderBy: { date: "desc" },
        take: args.last ?? 5,
      });
    },
  })
);

// Define types for live fixture from API
const LiveTeamType = builder
  .objectRef<{
    id: number;
    name: string;
    logo: string | null;
  }>("LiveTeam")
  .implement({
    fields: (t) => ({
      id: t.exposeInt("id"),
      name: t.exposeString("name"),
      logo: t.exposeString("logo", { nullable: true }),
    }),
  });

const LiveLeagueType = builder
  .objectRef<{
    id: number;
    name: string;
    logo: string | null;
    country: string;
  }>("LiveLeague")
  .implement({
    fields: (t) => ({
      id: t.exposeInt("id"),
      name: t.exposeString("name"),
      logo: t.exposeString("logo", { nullable: true }),
      country: t.exposeString("country"),
    }),
  });

const LiveFixtureType = builder
  .objectRef<{
    id: number;
    date: string;
    timestamp: number;
    status: string;
    statusShort: string;
    elapsed: number | null;
    round: string | null;
    homeTeam: { id: number; name: string; logo: string | null };
    awayTeam: { id: number; name: string; logo: string | null };
    goalsHome: number | null;
    goalsAway: number | null;
    league: { id: number; name: string; logo: string | null; country: string };
  }>("LiveFixture")
  .implement({
    fields: (t) => ({
      id: t.exposeInt("id"),
      date: t.exposeString("date"),
      timestamp: t.exposeInt("timestamp"),
      status: t.exposeString("status"),
      statusShort: t.exposeString("statusShort"),
      elapsed: t.exposeInt("elapsed", { nullable: true }),
      round: t.exposeString("round", { nullable: true }),
      homeTeam: t.field({
        type: LiveTeamType,
        resolve: (parent) => parent.homeTeam,
      }),
      awayTeam: t.field({
        type: LiveTeamType,
        resolve: (parent) => parent.awayTeam,
      }),
      goalsHome: t.exposeInt("goalsHome", { nullable: true }),
      goalsAway: t.exposeInt("goalsAway", { nullable: true }),
      league: t.field({
        type: LiveLeagueType,
        resolve: (parent) => parent.league,
      }),
    }),
  });

// Real-time live fixtures from API-Football (with database fallback)
builder.queryField("liveFixturesFromApi", (t) =>
  t.field({
    type: [LiveFixtureType],
    resolve: async (_parent, _args, ctx) => {
      try {
        const fixtures = await footballApiClient.getLiveFixtures();
        if (fixtures.length > 0) {
          return fixtures.map((f) => ({
            id: f.id,
            date: f.date,
            timestamp: f.timestamp,
            status: f.status.long,
            statusShort: f.status.short,
            elapsed: f.status.elapsed,
            round: f.round,
            homeTeam: {
              id: f.homeTeam.id,
              name: f.homeTeam.name,
              logo: (f.homeTeam as any).logo || null,
            },
            awayTeam: {
              id: f.awayTeam.id,
              name: f.awayTeam.name,
              logo: (f.awayTeam as any).logo || null,
            },
            goalsHome: f.goals.home,
            goalsAway: f.goals.away,
            league: f.league,
          }));
        }
      } catch (error) {
        console.error("Error fetching live fixtures from API:", error);
      }

      // Fallback to database for live fixtures (status 1H, 2H, HT, ET, P, BT, LIVE)
      console.log(
        "[liveFixturesFromApi] Falling back to database for live fixtures"
      );
      const liveStatuses = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"];
      const dbFixtures = await ctx.prisma.fixture.findMany({
        where: {
          statusShort: { in: liveStatuses },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          season: {
            include: {
              league: {
                include: {
                  country: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: "desc" },
      });

      console.log(
        `[liveFixturesFromApi] Found ${dbFixtures.length} live fixtures in database`
      );

      return dbFixtures.map((f) => ({
        id: f.id,
        date: f.date.toISOString(),
        timestamp: f.timestamp,
        status: f.status,
        statusShort: f.statusShort,
        elapsed: f.elapsed,
        round: f.round,
        homeTeam: {
          id: f.homeTeam.id,
          name: f.homeTeam.name,
          logo: f.homeTeam.logo,
        },
        awayTeam: {
          id: f.awayTeam.id,
          name: f.awayTeam.name,
          logo: f.awayTeam.logo,
        },
        goalsHome: f.goalsHome,
        goalsAway: f.goalsAway,
        league: {
          id: f.season.league.id,
          name: f.season.league.name,
          logo: f.season.league.logo,
          country: f.season.league.country?.name || "England",
        },
      }));
    },
  })
);
