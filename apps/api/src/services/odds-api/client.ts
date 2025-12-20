/**
 * The Odds API Client
 * Documentation: https://the-odds-api.com/liveapi/guides/v4/
 * 
 * Provides real-time and historical odds data from multiple bookmakers
 */
import { Agent } from 'undici';

const BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY;

// Sport key mappings
const SPORT_KEYS: Record<number, string> = {
  39: 'soccer_epl',           // Premier League
  40: 'soccer_efl_champ',     // Championship
  140: 'soccer_spain_la_liga', // La Liga
  135: 'soccer_italy_serie_a', // Serie A
  78: 'soccer_germany_bundesliga', // Bundesliga
  61: 'soccer_france_ligue_one', // Ligue 1
  88: 'soccer_netherlands_eredivisie', // Eredivisie
  94: 'soccer_portugal_primeira_liga', // Primeira Liga
  2: 'soccer_uefa_champs_league', // Champions League
  3: 'soccer_uefa_europa_league', // Europa League
};

interface OddsApiResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      last_update: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

interface ProcessedOdds {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: Array<{
    key: string;
    name: string;
    lastUpdate: string;
    markets: {
      h2h?: { home: number; draw: number; away: number };
      spreads?: { home: number; away: number; homePoint: number; awayPoint: number };
      totals?: { over: number; under: number; point: number };
    };
  }>;
  consensus: {
    h2h?: { home: number; draw: number; away: number };
    totals?: { over: number; under: number; point: number };
  };
}

