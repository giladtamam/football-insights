/**
 * API-Football Client
 * Documentation: https://www.api-football.com/documentation-v3
 */
import https from 'https';

const BASE_URL = process.env.FOOTBALL_API_BASE_URL || 'https://v3.football.api-sports.io';
const API_TOKEN = process.env.FOOTBALL_API_TOKEN;

// Create a custom agent that ignores certificate errors (for development/proxy environments)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

// Types for API responses
interface ApiCountry {
  name: string;
  code: string | null;
  flag: string | null;
}

interface ApiLeague {
  id: number;
  name: string;
  type: string;
  logo: string | null;
  country: {
    id: number;
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: Array<{
    id: number;
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

interface ApiTeam {
  id: number;
  name: string;
  code: string | null;
  logo: string | null;
  country: {
    id: number;
    name: string;
  };
  venue?: {
    name: string | null;
    capacity: number | null;
  };
}

interface ApiFixture {
  id: number;
  date: string;
  timestamp: number;
  timezone: string;
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
  round: string | null;
  venue?: {
    name: string | null;
  };
  referee: string | null;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  xg?: {
    home: number | null;
    away: number | null;
  };
}

interface ApiStandingEntry {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string | null;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

interface ApiFixtureStats {
  team: {
    id: number;
    name: string;
  };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

async function fetchApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_TOKEN) {
    throw new Error('FOOTBALL_API_TOKEN is not configured');
  }

  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Use custom fetch options for environments with certificate issues
  const fetchOptions: RequestInit & { dispatcher?: unknown } = {
    headers: {
      'x-apisports-key': API_TOKEN,
    },
  };

  // For Node.js environments with SSL certificate issues
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    // @ts-ignore - dispatcher is a valid undici option
    const { Agent } = await import('undici');
    fetchOptions.dispatcher = new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();

  // Check for API errors
  if (data.errors && Object.keys(data.errors).length > 0) {
    const errorMsg = Array.isArray(data.errors)
      ? data.errors.join(', ')
      : Object.values(data.errors).join(', ');
    throw new Error(`API error: ${errorMsg}`);
  }

  return data.response;
}

// Country ID mapping (API-Football doesn't have country IDs in all endpoints)
const countryIdMap = new Map<string, number>();
let countryIdCounter = 1;

function getCountryId(countryName: string): number {
  if (!countryIdMap.has(countryName)) {
    countryIdMap.set(countryName, countryIdCounter++);
  }
  return countryIdMap.get(countryName)!;
}

export const footballApiClient = {
  async getLeagues(countryCode?: string): Promise<ApiLeague[]> {
    const params: Record<string, string> = {};
    if (countryCode) {
      params.code = countryCode;
    }

    interface LeagueResponse {
      league: {
        id: number;
        name: string;
        type: string;
        logo: string | null;
      };
      country: {
        name: string;
        code: string | null;
        flag: string | null;
      };
      seasons: Array<{
        year: number;
        start: string;
        end: string;
        current: boolean;
      }>;
    }

    const response = await fetchApi<LeagueResponse[]>('/leagues', params);

    return response.map((item) => ({
      id: item.league.id,
      name: item.league.name,
      type: item.league.type,
      logo: item.league.logo,
      country: {
        id: getCountryId(item.country.name),
        name: item.country.name,
        code: item.country.code,
        flag: item.country.flag,
      },
      seasons: item.seasons.map((s, idx) => ({
        id: item.league.id * 10000 + s.year, // Generate unique season ID
        year: s.year,
        start: s.start,
        end: s.end,
        current: s.current,
      })),
    }));
  },

  async getTeams(leagueId: number, season: number): Promise<ApiTeam[]> {
    interface TeamResponse {
      team: {
        id: number;
        name: string;
        code: string | null;
        logo: string | null;
        country: string;
      };
      venue: {
        name: string | null;
        capacity: number | null;
      };
    }

    const response = await fetchApi<TeamResponse[]>('/teams', {
      league: leagueId.toString(),
      season: season.toString(),
    });

    return response.map((item) => ({
      id: item.team.id,
      name: item.team.name,
      code: item.team.code,
      logo: item.team.logo,
      country: {
        id: getCountryId(item.team.country),
        name: item.team.country,
      },
      venue: item.venue,
    }));
  },

  async getFixtures(leagueId: number, season: number): Promise<ApiFixture[]> {
    interface FixtureResponse {
      fixture: {
        id: number;
        date: string;
        timestamp: number;
        timezone: string;
        status: {
          long: string;
          short: string;
          elapsed: number | null;
        };
        venue: {
          name: string | null;
        };
        referee: string | null;
      };
      league: {
        round: string;
      };
      teams: {
        home: {
          id: number;
          name: string;
        };
        away: {
          id: number;
          name: string;
        };
      };
      goals: {
        home: number | null;
        away: number | null;
      };
    }

    const response = await fetchApi<FixtureResponse[]>('/fixtures', {
      league: leagueId.toString(),
      season: season.toString(),
    });

    return response.map((item) => ({
      id: item.fixture.id,
      date: item.fixture.date,
      timestamp: item.fixture.timestamp,
      timezone: item.fixture.timezone,
      status: item.fixture.status,
      round: item.league.round,
      venue: item.fixture.venue,
      referee: item.fixture.referee,
      homeTeam: item.teams.home,
      awayTeam: item.teams.away,
      goals: item.goals,
      // Note: xG is not available in the standard fixtures endpoint
      // It requires the "fixtures/statistics" endpoint or a premium plan
    }));
  },

  async getFixtureStatistics(fixtureId: number): Promise<ApiFixtureStats[]> {
    return fetchApi<ApiFixtureStats[]>('/fixtures/statistics', {
      fixture: fixtureId.toString(),
    });
  },

  async getStandings(leagueId: number, season: number): Promise<ApiStandingEntry[][]> {
    interface StandingsResponse {
      league: {
        standings: ApiStandingEntry[][];
      };
    }

    const response = await fetchApi<StandingsResponse[]>('/standings', {
      league: leagueId.toString(),
      season: season.toString(),
    });

    if (response.length === 0) {
      return [];
    }

    return response[0].league.standings;
  },

  async getLiveFixtures(): Promise<Array<ApiFixture & { league: { id: number; name: string; logo: string | null; country: string } }>> {
    interface FixtureResponse {
      fixture: {
        id: number;
        date: string;
        timestamp: number;
        timezone: string;
        status: {
          long: string;
          short: string;
          elapsed: number | null;
        };
        venue: {
          name: string | null;
        };
        referee: string | null;
      };
      league: {
        id: number;
        name: string;
        country: string;
        logo: string | null;
        round: string;
      };
      teams: {
        home: {
          id: number;
          name: string;
          logo: string | null;
        };
        away: {
          id: number;
          name: string;
          logo: string | null;
        };
      };
      goals: {
        home: number | null;
        away: number | null;
      };
    }

    const response = await fetchApi<FixtureResponse[]>('/fixtures', {
      live: 'all',
    });

    return response.map((item) => ({
      id: item.fixture.id,
      date: item.fixture.date,
      timestamp: item.fixture.timestamp,
      timezone: item.fixture.timezone,
      status: item.fixture.status,
      round: item.league.round,
      venue: item.fixture.venue,
      referee: item.fixture.referee,
      homeTeam: { ...item.teams.home, logo: item.teams.home.logo },
      awayTeam: { ...item.teams.away, logo: item.teams.away.logo },
      goals: item.goals,
      league: {
        id: item.league.id,
        name: item.league.name,
        logo: item.league.logo,
        country: item.league.country,
      },
    }));
  },

  async getFixturesByDate(date: string): Promise<ApiFixture[]> {
    interface FixtureResponse {
      fixture: {
        id: number;
        date: string;
        timestamp: number;
        timezone: string;
        status: {
          long: string;
          short: string;
          elapsed: number | null;
        };
        venue: {
          name: string | null;
        };
        referee: string | null;
      };
      league: {
        round: string;
      };
      teams: {
        home: {
          id: number;
          name: string;
        };
        away: {
          id: number;
          name: string;
        };
      };
      goals: {
        home: number | null;
        away: number | null;
      };
    }

    const response = await fetchApi<FixtureResponse[]>('/fixtures', {
      date, // Format: YYYY-MM-DD
    });

    return response.map((item) => ({
      id: item.fixture.id,
      date: item.fixture.date,
      timestamp: item.fixture.timestamp,
      timezone: item.fixture.timezone,
      status: item.fixture.status,
      round: item.league.round,
      venue: item.fixture.venue,
      referee: item.fixture.referee,
      homeTeam: item.teams.home,
      awayTeam: item.teams.away,
      goals: item.goals,
    }));
  },

  /**
   * Get lineups for a fixture
   */
  async getFixtureLineups(fixtureId: number): Promise<{
    team: { id: number; name: string; logo: string };
    formation: string;
    startXI: Array<{
      player: { id: number; name: string; number: number; pos: string };
    }>;
    substitutes: Array<{
      player: { id: number; name: string; number: number; pos: string };
    }>;
    coach: { id: number; name: string; photo: string } | null;
  }[]> {
    interface LineupResponse {
      team: { id: number; name: string; logo: string };
      formation: string;
      startXI: Array<{
        player: { id: number; name: string; number: number; pos: string };
      }>;
      substitutes: Array<{
        player: { id: number; name: string; number: number; pos: string };
      }>;
      coach: { id: number; name: string; photo: string } | null;
    }

    return fetchApi<LineupResponse[]>('/fixtures/lineups', {
      fixture: fixtureId.toString(),
    });
  },

  /**
   * Get events for a fixture (goals, cards, subs)
   */
  async getFixtureEvents(fixtureId: number): Promise<Array<{
    time: { elapsed: number; extra: number | null };
    team: { id: number; name: string; logo: string };
    player: { id: number; name: string };
    assist: { id: number | null; name: string | null };
    type: string;
    detail: string;
    comments: string | null;
  }>> {
    interface EventResponse {
      time: { elapsed: number; extra: number | null };
      team: { id: number; name: string; logo: string };
      player: { id: number; name: string };
      assist: { id: number | null; name: string | null };
      type: string;
      detail: string;
      comments: string | null;
    }

    return fetchApi<EventResponse[]>('/fixtures/events', {
      fixture: fixtureId.toString(),
    });
  },

  /**
   * Get head-to-head data between two teams
   */
  async getHeadToHead(team1Id: number, team2Id: number, limit: number = 10): Promise<Array<{
    fixture: {
      id: number;
      date: string;
      venue: { name: string | null };
      referee: string | null;
    };
    teams: {
      home: { id: number; name: string; logo: string; winner: boolean | null };
      away: { id: number; name: string; logo: string; winner: boolean | null };
    };
    goals: { home: number | null; away: number | null };
    league: { id: number; name: string; logo: string };
  }>> {
    interface H2HResponse {
      fixture: {
        id: number;
        date: string;
        venue: { name: string | null };
        referee: string | null;
      };
      teams: {
        home: { id: number; name: string; logo: string; winner: boolean | null };
        away: { id: number; name: string; logo: string; winner: boolean | null };
      };
      goals: { home: number | null; away: number | null };
      league: { id: number; name: string; logo: string };
    }

    return fetchApi<H2HResponse[]>('/fixtures/headtohead', {
      h2h: `${team1Id}-${team2Id}`,
      last: limit.toString(),
    });
  },

  /**
   * Get player statistics for a fixture
   */
  async getFixturePlayers(fixtureId: number): Promise<Array<{
    team: { id: number; name: string; logo: string };
    players: Array<{
      player: { id: number; name: string; photo: string };
      statistics: Array<{
        games: { minutes: number | null; position: string | null; rating: string | null };
        shots: { total: number | null; on: number | null };
        goals: { total: number | null; assists: number | null };
        passes: { total: number | null; key: number | null; accuracy: string | null };
        tackles: { total: number | null; interceptions: number | null };
        duels: { total: number | null; won: number | null };
        dribbles: { attempts: number | null; success: number | null };
        fouls: { drawn: number | null; committed: number | null };
        cards: { yellow: number | null; red: number | null };
      }>;
    }>;
  }>> {
    interface PlayersResponse {
      team: { id: number; name: string; logo: string };
      players: Array<{
        player: { id: number; name: string; photo: string };
        statistics: Array<{
          games: { minutes: number | null; position: string | null; rating: string | null };
          shots: { total: number | null; on: number | null };
          goals: { total: number | null; assists: number | null };
          passes: { total: number | null; key: number | null; accuracy: string | null };
          tackles: { total: number | null; interceptions: number | null };
          duels: { total: number | null; won: number | null };
          dribbles: { attempts: number | null; success: number | null };
          fouls: { drawn: number | null; committed: number | null };
          cards: { yellow: number | null; red: number | null };
        }>;
      }>;
    }

    return fetchApi<PlayersResponse[]>('/fixtures/players', {
      fixture: fixtureId.toString(),
    });
  },
};

