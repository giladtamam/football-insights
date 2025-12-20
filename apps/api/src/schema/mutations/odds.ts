import { builder } from '../builder';
import { oddsApiClient } from '../../services/odds-api/client';

// Sync result type
const OddsSyncResult = builder.objectType('OddsSyncResult', {
  fields: (t) => ({
    success: t.boolean(),
    message: t.string(),
    snapshotsCreated: t.int({ nullable: true }),
    eventsMatched: t.int({ nullable: true }),
  }),
});

// Mutation to sync and store current odds for upcoming fixtures
builder.mutationField('syncOdds', (t) =>
  t.field({
    type: OddsSyncResult,
    args: {
      leagueId: t.arg.int({ required: true }),
      markAsOpening: t.arg.boolean({ required: false, defaultValue: false }),
    },
    resolve: async (_parent, args, ctx) => {
      try {
        // Get live odds from API
        const liveOdds = await oddsApiClient.getOdds(args.leagueId, {
          markets: ['h2h', 'totals'],
          regions: ['uk', 'eu'],
        });

        if (liveOdds.length === 0) {
          return {
            success: true,
            message: 'No odds data available for this league',
            snapshotsCreated: 0,
            eventsMatched: 0,
          };
        }

        // Get upcoming fixtures for this league
        const fixtures = await ctx.prisma.fixture.findMany({
          where: {
            season: { leagueId: args.leagueId },
            statusShort: { in: ['NS', 'TBD'] },
          },
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        });

        const normalizeTeamName = (name: string) =>
          name.toLowerCase()
            .replace(/fc|cf|afc|sc|ac/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        let snapshotsCreated = 0;
        let eventsMatched = 0;

        for (const odds of liveOdds) {
          const oddsHome = normalizeTeamName(odds.homeTeam);
          const oddsAway = normalizeTeamName(odds.awayTeam);

          // Find matching fixture
          const matchingFixture = fixtures.find((f) => {
            const fixtureHome = normalizeTeamName(f.homeTeam.name);
            const fixtureAway = normalizeTeamName(f.awayTeam.name);
            return (
              (fixtureHome.includes(oddsHome) || oddsHome.includes(fixtureHome)) &&
              (fixtureAway.includes(oddsAway) || oddsAway.includes(fixtureAway))
            );
          });

          if (!matchingFixture) continue;
          eventsMatched++;

          // Store odds from each bookmaker
          for (const bookmaker of odds.bookmakers) {
            // Store H2H odds
            if (bookmaker.markets.h2h) {
              await ctx.prisma.oddsSnapshot.create({
                data: {
                  fixtureId: matchingFixture.id,
                  bookmaker: bookmaker.key,
                  market: '1X2',
                  homeOdds: bookmaker.markets.h2h.home,
                  drawOdds: bookmaker.markets.h2h.draw,
                  awayOdds: bookmaker.markets.h2h.away,
                  isOpening: args.markAsOpening || false,
                  isClosing: false,
                },
              });
              snapshotsCreated++;
            }

            // Store totals odds
            if (bookmaker.markets.totals) {
              await ctx.prisma.oddsSnapshot.create({
                data: {
                  fixtureId: matchingFixture.id,
                  bookmaker: bookmaker.key,
                  market: 'O/U 2.5',
                  overOdds: bookmaker.markets.totals.over,
                  underOdds: bookmaker.markets.totals.under,
                  line: bookmaker.markets.totals.point,
                  isOpening: args.markAsOpening || false,
                  isClosing: false,
                },
              });
              snapshotsCreated++;
            }
          }

          // Also store consensus odds
          if (odds.consensus.h2h) {
            await ctx.prisma.oddsSnapshot.create({
              data: {
                fixtureId: matchingFixture.id,
                bookmaker: 'consensus',
                market: '1X2',
                homeOdds: odds.consensus.h2h.home,
                drawOdds: odds.consensus.h2h.draw,
                awayOdds: odds.consensus.h2h.away,
                isOpening: args.markAsOpening || false,
                isClosing: false,
              },
            });
            snapshotsCreated++;
          }

          if (odds.consensus.totals) {
            await ctx.prisma.oddsSnapshot.create({
              data: {
                fixtureId: matchingFixture.id,
                bookmaker: 'consensus',
                market: 'O/U 2.5',
                overOdds: odds.consensus.totals.over,
                underOdds: odds.consensus.totals.under,
                line: odds.consensus.totals.point,
                isOpening: args.markAsOpening || false,
                isClosing: false,
              },
            });
            snapshotsCreated++;
          }
        }

        return {
          success: true,
          message: `Synced odds for ${eventsMatched} events`,
          snapshotsCreated,
          eventsMatched,
        };
      } catch (error) {
        console.error('Sync odds error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          snapshotsCreated: null,
          eventsMatched: null,
        };
      }
    },
  })
);

// Mutation to mark current odds as closing (before match starts)
builder.mutationField('markClosingOdds', (t) =>
  t.field({
    type: OddsSyncResult,
    args: {
      fixtureId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      try {
        // Get the latest odds for this fixture
        const latestOdds = await ctx.prisma.oddsSnapshot.findMany({
          where: { fixtureId: args.fixtureId },
          orderBy: { capturedAt: 'desc' },
          distinct: ['bookmaker', 'market'],
        });

        // Update them as closing odds
        for (const odds of latestOdds) {
          await ctx.prisma.oddsSnapshot.update({
            where: { id: odds.id },
            data: { isClosing: true },
          });
        }

        return {
          success: true,
          message: `Marked ${latestOdds.length} odds as closing`,
          snapshotsCreated: null,
          eventsMatched: null,
        };
      } catch (error) {
        console.error('Mark closing odds error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          snapshotsCreated: null,
          eventsMatched: null,
        };
      }
    },
  })
);

