import { builder } from '../builder';
import { footballApiClient } from '../../services/football-api/client';

// Sync result type
const SyncResult = builder.objectType('SyncResult', {
  fields: (t) => ({
    success: t.boolean(),
    message: t.string(),
    count: t.int({ nullable: true }),
  }),
});

builder.mutationField('syncLeagues', (t) =>
  t.field({
    type: SyncResult,
    args: {
      countryCode: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      try {
        const leagues = await footballApiClient.getLeagues(args.countryCode ?? undefined);
        
        for (const league of leagues) {
          // Upsert country
          await ctx.prisma.country.upsert({
            where: { id: league.country.id },
            create: {
              id: league.country.id,
              name: league.country.name,
              code: league.country.code,
              flag: league.country.flag,
            },
            update: {
              name: league.country.name,
              code: league.country.code,
              flag: league.country.flag,
            },
          });
          
          // Upsert league
          await ctx.prisma.league.upsert({
            where: { id: league.id },
            create: {
              id: league.id,
              name: league.name,
              type: league.type,
              logo: league.logo,
              countryId: league.country.id,
            },
            update: {
              name: league.name,
              type: league.type,
              logo: league.logo,
            },
          });
          
          // Upsert seasons
          for (const season of league.seasons) {
            await ctx.prisma.season.upsert({
              where: { id: season.id },
              create: {
                id: season.id,
                year: season.year,
                startDate: new Date(season.start),
                endDate: new Date(season.end),
                current: season.current,
                leagueId: league.id,
              },
              update: {
                year: season.year,
                startDate: new Date(season.start),
                endDate: new Date(season.end),
                current: season.current,
              },
            });
          }
        }
        
        return {
          success: true,
          message: `Synced ${leagues.length} leagues`,
          count: leagues.length,
        };
      } catch (error) {
        console.error('Sync leagues error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          count: null,
        };
      }
    },
  })
);

builder.mutationField('syncTeams', (t) =>
  t.field({
    type: SyncResult,
    args: {
      leagueId: t.arg.int({ required: true }),
      season: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      try {
        const teams = await footballApiClient.getTeams(args.leagueId, args.season);
        
        for (const team of teams) {
          // Upsert team
          await ctx.prisma.team.upsert({
            where: { id: team.id },
            create: {
              id: team.id,
              name: team.name,
              code: team.code,
              logo: team.logo,
              venue: team.venue?.name,
              venueCapacity: team.venue?.capacity,
              countryId: team.country.id,
            },
            update: {
              name: team.name,
              code: team.code,
              logo: team.logo,
              venue: team.venue?.name,
              venueCapacity: team.venue?.capacity,
            },
          });
          
          // Link team to league
          const league = await ctx.prisma.league.findUnique({
            where: { id: args.leagueId },
          });
          
          if (league) {
            await ctx.prisma.team.update({
              where: { id: team.id },
              data: {
                leagues: {
                  connect: { id: args.leagueId },
                },
              },
            });
          }
        }
        
        return {
          success: true,
          message: `Synced ${teams.length} teams`,
          count: teams.length,
        };
      } catch (error) {
        console.error('Sync teams error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          count: null,
        };
      }
    },
  })
);

builder.mutationField('syncFixtures', (t) =>
  t.field({
    type: SyncResult,
    args: {
      leagueId: t.arg.int({ required: true }),
      season: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      try {
        const fixtures = await footballApiClient.getFixtures(args.leagueId, args.season);
        
        // Find the season record
        const seasonRecord = await ctx.prisma.season.findFirst({
          where: {
            leagueId: args.leagueId,
            year: args.season,
          },
        });
        
        if (!seasonRecord) {
          return {
            success: false,
            message: 'Season not found',
            count: null,
          };
        }
        
        for (const fixture of fixtures) {
          await ctx.prisma.fixture.upsert({
            where: { id: fixture.id },
            create: {
              id: fixture.id,
              date: new Date(fixture.date),
              timestamp: fixture.timestamp,
              timezone: fixture.timezone,
              status: fixture.status.long,
              statusShort: fixture.status.short,
              elapsed: fixture.status.elapsed,
              round: fixture.round,
              venue: fixture.venue?.name,
              referee: fixture.referee,
              seasonId: seasonRecord.id,
              homeTeamId: fixture.homeTeam.id,
              awayTeamId: fixture.awayTeam.id,
              goalsHome: fixture.goals.home,
              goalsAway: fixture.goals.away,
              xgHome: fixture.xg?.home,
              xgAway: fixture.xg?.away,
            },
            update: {
              date: new Date(fixture.date),
              status: fixture.status.long,
              statusShort: fixture.status.short,
              elapsed: fixture.status.elapsed,
              venue: fixture.venue?.name,
              referee: fixture.referee,
              goalsHome: fixture.goals.home,
              goalsAway: fixture.goals.away,
              xgHome: fixture.xg?.home,
              xgAway: fixture.xg?.away,
            },
          });
        }
        
        return {
          success: true,
          message: `Synced ${fixtures.length} fixtures`,
          count: fixtures.length,
        };
      } catch (error) {
        console.error('Sync fixtures error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          count: null,
        };
      }
    },
  })
);

builder.mutationField('syncStandings', (t) =>
  t.field({
    type: SyncResult,
    args: {
      leagueId: t.arg.int({ required: true }),
      season: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      try {
        const standings = await footballApiClient.getStandings(args.leagueId, args.season);
        
        // Find the season record
        const seasonRecord = await ctx.prisma.season.findFirst({
          where: {
            leagueId: args.leagueId,
            year: args.season,
          },
        });
        
        if (!seasonRecord) {
          return {
            success: false,
            message: 'Season not found',
            count: null,
          };
        }
        
        let count = 0;
        for (const group of standings) {
          for (const entry of group) {
            await ctx.prisma.standing.upsert({
              where: {
                seasonId_teamId: {
                  seasonId: seasonRecord.id,
                  teamId: entry.team.id,
                },
              },
              create: {
                seasonId: seasonRecord.id,
                teamId: entry.team.id,
                rank: entry.rank,
                points: entry.points,
                goalsDiff: entry.goalsDiff,
                group: entry.group,
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
              },
              update: {
                rank: entry.rank,
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
              },
            });
            count++;
          }
        }
        
        return {
          success: true,
          message: `Synced ${count} standings entries`,
          count,
        };
      } catch (error) {
        console.error('Sync standings error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          count: null,
        };
      }
    },
  })
);

