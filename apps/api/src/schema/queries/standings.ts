import { builder } from '../builder';
import { footballApiClient } from '../../services/football-api/client';

builder.queryField('standings', (t) =>
  t.prismaField({
    type: ['Standing'],
    args: {
      seasonId: t.arg.int({ required: false }),
      leagueId: t.arg.int({ required: false }),
      group: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      let seasonId = args.seasonId;
      
      // If leagueId is provided but not seasonId, find a season with standings
      if (!seasonId && args.leagueId) {
        // First, try to find a season with standings data
        const seasonWithStandings = await ctx.prisma.standing.findFirst({
          where: {
            season: { leagueId: args.leagueId }
          },
          orderBy: { season: { year: 'desc' } },
          select: { seasonId: true },
        });
        
        if (seasonWithStandings) {
          seasonId = seasonWithStandings.seasonId;
        } else {
          // Fall back to current season
          const currentSeason = await ctx.prisma.season.findFirst({
            where: { leagueId: args.leagueId, current: true },
            select: { id: true },
          });
          seasonId = currentSeason?.id;
        }
      }
      
      if (!seasonId) {
        return [];
      }
      
      const where: Record<string, unknown> = {
        seasonId,
      };
      
      if (args.group) {
        where.group = args.group;
      }
      
      return ctx.prisma.standing.findMany({
        ...query,
        where,
        orderBy: { rank: 'asc' },
      });
    },
  })
);

// Real-time standings from API for current season 2025-2026
const LiveStandingTeamType = builder
  .objectRef<{
    id: number;
    name: string;
    logo: string | null;
  }>('LiveStandingTeam')
  .implement({
    fields: (t) => ({
      id: t.exposeInt('id'),
      name: t.exposeString('name'),
      logo: t.exposeString('logo', { nullable: true }),
    }),
  });

const LiveStandingType = builder
  .objectRef<{
    rank: number;
    team: { id: number; name: string; logo: string | null };
    points: number;
    goalsDiff: number;
    form: string | null;
    status: string | null;
    description: string | null;
    played: number;
    win: number;
    draw: number;
    lose: number;
    goalsFor: number;
    goalsAgainst: number;
    homeWin: number;
    homeDraw: number;
    homeLose: number;
    homeGoalsFor: number;
    homeGoalsAgainst: number;
    awayWin: number;
    awayDraw: number;
    awayLose: number;
    awayGoalsFor: number;
    awayGoalsAgainst: number;
  }>('LiveStanding')
  .implement({
    fields: (t) => ({
      rank: t.exposeInt('rank'),
      team: t.field({
        type: LiveStandingTeamType,
        resolve: (parent) => parent.team,
      }),
      points: t.exposeInt('points'),
      goalsDiff: t.exposeInt('goalsDiff'),
      form: t.exposeString('form', { nullable: true }),
      status: t.exposeString('status', { nullable: true }),
      description: t.exposeString('description', { nullable: true }),
      played: t.exposeInt('played'),
      win: t.exposeInt('win'),
      draw: t.exposeInt('draw'),
      lose: t.exposeInt('lose'),
      goalsFor: t.exposeInt('goalsFor'),
      goalsAgainst: t.exposeInt('goalsAgainst'),
      homeWin: t.exposeInt('homeWin'),
      homeDraw: t.exposeInt('homeDraw'),
      homeLose: t.exposeInt('homeLose'),
      homeGoalsFor: t.exposeInt('homeGoalsFor'),
      homeGoalsAgainst: t.exposeInt('homeGoalsAgainst'),
      awayWin: t.exposeInt('awayWin'),
      awayDraw: t.exposeInt('awayDraw'),
      awayLose: t.exposeInt('awayLose'),
      awayGoalsFor: t.exposeInt('awayGoalsFor'),
      awayGoalsAgainst: t.exposeInt('awayGoalsAgainst'),
    }),
  });

