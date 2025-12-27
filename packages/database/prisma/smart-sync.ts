/**
 * Smart Sync Script
 * 
 * Intelligently syncs football data based on:
 * - Time of day (more frequent during match hours)
 * - Day of week (weekends have more matches)
 * - What data needs updating
 * 
 * Usage:
 *   npx tsx prisma/smart-sync.ts
 * 
 * Environment variables:
 *   DATABASE_URL - Database connection string
 *   FOOTBALL_API_TOKEN - API-Football token
 *   SYNC_LEAGUES - "all" or comma-separated league IDs (default: "all")
 *   FORCE_FULL_SYNC - "true" to force full sync (default: "false")
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
if (!process.env.DATABASE_URL) {
  config({ path: resolve(__dirname, '../.env') });
}
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import { Agent } from 'undici';

// Disable TLS verification for proxy environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const prisma = new PrismaClient();

const BASE_URL = process.env.FOOTBALL_API_BASE_URL || 'https://v3.football.api-sports.io';
const API_TOKEN = process.env.FOOTBALL_API_TOKEN;

// Top leagues to sync
const TOP_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 61, name: 'Ligue 1', country: 'France' },
  { id: 2, name: 'Champions League', country: 'Europe' },
  { id: 3, name: 'Europa League', country: 'Europe' },
];

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
    throw new Error('FOOTBALL_API_TOKEN is not configured');
  }

  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log(`📡 Fetching: ${endpoint}`, params);

  const response = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_TOKEN },
    // @ts-ignore
    dispatcher: agent,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
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
  ['England', 1], ['Spain', 2], ['Italy', 3], ['Germany', 4], ['France', 5],
  ['Europe', 6], ['World', 7],
]);
let countryIdCounter = 100;

function getCountryId(countryName: string): number {
  if (!countryIdMap.has(countryName)) {
    countryIdMap.set(countryName, countryIdCounter++);
  }
  return countryIdMap.get(countryName)!;
}

async function syncLeague(leagueId: number): Promise<void> {
  console.log(`\n🏆 Syncing league ${leagueId}...`);

  interface LeagueResponse {
    league: { id: number; name: string; type: string; logo: string | null };
    country: { name: string; code: string | null; flag: string | null };
    seasons: Array<{ year: number; start: string; end: string; current: boolean }>;
  }

  const response = await fetchApi<LeagueResponse[]>('/leagues', { id: leagueId.toString() });
  if (response.length === 0) return;

  const item = response[0];
  const countryId = getCountryId(item.country.name);

  await prisma.country.upsert({
    where: { id: countryId },
    create: { id: countryId, name: item.country.name, code: item.country.code, flag: item.country.flag },
    update: { name: item.country.name, code: item.country.code, flag: item.country.flag },
  });

  await prisma.league.upsert({
    where: { id: item.league.id },
    create: { id: item.league.id, name: item.league.name, type: item.league.type, logo: item.league.logo, countryId },
    update: { name: item.league.name, type: item.league.type, logo: item.league.logo },
  });

  for (const season of item.seasons) {
    const seasonId = item.league.id * 10000 + season.year;
    await prisma.season.upsert({
      where: { id: seasonId },
      create: { id: seasonId, year: season.year, startDate: new Date(season.start), endDate: new Date(season.end), current: season.current, leagueId: item.league.id },
      update: { year: season.year, startDate: new Date(season.start), endDate: new Date(season.end), current: season.current },
    });
  }

  console.log(`   ✓ League ${item.league.name} synced with ${item.seasons.length} seasons`);
}

async function syncTeams(leagueId: number, season: number): Promise<void> {
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
    await prisma.country.upsert({
      where: { id: countryId },
      create: { id: countryId, name: item.team.country },
      update: {},
    });

    await prisma.team.upsert({
      where: { id: item.team.id },
      create: { id: item.team.id, name: item.team.name, code: item.team.code, logo: item.team.logo, venue: item.venue?.name, venueCapacity: item.venue?.capacity, countryId },
      update: { name: item.team.name, code: item.team.code, logo: item.team.logo, venue: item.venue?.name, venueCapacity: item.venue?.capacity },
    });

    await prisma.team.update({
      where: { id: item.team.id },
      data: { leagues: { connect: { id: leagueId } } },
    });
  }

  console.log(`   ✓ ${response.length} teams synced`);
}

async function syncFixtures(leagueId: number, season: number, liveOnly: boolean = false): Promise<number> {
  console.log(`\n⚽ Syncing ${liveOnly ? 'live ' : ''}fixtures for league ${leagueId}, season ${season}...`);

  interface FixtureResponse {
    fixture: {
      id: number; date: string; timestamp: number; timezone: string;
      status: { long: string; short: string; elapsed: number | null };
      venue: { name: string | null }; referee: string | null;
    };
    league: { round: string };
    teams: { home: { id: number; name: string }; away: { id: number; name: string } };
    goals: { home: number | null; away: number | null };
  }

  const params: Record<string, string> = {
    league: leagueId.toString(),
    season: season.toString(),
  };

  // If liveOnly, only fetch today's fixtures or live fixtures
  if (liveOnly) {
    const today = new Date().toISOString().split('T')[0];
    params.date = today;
  }

  const response = await fetchApi<FixtureResponse[]>('/fixtures', params);

  const seasonRecord = await prisma.season.findFirst({
    where: { leagueId, year: season },
  });

  if (!seasonRecord) {
    console.log(`   ⚠ Season ${season} not found for league ${leagueId}`);
    return 0;
  }

  let synced = 0;
  for (const item of response) {
    try {
      const homeTeam = await prisma.team.findUnique({ where: { id: item.teams.home.id } });
      const awayTeam = await prisma.team.findUnique({ where: { id: item.teams.away.id } });

      if (!homeTeam || !awayTeam) continue;

      await prisma.fixture.upsert({
        where: { id: item.fixture.id },
        create: {
          id: item.fixture.id, date: new Date(item.fixture.date), timestamp: item.fixture.timestamp,
          timezone: item.fixture.timezone, status: item.fixture.status.long, statusShort: item.fixture.status.short,
          elapsed: item.fixture.status.elapsed, round: item.league.round, venue: item.fixture.venue?.name,
          referee: item.fixture.referee, seasonId: seasonRecord.id, homeTeamId: item.teams.home.id,
          awayTeamId: item.teams.away.id, goalsHome: item.goals.home, goalsAway: item.goals.away,
        },
        update: {
          date: new Date(item.fixture.date), status: item.fixture.status.long, statusShort: item.fixture.status.short,
          elapsed: item.fixture.status.elapsed, venue: item.fixture.venue?.name, referee: item.fixture.referee,
          goalsHome: item.goals.home, goalsAway: item.goals.away,
        },
      });
      synced++;
    } catch (error) {
      // Skip errors for individual fixtures
    }
  }

  console.log(`   ✓ ${synced} fixtures synced`);
  return synced;
}

async function syncStandings(leagueId: number, season: number): Promise<void> {
  console.log(`\n📊 Syncing standings for league ${leagueId}, season ${season}...`);

  interface StandingEntry {
    rank: number; team: { id: number }; points: number; goalsDiff: number;
    group: string; form: string | null; status: string | null; description: string | null;
    all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
    home: { win: number; draw: number; lose: number; goals: { for: number; against: number } };
    away: { win: number; draw: number; lose: number; goals: { for: number; against: number } };
  }

  interface StandingsResponse {
    league: { standings: StandingEntry[][] };
  }

  const response = await fetchApi<StandingsResponse[]>('/standings', {
    league: leagueId.toString(),
    season: season.toString(),
  });

  if (response.length === 0) return;

  const seasonRecord = await prisma.season.findFirst({ where: { leagueId, year: season } });
  if (!seasonRecord) return;

  let count = 0;
  for (const group of response[0].league.standings) {
    for (const entry of group) {
      const team = await prisma.team.findUnique({ where: { id: entry.team.id } });
      if (!team) continue;

      await prisma.standing.upsert({
        where: { seasonId_teamId: { seasonId: seasonRecord.id, teamId: entry.team.id } },
        create: {
          seasonId: seasonRecord.id, teamId: entry.team.id, rank: entry.rank, points: entry.points,
          goalsDiff: entry.goalsDiff, group: entry.group, form: entry.form, status: entry.status,
          description: entry.description, played: entry.all.played, win: entry.all.win, draw: entry.all.draw,
          lose: entry.all.lose, goalsFor: entry.all.goals.for, goalsAgainst: entry.all.goals.against,
          homeWin: entry.home.win, homeDraw: entry.home.draw, homeLose: entry.home.lose,
          homeGoalsFor: entry.home.goals.for, homeGoalsAgainst: entry.home.goals.against,
          awayWin: entry.away.win, awayDraw: entry.away.draw, awayLose: entry.away.lose,
          awayGoalsFor: entry.away.goals.for, awayGoalsAgainst: entry.away.goals.against,
        },
        update: {
          rank: entry.rank, points: entry.points, goalsDiff: entry.goalsDiff, form: entry.form,
          status: entry.status, description: entry.description, played: entry.all.played, win: entry.all.win,
          draw: entry.all.draw, lose: entry.all.lose, goalsFor: entry.all.goals.for,
          goalsAgainst: entry.all.goals.against, homeWin: entry.home.win, homeDraw: entry.home.draw,
          homeLose: entry.home.lose, homeGoalsFor: entry.home.goals.for, homeGoalsAgainst: entry.home.goals.against,
          awayWin: entry.away.win, awayDraw: entry.away.draw, awayLose: entry.away.lose,
          awayGoalsFor: entry.away.goals.for, awayGoalsAgainst: entry.away.goals.against,
        },
      });
      count++;
    }
  }

  console.log(`   ✓ ${count} standings synced`);
}

function isMatchTime(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();

  // Weekends (Sat=6, Sun=0) between 12:00-23:00 UTC
  if ((dayOfWeek === 0 || dayOfWeek === 6) && utcHour >= 12 && utcHour <= 23) {
    return true;
  }

  // Midweek evenings (Tue=2, Wed=3) for Champions League
  if ((dayOfWeek === 2 || dayOfWeek === 3) && utcHour >= 17 && utcHour <= 22) {
    return true;
  }

  return false;
}

function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // If before August, use previous year as season
  return month < 7 ? year - 1 : year;
}

async function main() {
  console.log('🚀 Smart Sync Starting...');
  console.log(`   Time: ${new Date().toISOString()}`);

  const syncLeaguesEnv = process.env.SYNC_LEAGUES || 'all';
  const forceFullSync = process.env.FORCE_FULL_SYNC === 'true';
  const isMatchTimeNow = isMatchTime();
  const currentSeason = getCurrentSeason();

  console.log(`   Current season: ${currentSeason}`);
  console.log(`   Match time: ${isMatchTimeNow}`);
  console.log(`   Force full sync: ${forceFullSync}`);

  // Determine which leagues to sync
  let leaguesToSync = TOP_LEAGUES;
  if (syncLeaguesEnv !== 'all') {
    const leagueIds = syncLeaguesEnv.split(',').map(id => parseInt(id.trim()));
    leaguesToSync = TOP_LEAGUES.filter(l => leagueIds.includes(l.id));
  }

  console.log(`   Leagues: ${leaguesToSync.map(l => l.name).join(', ')}`);

  const stats = { leagues: 0, teams: 0, fixtures: 0, standings: 0 };

  try {
    for (const league of leaguesToSync) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Processing: ${league.name}`);
      console.log('='.repeat(50));

      // Always sync league metadata
      await syncLeague(league.id);
      stats.leagues++;

      // Sync teams only on full sync or first run
      if (forceFullSync) {
        await syncTeams(league.id, currentSeason);
        stats.teams++;
      }

      // During match time, only sync today's fixtures (faster, less API calls)
      // Otherwise, do a full fixtures sync
      if (isMatchTimeNow && !forceFullSync) {
        const count = await syncFixtures(league.id, currentSeason, true);
        stats.fixtures += count;
      } else {
        const count = await syncFixtures(league.id, currentSeason, false);
        stats.fixtures += count;
      }

      // Sync standings (always useful)
      await syncStandings(league.id, currentSeason);
      stats.standings++;

      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ SMART SYNC COMPLETE');
    console.log('='.repeat(50));
    console.log(`📈 Stats:`);
    console.log(`   - Leagues synced: ${stats.leagues}`);
    console.log(`   - Teams synced: ${stats.teams}`);
    console.log(`   - Fixtures synced: ${stats.fixtures}`);
    console.log(`   - Standings synced: ${stats.standings}`);

    // Show recent fixtures
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const recentFixtures = await prisma.fixture.findMany({
      where: {
        date: { gte: yesterday, lte: tomorrow },
      },
      include: { homeTeam: true, awayTeam: true, season: { include: { league: true } } },
      orderBy: { date: 'asc' },
      take: 10,
    });

    if (recentFixtures.length > 0) {
      console.log(`\n📅 Recent Fixtures:`);
      for (const f of recentFixtures) {
        const date = new Date(f.date).toLocaleString();
        const score = f.goalsHome !== null ? `${f.goalsHome}-${f.goalsAway}` : 'vs';
        console.log(`   [${f.season.league.name}] ${f.homeTeam.name} ${score} ${f.awayTeam.name} (${f.statusShort})`);
      }
    }

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
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

