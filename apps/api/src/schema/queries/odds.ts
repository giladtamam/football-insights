import { builder } from '../builder';
import { oddsApiClient } from '../../services/odds-api/client';

// Query to get live odds for a league
builder.queryField('liveOdds', (t) =>
  t.field({
    type: ['LiveOdds'],
    args: {
      leagueId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args) => {
      try {
        const odds = await oddsApiClient.getOdds(args.leagueId, {
          markets: ['h2h', 'totals'],
          regions: ['uk', 'eu'],
        });

        return odds.map((event) => ({
          eventId: event.eventId,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          commenceTime: event.commenceTime,
          bookmakers: event.bookmakers.map((b) => ({
            key: b.key,
            name: b.name,
            lastUpdate: b.lastUpdate,
            h2h: b.markets.h2h ? {
              home: b.markets.h2h.home,
              draw: b.markets.h2h.draw,
              away: b.markets.h2h.away,
              homePoint: null,
              awayPoint: null,
              over: null,
              under: null,
              point: null,
            } : null,
            spreads: b.markets.spreads ? {
              home: b.markets.spreads.home,
              draw: null,
              away: b.markets.spreads.away,
              homePoint: b.markets.spreads.homePoint,
              awayPoint: b.markets.spreads.awayPoint,
              over: null,
              under: null,
              point: null,
            } : null,
            totals: b.markets.totals ? {
              home: null,
              draw: null,
              away: null,
              homePoint: null,
              awayPoint: null,
              over: b.markets.totals.over,
              under: b.markets.totals.under,
              point: b.markets.totals.point,
            } : null,
          })),
          consensus: event.consensus.h2h ? {
            home: event.consensus.h2h.home,
            draw: event.consensus.h2h.draw,
            away: event.consensus.h2h.away,
            over: event.consensus.totals?.over || null,
            under: event.consensus.totals?.under || null,
            point: event.consensus.totals?.point || null,
          } : null,
          impliedProbabilities: event.consensus.h2h ? 
            oddsApiClient.calculateImpliedProbabilities(event.consensus.h2h) : null,
        }));
      } catch (error) {
        console.error('Error fetching live odds:', error);
        return [];
      }
    },
  })
);

// Query to get odds for a specific fixture by matching team names
builder.queryField('fixtureOdds', (t) =>
  t.field({
    type: 'LiveOdds',
    nullable: true,
    args: {
      fixtureId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      try {
        // Get fixture details
        const fixture = await ctx.prisma.fixture.findUnique({
          where: { id: args.fixtureId },
          include: {
            homeTeam: true,
            awayTeam: true,
            season: {
              include: { league: true },
            },
          },
        });

        if (!fixture) return null;

        const leagueId = fixture.season.league.id;
        
        // Get all odds for this league
        const allOdds = await oddsApiClient.getOdds(leagueId, {
          markets: ['h2h', 'totals', 'spreads'],
          regions: ['uk', 'eu'],
        });

        // Find matching event by team names (fuzzy matching)
        const normalizeTeamName = (name: string) => 
          name.toLowerCase()
            .replace(/fc|cf|afc|sc|ac/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        const homeNormalized = normalizeTeamName(fixture.homeTeam.name);
        const awayNormalized = normalizeTeamName(fixture.awayTeam.name);

        const matchingEvent = allOdds.find((event) => {
          const eventHome = normalizeTeamName(event.homeTeam);
          const eventAway = normalizeTeamName(event.awayTeam);
          return (
            (eventHome.includes(homeNormalized) || homeNormalized.includes(eventHome)) &&
            (eventAway.includes(awayNormalized) || awayNormalized.includes(eventAway))
          );
        });

        if (!matchingEvent) return null;

        return {
          eventId: matchingEvent.eventId,
          homeTeam: matchingEvent.homeTeam,
          awayTeam: matchingEvent.awayTeam,
          commenceTime: matchingEvent.commenceTime,
          bookmakers: matchingEvent.bookmakers.map((b) => ({
            key: b.key,
            name: b.name,
            lastUpdate: b.lastUpdate,
            h2h: b.markets.h2h ? {
              home: b.markets.h2h.home,
              draw: b.markets.h2h.draw,
              away: b.markets.h2h.away,
              homePoint: null,
              awayPoint: null,
              over: null,
              under: null,
              point: null,
            } : null,
            spreads: b.markets.spreads ? {
              home: b.markets.spreads.home,
              draw: null,
              away: b.markets.spreads.away,
              homePoint: b.markets.spreads.homePoint,
              awayPoint: b.markets.spreads.awayPoint,
              over: null,
              under: null,
              point: null,
            } : null,
            totals: b.markets.totals ? {
              home: null,
              draw: null,
              away: null,
              homePoint: null,
              awayPoint: null,
              over: b.markets.totals.over,
              under: b.markets.totals.under,
              point: b.markets.totals.point,
            } : null,
          })),
          consensus: matchingEvent.consensus.h2h ? {
            home: matchingEvent.consensus.h2h.home,
            draw: matchingEvent.consensus.h2h.draw,
            away: matchingEvent.consensus.h2h.away,
            over: matchingEvent.consensus.totals?.over || null,
            under: matchingEvent.consensus.totals?.under || null,
            point: matchingEvent.consensus.totals?.point || null,
          } : null,
          impliedProbabilities: matchingEvent.consensus.h2h ?
            oddsApiClient.calculateImpliedProbabilities(matchingEvent.consensus.h2h) : null,
        };
      } catch (error) {
        console.error('Error fetching fixture odds:', error);
        return null;
      }
    },
  })
);

// Query to get stored odds snapshots for a fixture
builder.queryField('oddsHistory', (t) =>
  t.prismaField({
    type: ['OddsSnapshot'],
    args: {
      fixtureId: t.arg.int({ required: true }),
      market: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, ctx) => {
      return ctx.prisma.oddsSnapshot.findMany({
        ...query,
        where: {
          fixtureId: args.fixtureId,
          ...(args.market ? { market: args.market } : {}),
        },
        orderBy: { capturedAt: 'asc' },
      });
    },
  })
);

