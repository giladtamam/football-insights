/**
 * Sync real data from Football API
 * 
 * Usage:
 *   Local:  npx tsx prisma/sync-real-data.ts
 *   Prod:   DATABASE_URL="postgresql://..." npx tsx prisma/sync-real-data.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables - first from database package, then from root for API token
// Skip loading .env files if DATABASE_URL is already set (for production)
if (!process.env.DATABASE_URL) {
  config({ path: resolve(__dirname, '../.env') });
}
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import { Agent } from 'undici';

// Disable TLS verification for proxy environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('📦 Connecting to database...');
console.log('   URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');

const prisma = new PrismaClient();

const BASE_URL = process.env.FOOTBALL_API_BASE_URL || 'https://v3.football.api-sports.io';
const API_TOKEN = process.env.FOOTBALL_API_TOKEN;

// Create an agent that ignores SSL errors
const agent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T;
}

async function fetchApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_TOKEN) {
    throw new Error('FOOTBALL_API_TOKEN is not configured. Please set it in your .env file.');
  }

  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log(`📡 Fetching: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': API_TOKEN,
    },
    // @ts-ignore - dispatcher is a valid undici option
    dispatcher: agent,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    const errorMsg = Array.isArray(data.errors)
      ? data.errors.join(', ')
      : Object.values(data.errors).join(', ');
    throw new Error(`API error: ${errorMsg}`);
  }

  console.log(`   ✓ Got ${data.results} results`);
  return data.response;
}

// Country ID mapping
const countryIdMap = new Map<string, number>([
  ['England', 1],
  ['Spain', 2],
  ['Italy', 3],
  ['Germany', 4],
  ['France', 5],
]);
let countryIdCounter = 100;

function getCountryId(countryName: string): number {
  if (!countryIdMap.has(countryName)) {
    countryIdMap.set(countryName, countryIdCounter++);
  }
  return countryIdMap.get(countryName)!;
}

async function syncLeague(leagueId: number) {
  console.log(`\n🏆 Syncing league ${leagueId}...`);
  
  interface LeagueResponse {
    league: { id: number; name: string; type: string; logo: string | null };
    country: { name: string; code: string | null; flag: string | null };
    seasons: Array<{ year: number; start: string; end: string; current: boolean }>;
  }

  const response = await fetchApi<LeagueResponse[]>('/leagues', { id: leagueId.toString() });
  
  if (response.length === 0) {
    throw new Error(`League ${leagueId} not found`);
  }

  const item = response[0];
  const countryId = getCountryId(item.country.name);

  // Upsert country
  await prisma.country.upsert({
    where: { id: countryId },
    create: {
      id: countryId,
      name: item.country.name,
      code: item.country.code,
      flag: item.country.flag,
    },
    update: {
      name: item.country.name,
      code: item.country.code,
      flag: item.country.flag,
    },
  });
  console.log(`   ✓ Country: ${item.country.name}`);

  // Upsert league
  await prisma.league.upsert({
    where: { id: item.league.id },
    create: {
      id: item.league.id,
      name: item.league.name,
      type: item.league.type,
      logo: item.league.logo,
      countryId: countryId,
    },
    update: {
      name: item.league.name,
      type: item.league.type,
      logo: item.league.logo,
    },
  });
  console.log(`   ✓ League: ${item.league.name}`);

  // Upsert seasons
  for (const season of item.seasons) {
    const seasonId = item.league.id * 10000 + season.year;
    await prisma.season.upsert({
      where: { id: seasonId },
      create: {
        id: seasonId,
        year: season.year,
        startDate: new Date(season.start),
        endDate: new Date(season.end),
        current: season.current,
        leagueId: item.league.id,
      },
      update: {
        year: season.year,
        startDate: new Date(season.start),
        endDate: new Date(season.end),
        current: season.current,
      },
    });
  }
  console.log(`   ✓ ${item.seasons.length} seasons`);

  return item;
}

async function syncTeams(leagueId: number, season: number) {
  console.log(`\n👕 Syncing teams for league ${leagueId}, season ${season}...`);

  interface TeamResponse {
    team: { id: number; name: string; code: string | null; logo: string | null; country: string };
    venue: { name: string | null; capacity: number | null };
  }

  const response = await fetchApi<TeamResponse[]>('/teams', {
    league: leagueId.toString(),
    season: season.toString(),
  });

  for (const item of response) {
    const countryId = getCountryId(item.team.country);

    // Ensure country exists
    await prisma.country.upsert({
      where: { id: countryId },
      create: { id: countryId, name: item.team.country },
      update: {},
    });

    // Upsert team
    await prisma.team.upsert({
      where: { id: item.team.id },
      create: {
        id: item.team.id,
        name: item.team.name,
        code: item.team.code,
        logo: item.team.logo,
        venue: item.venue?.name,
        venueCapacity: item.venue?.capacity,
        countryId: countryId,
      },
      update: {
        name: item.team.name,
        code: item.team.code,
        logo: item.team.logo,
        venue: item.venue?.name,
        venueCapacity: item.venue?.capacity,
      },
    });

    // Link team to league
    await prisma.team.update({
      where: { id: item.team.id },
      data: {
        leagues: {
          connect: { id: leagueId },
        },
      },
    });
  }

  console.log(`   ✓ ${response.length} teams synced`);
  return response;
}

async function syncFixtures(leagueId: number, season: number) {
  console.log(`\n⚽ Syncing fixtures for league ${leagueId}, season ${season}...`);

  interface FixtureResponse {
    fixture: {
      id: number;
      date: string;
      timestamp: number;
      timezone: string;
      status: { long: string; short: string; elapsed: number | null };
      venue: { name: string | null };
      referee: string | null;
    };
    league: { round: string };
    teams: {
      home: { id: number; name: string };
      away: { id: number; name: string };
    };
    goals: { home: number | null; away: number | null };
  }

  const response = await fetchApi<FixtureResponse[]>('/fixtures', {
    league: leagueId.toString(),
    season: season.toString(),
  });

  // Find the season record
  const seasonRecord = await prisma.season.findFirst({
    where: { leagueId, year: season },
  });

  if (!seasonRecord) {
    throw new Error(`Season ${season} not found for league ${leagueId}`);
  }

  let synced = 0;
  let skipped = 0;

  for (const item of response) {
    try {
      // Check if both teams exist
      const homeTeam = await prisma.team.findUnique({ where: { id: item.teams.home.id } });
      const awayTeam = await prisma.team.findUnique({ where: { id: item.teams.away.id } });

      if (!homeTeam || !awayTeam) {
        console.log(`   ⚠ Skipping fixture ${item.fixture.id}: teams not found`);
        skipped++;
        continue;
      }

      await prisma.fixture.upsert({
        where: { id: item.fixture.id },
        create: {
          id: item.fixture.id,
          date: new Date(item.fixture.date),
          timestamp: item.fixture.timestamp,
          timezone: item.fixture.timezone,
          status: item.fixture.status.long,
          statusShort: item.fixture.status.short,
          elapsed: item.fixture.status.elapsed,
          round: item.league.round,
          venue: item.fixture.venue?.name,
          referee: item.fixture.referee,
          seasonId: seasonRecord.id,
          homeTeamId: item.teams.home.id,
          awayTeamId: item.teams.away.id,
          goalsHome: item.goals.home,
          goalsAway: item.goals.away,
        },
        update: {
          date: new Date(item.fixture.date),
          status: item.fixture.status.long,
          statusShort: item.fixture.status.short,
          elapsed: item.fixture.status.elapsed,
          venue: item.fixture.venue?.name,
          referee: item.fixture.referee,
          goalsHome: item.goals.home,
          goalsAway: item.goals.away,
        },
      });
      synced++;
    } catch (error) {
      console.log(`   ⚠ Error syncing fixture ${item.fixture.id}:`, error);
      skipped++;
    }
  }

  console.log(`   ✓ ${synced} fixtures synced, ${skipped} skipped`);
  return response;
}

async function syncStandings(leagueId: number, season: number) {
  console.log(`\n📊 Syncing standings for league ${leagueId}, season ${season}...`);

  interface StandingEntry {
    rank: number;
    team: { id: number; name: string; logo: string };
    points: number;
    goalsDiff: number;
    group: string;
    form: string | null;
    status: string | null;
    description: string | null;
    all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
    home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
    away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  }

  interface StandingsResponse {
    league: { standings: StandingEntry[][] };
  }

  const response = await fetchApi<StandingsResponse[]>('/standings', {
    league: leagueId.toString(),
    season: season.toString(),
  });

  if (response.length === 0) {
    console.log('   ⚠ No standings data available');
    return;
  }

  const seasonRecord = await prisma.season.findFirst({
    where: { leagueId, year: season },
  });

  if (!seasonRecord) {
    throw new Error(`Season ${season} not found for league ${leagueId}`);
  }

  let count = 0;
  for (const group of response[0].league.standings) {
    for (const entry of group) {
      // Check if team exists
      const team = await prisma.team.findUnique({ where: { id: entry.team.id } });
      if (!team) {
        console.log(`   ⚠ Team ${entry.team.id} not found, skipping`);
        continue;
      }

      await prisma.standing.upsert({
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

  console.log(`   ✓ ${count} standing entries synced`);
}

async function main() {
  console.log('🚀 Starting real data sync from Football API...\n');

  // Premier League = 39, current season = 2024
  const PREMIER_LEAGUE_ID = 39;
  const SEASON = 2024;

  try {
    // 1. Sync league data
    await syncLeague(PREMIER_LEAGUE_ID);

    // 2. Sync teams
    await syncTeams(PREMIER_LEAGUE_ID, SEASON);

    // 3. Sync fixtures (includes Dec 26-28 games)
    await syncFixtures(PREMIER_LEAGUE_ID, SEASON);

    // 4. Sync standings
    await syncStandings(PREMIER_LEAGUE_ID, SEASON);

    console.log('\n✨ Sync complete!');
    
    // Show some stats
    const fixtureCount = await prisma.fixture.count();
    const teamCount = await prisma.team.count();
    console.log(`\n📈 Database stats:`);
    console.log(`   - Teams: ${teamCount}`);
    console.log(`   - Fixtures: ${fixtureCount}`);
    
    // Show upcoming fixtures around Dec 26-28
    const dec26 = new Date('2024-12-26T00:00:00Z');
    const dec29 = new Date('2024-12-29T00:00:00Z');
    
    const upcomingFixtures = await prisma.fixture.findMany({
      where: {
        date: {
          gte: dec26,
          lt: dec29,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { date: 'asc' },
    });

    if (upcomingFixtures.length > 0) {
      console.log(`\n📅 Fixtures Dec 26-28, 2024:`);
      for (const f of upcomingFixtures) {
        const date = new Date(f.date).toLocaleString();
        console.log(`   ${f.homeTeam.name} vs ${f.awayTeam.name} - ${date}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