async function fetchOddsApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error('ODDS_API_KEY is not configured');
  }

  // Build URL properly - endpoint should start with /
  const fullUrl = `${BASE_URL}${endpoint}`;
  const url = new URL(fullUrl);
  url.searchParams.append('apiKey', API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  console.log(`Odds API request: ${url.toString().replace(API_KEY, '***')}`);

  const fetchOptions: RequestInit & { dispatcher?: unknown } = {};
  
  // Handle SSL certificate issues
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    fetchOptions.dispatcher = new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Odds API request failed: ${response.status} - ${errorText}`);
  }

  // Log remaining requests from headers
  const remaining = response.headers.get('x-requests-remaining');
  const used = response.headers.get('x-requests-used');
  console.log(`Odds API: ${used} requests used, ${remaining} remaining`);

  return response.json();
}

function calculateConsensusOdds(
  bookmakers: OddsApiResponse['bookmakers'],
  homeTeam: string,
  awayTeam: string
): ProcessedOdds['consensus'] {
  const h2hOdds: { home: number[]; draw: number[]; away: number[] } = { home: [], draw: [], away: [] };
  const totalsOdds: { over: number[]; under: number[]; point: number } = { over: [], under: [], point: 2.5 };

  for (const bookmaker of bookmakers) {
    for (const market of bookmaker.markets) {
      if (market.key === 'h2h') {
        for (const outcome of market.outcomes) {
          // Match by team name since API returns actual team names
          if (outcome.name === homeTeam) {
            h2hOdds.home.push(outcome.price);
          } else if (outcome.name === 'Draw') {
            h2hOdds.draw.push(outcome.price);
          } else if (outcome.name === awayTeam) {
            h2hOdds.away.push(outcome.price);
          }
        }
      } else if (market.key === 'totals') {
        for (const outcome of market.outcomes) {
          if (outcome.name === 'Over') {
            totalsOdds.over.push(outcome.price);
            if (outcome.point) totalsOdds.point = outcome.point;
          } else if (outcome.name === 'Under') {
            totalsOdds.under.push(outcome.price);
          }
        }
      }
    }
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    h2h: h2hOdds.home.length > 0 ? {
      home: Number(avg(h2hOdds.home).toFixed(2)),
      draw: Number(avg(h2hOdds.draw).toFixed(2)),
      away: Number(avg(h2hOdds.away).toFixed(2)),
    } : undefined,
    totals: totalsOdds.over.length > 0 ? {
      over: Number(avg(totalsOdds.over).toFixed(2)),
      under: Number(avg(totalsOdds.under).toFixed(2)),
      point: totalsOdds.point,
    } : undefined,
  };
}

function processOddsResponse(data: OddsApiResponse[]): ProcessedOdds[] {
  return data.map((event) => {
    const processedBookmakers = event.bookmakers.map((bookmaker) => {
      const markets: ProcessedOdds['bookmakers'][0]['markets'] = {};

      for (const market of bookmaker.markets) {
        if (market.key === 'h2h') {
          const homeOutcome = market.outcomes.find(o => o.name === event.home_team);
          const drawOutcome = market.outcomes.find(o => o.name === 'Draw');
          const awayOutcome = market.outcomes.find(o => o.name === event.away_team);
          
          if (homeOutcome && awayOutcome) {
            markets.h2h = {
              home: homeOutcome.price,
              draw: drawOutcome?.price || 0,
              away: awayOutcome.price,
            };
          }
        } else if (market.key === 'spreads') {
          const homeOutcome = market.outcomes.find(o => o.name === event.home_team);
          const awayOutcome = market.outcomes.find(o => o.name === event.away_team);
          
          if (homeOutcome && awayOutcome) {
            markets.spreads = {
              home: homeOutcome.price,
              away: awayOutcome.price,
              homePoint: homeOutcome.point || 0,
              awayPoint: awayOutcome.point || 0,
            };
          }
        } else if (market.key === 'totals') {
          const overOutcome = market.outcomes.find(o => o.name === 'Over');
          const underOutcome = market.outcomes.find(o => o.name === 'Under');
          
          if (overOutcome && underOutcome) {
            markets.totals = {
              over: overOutcome.price,
              under: underOutcome.price,
              point: overOutcome.point || 2.5,
            };
          }
        }
      }

      return {
        key: bookmaker.key,
        name: bookmaker.title,
        lastUpdate: bookmaker.last_update,
        markets,
      };
    });

    return {
      eventId: event.id,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
      bookmakers: processedBookmakers,
      consensus: calculateConsensusOdds(event.bookmakers, event.home_team, event.away_team),
    };
  });
}

export const oddsApiClient = {
  /**
   * Get available sports
   */
  async getSports(): Promise<Array<{ key: string; title: string; active: boolean }>> {
    return fetchOddsApi('/sports');
  },

  /**
   * Get odds for a specific league/sport
   */
  async getOdds(
    leagueId: number,
    options: {
      markets?: string[];
      regions?: string[];
      oddsFormat?: 'decimal' | 'american';
    } = {}
  ): Promise<ProcessedOdds[]> {
    const sportKey = SPORT_KEYS[leagueId];
    if (!sportKey) {
      throw new Error(`No sport key mapping for league ${leagueId}`);
    }

    const params: Record<string, string> = {
      regions: (options.regions || ['uk', 'eu']).join(','),
      markets: (options.markets || ['h2h', 'totals']).join(','),
      oddsFormat: options.oddsFormat || 'decimal',
    };

    const data = await fetchOddsApi<OddsApiResponse[]>(`/sports/${sportKey}/odds`, params);
    return processOddsResponse(data);
  },

  /**
   * Get odds for a specific event
   */
  async getEventOdds(
    leagueId: number,
    eventId: string,
    options: {
      markets?: string[];
      regions?: string[];
    } = {}
  ): Promise<ProcessedOdds | null> {
    const sportKey = SPORT_KEYS[leagueId];
    if (!sportKey) {
      throw new Error(`No sport key mapping for league ${leagueId}`);
    }

    const params: Record<string, string> = {
      regions: (options.regions || ['uk', 'eu']).join(','),
      markets: (options.markets || ['h2h', 'totals', 'spreads']).join(','),
      oddsFormat: 'decimal',
      eventIds: eventId,
    };

    const data = await fetchOddsApi<OddsApiResponse[]>(`/sports/${sportKey}/odds`, params);
    const processed = processOddsResponse(data);
    return processed[0] || null;
  },

  /**
   * Get historical odds (requires paid plan)
   */
  async getHistoricalOdds(
    leagueId: number,
    date: string, // ISO format
    options: {
      markets?: string[];
      regions?: string[];
    } = {}
  ): Promise<ProcessedOdds[]> {
    const sportKey = SPORT_KEYS[leagueId];
    if (!sportKey) {
      throw new Error(`No sport key mapping for league ${leagueId}`);
    }

    const params: Record<string, string> = {
      regions: (options.regions || ['uk', 'eu']).join(','),
      markets: (options.markets || ['h2h', 'totals']).join(','),
      oddsFormat: 'decimal',
      date: date,
    };

    const data = await fetchOddsApi<OddsApiResponse[]>(`/sports/${sportKey}/odds-history`, params);
    return processOddsResponse(data);
  },

  /**
   * Get upcoming events (useful for matching with fixtures)
   */
  async getUpcomingEvents(leagueId: number): Promise<Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
  }>> {
    const sportKey = SPORT_KEYS[leagueId];
    if (!sportKey) {
      throw new Error(`No sport key mapping for league ${leagueId}`);
    }

    const data = await fetchOddsApi<OddsApiResponse[]>(`/sports/${sportKey}/events`);
    return data.map(event => ({
      id: event.id,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
    }));
  },

  /**
   * Calculate implied probabilities from odds
   */
  calculateImpliedProbabilities(odds: { home: number; draw: number; away: number }): {
    home: number;
    draw: number;
    away: number;
    overround: number;
  } {
    const homeProb = 1 / odds.home;
    const drawProb = 1 / odds.draw;
    const awayProb = 1 / odds.away;
    const overround = homeProb + drawProb + awayProb - 1;

    // Remove overround for fair probabilities
    const total = homeProb + drawProb + awayProb;
    return {
      home: Number((homeProb / total).toFixed(4)),
      draw: Number((drawProb / total).toFixed(4)),
      away: Number((awayProb / total).toFixed(4)),
      overround: Number(overround.toFixed(4)),
    };
  },

  /**
   * Sport key mapping getter
   */
  getSportKey(leagueId: number): string | undefined {
    return SPORT_KEYS[leagueId];
  },
};