builder.queryField('liveStandings', (t) =>
  t.field({
    type: [LiveStandingType],
    args: {
      leagueId: t.arg.int({ required: true }),
      season: t.arg.int({ required: false }), // Auto-detect current season if not provided
    },
    resolve: async (_parent, args, ctx) => {
      // Auto-detect current season based on date
      // Football seasons run Aug-May, so:
      // - Aug-Dec = current year's season (e.g., Dec 2025 = 2025 season = 2025-26)
      // - Jan-Jul = previous year's season (e.g., Mar 2026 = 2025 season = 2025-26)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      const autoSeason = currentMonth >= 8 ? currentYear : currentYear - 1;
      const season = args.season ?? autoSeason;
      
      console.log(`[liveStandings] Using season ${season} (auto-detected: ${autoSeason}, current date: ${now.toISOString()})`)
      
      // Check if API token is configured
      const hasApiToken = !!process.env.FOOTBALL_API_TOKEN;
      
      if (!hasApiToken) {
        console.log('[liveStandings] No API token configured, falling back to database');
        // Fallback to database standings
        const dbStandings = await ctx.prisma.standing.findMany({
          where: {
            season: { leagueId: args.leagueId }
          },
          orderBy: { rank: 'asc' },
          include: { team: true }
        });
        
        return dbStandings.map((entry) => ({
          rank: entry.rank,
          team: {
            id: entry.team.id,
            name: entry.team.name,
            logo: entry.team.logo,
          },
          points: entry.points,
          goalsDiff: entry.goalsDiff,
          form: entry.form,
          status: entry.status,
          description: entry.description,
          played: entry.played,
          win: entry.win,
          draw: entry.draw,
          lose: entry.lose,
          goalsFor: entry.goalsFor,
          goalsAgainst: entry.goalsAgainst,
          homeWin: entry.homeWin,
          homeDraw: entry.homeDraw,
          homeLose: entry.homeLose,
          homeGoalsFor: entry.homeGoalsFor,
          homeGoalsAgainst: entry.homeGoalsAgainst,
          awayWin: entry.awayWin,
          awayDraw: entry.awayDraw,
          awayLose: entry.awayLose,
          awayGoalsFor: entry.awayGoalsFor,
          awayGoalsAgainst: entry.awayGoalsAgainst,
        }));
      }
      
      console.log(`[liveStandings] Fetching standings for league ${args.leagueId}, season ${season}`);
      
      // Try to fetch standings, with fallback for free plan limitations
      const seasonsToTry = [season, 2023, 2022, 2021]; // Current season, then fallback to free plan seasons
      
      for (const tryingSeason of seasonsToTry) {
        try {
          console.log(`[liveStandings] Trying season ${tryingSeason}...`);
          const standingsData = await footballApiClient.getStandings(args.leagueId, tryingSeason);
          
          console.log(`[liveStandings] Received ${standingsData?.length ?? 0} standings groups for season ${tryingSeason}`);
          
          if (!standingsData || standingsData.length === 0) {
            console.log(`[liveStandings] No standings data for season ${tryingSeason}`);
            continue;
          }
          
          // Flatten all groups into a single array (for leagues with groups)
          const allStandings = standingsData.flat();
          
          console.log(`[liveStandings] Total ${allStandings.length} teams in standings (season ${tryingSeason})`);
          
          if (tryingSeason !== season) {
            console.log(`[liveStandings] NOTE: Using historical season ${tryingSeason} data (free plan limitation)`);
          }
          
          return allStandings.map((entry) => ({
            rank: entry.rank,
            team: {
              id: entry.team.id,
              name: entry.team.name,
              logo: entry.team.logo,
            },
            points: entry.points,
            goalsDiff: entry.goalsDiff,
            form: entry.form,
            status: entry.status,
            description: entry.description,
            played: entry.all.played,
            win: entry.all.win,
            draw: entry.all.draw,
            lose: entry.all.lose,
            goalsFor: entry.all.goals.for,
            goalsAgainst: entry.all.goals.against,
            homeWin: entry.home.win,
            homeDraw: entry.home.draw,
            homeLose: entry.home.lose,
            homeGoalsFor: entry.home.goals.for,
            homeGoalsAgainst: entry.home.goals.against,
            awayWin: entry.away.win,
            awayDraw: entry.away.draw,
            awayLose: entry.away.lose,
            awayGoalsFor: entry.away.goals.for,
            awayGoalsAgainst: entry.away.goals.against,
          }));
        } catch (error: any) {
          const errorMessage = error?.message || String(error);
          console.error(`[liveStandings] Error fetching season ${tryingSeason}:`, errorMessage);
          
          // If it's a free plan error, try next season
          if (errorMessage.includes('Free plans')) {
            console.log(`[liveStandings] Free plan limitation, trying older season...`);
            continue;
          }
          
          // For other errors, continue to next season as well
          continue;
        }
      }
      
      // All API seasons failed - fall back to database (most recent season with actual standings)
      console.log('[liveStandings] All API seasons failed, falling back to database');
      
      // Find the most recent season that has standings data
      const latestStanding = await ctx.prisma.standing.findFirst({
        where: {
          season: { leagueId: args.leagueId }
        },
        orderBy: { season: { year: 'desc' } },
        include: { season: true }
      });
      
      if (!latestStanding) {
        console.log('[liveStandings] No standings data found in database for this league');
        return [];
      }
      
      const latestSeasonId = latestStanding.seasonId;
      console.log(`[liveStandings] Using database season ${latestStanding.season.year} (id: ${latestSeasonId})`);
      
      const dbStandings = await ctx.prisma.standing.findMany({
        where: {
          seasonId: latestSeasonId
        },
        orderBy: { rank: 'asc' },
        include: { team: true }
      });
      
      if (dbStandings.length > 0) {
        console.log(`[liveStandings] Returning ${dbStandings.length} standings from database`);
        return dbStandings.map((entry) => ({
          rank: entry.rank,
          team: {
            id: entry.team.id,
            name: entry.team.name,
            logo: entry.team.logo,
          },
          points: entry.points,
          goalsDiff: entry.goalsDiff,
          form: entry.form,
          status: entry.status,
          description: entry.description,
          played: entry.played,
          win: entry.win,
          draw: entry.draw,
          lose: entry.lose,
          goalsFor: entry.goalsFor,
          goalsAgainst: entry.goalsAgainst,
          homeWin: entry.homeWin,
          homeDraw: entry.homeDraw,
          homeLose: entry.homeLose,
          homeGoalsFor: entry.homeGoalsFor,
          homeGoalsAgainst: entry.homeGoalsAgainst,
          awayWin: entry.awayWin,
          awayDraw: entry.awayDraw,
          awayLose: entry.awayLose,
          awayGoalsFor: entry.awayGoalsFor,
          awayGoalsAgainst: entry.awayGoalsAgainst,
        }));
      }
      
      return [];
    },
  })
);

builder.queryField('teamStandings', (t) =>
  t.prismaField({
    type: 'Standing',
    nullable: true,
    args: {
      seasonId: t.arg.int({ required: true }),
      teamId: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.standing.findFirst({
        ...query,
        where: {
          seasonId: args.seasonId,
          teamId: args.teamId,
        },
      });
    },
  })
);

