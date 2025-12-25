import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default user
  const user = await prisma.user.upsert({
    where: { email: 'demo@football-insights.com' },
    update: {},
    create: {
      email: 'demo@football-insights.com',
      name: 'Demo User',
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Create sample countries
  const countries = [
    { id: 1, name: 'England', code: 'GB', flag: 'https://media.api-sports.io/flags/gb.svg' },
    { id: 2, name: 'Spain', code: 'ES', flag: 'https://media.api-sports.io/flags/es.svg' },
    { id: 3, name: 'Italy', code: 'IT', flag: 'https://media.api-sports.io/flags/it.svg' },
    { id: 4, name: 'Germany', code: 'DE', flag: 'https://media.api-sports.io/flags/de.svg' },
    { id: 5, name: 'France', code: 'FR', flag: 'https://media.api-sports.io/flags/fr.svg' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { id: country.id },
      update: country,
      create: country,
    });
  }
  console.log(`✅ Created ${countries.length} countries`);

  // Create sample leagues (using API-Football IDs)
  const leagues = [
    { id: 39, name: 'Premier League', type: 'League', countryId: 1, logo: 'https://media.api-sports.io/football/leagues/39.png' },
    { id: 40, name: 'Championship', type: 'League', countryId: 1, logo: 'https://media.api-sports.io/football/leagues/40.png' },
    { id: 140, name: 'La Liga', type: 'League', countryId: 2, logo: 'https://media.api-sports.io/football/leagues/140.png' },
    { id: 135, name: 'Serie A', type: 'League', countryId: 3, logo: 'https://media.api-sports.io/football/leagues/135.png' },
    { id: 78, name: 'Bundesliga', type: 'League', countryId: 4, logo: 'https://media.api-sports.io/football/leagues/78.png' },
    { id: 61, name: 'Ligue 1', type: 'League', countryId: 5, logo: 'https://media.api-sports.io/football/leagues/61.png' },
  ];

  for (const league of leagues) {
    await prisma.league.upsert({
      where: { id: league.id },
      update: league,
      create: league,
    });
  }
  console.log(`✅ Created ${leagues.length} leagues`);

  // Create current season for each league
  const currentYear = 2024;
  for (const league of leagues) {
    const seasonId = league.id * 10000 + currentYear;
    await prisma.season.upsert({
      where: { id: seasonId },
      update: {
        year: currentYear,
        startDate: new Date(`${currentYear}-08-01`),
        endDate: new Date(`${currentYear + 1}-05-31`),
        current: true,
      },
      create: {
        id: seasonId,
        year: currentYear,
        startDate: new Date(`${currentYear}-08-01`),
        endDate: new Date(`${currentYear + 1}-05-31`),
        current: true,
        leagueId: league.id,
      },
    });
  }
  console.log(`✅ Created seasons for ${currentYear}`);

  // Create sample Premier League teams
  const premierLeagueTeams = [
    { id: 33, name: 'Manchester United', code: 'MUN', countryId: 1, venue: 'Old Trafford', venueCapacity: 76000 },
    { id: 34, name: 'Newcastle', code: 'NEW', countryId: 1, venue: 'St. James\' Park', venueCapacity: 52305 },
    { id: 35, name: 'Bournemouth', code: 'BOU', countryId: 1, venue: 'Vitality Stadium', venueCapacity: 11307 },
    { id: 36, name: 'Fulham', code: 'FUL', countryId: 1, venue: 'Craven Cottage', venueCapacity: 25700 },
    { id: 39, name: 'Wolves', code: 'WOL', countryId: 1, venue: 'Molineux Stadium', venueCapacity: 32050 },
    { id: 40, name: 'Liverpool', code: 'LIV', countryId: 1, venue: 'Anfield', venueCapacity: 61000 },
    { id: 42, name: 'Arsenal', code: 'ARS', countryId: 1, venue: 'Emirates Stadium', venueCapacity: 60704 },
    { id: 45, name: 'Everton', code: 'EVE', countryId: 1, venue: 'Goodison Park', venueCapacity: 39414 },
    { id: 46, name: 'Leicester', code: 'LEI', countryId: 1, venue: 'King Power Stadium', venueCapacity: 32312 },
    { id: 47, name: 'Tottenham', code: 'TOT', countryId: 1, venue: 'Tottenham Hotspur Stadium', venueCapacity: 62850 },
    { id: 48, name: 'West Ham', code: 'WHU', countryId: 1, venue: 'London Stadium', venueCapacity: 62500 },
    { id: 49, name: 'Chelsea', code: 'CHE', countryId: 1, venue: 'Stamford Bridge', venueCapacity: 40834 },
    { id: 50, name: 'Manchester City', code: 'MCI', countryId: 1, venue: 'Etihad Stadium', venueCapacity: 55097 },
    { id: 51, name: 'Brighton', code: 'BHA', countryId: 1, venue: 'Amex Stadium', venueCapacity: 31876 },
    { id: 52, name: 'Crystal Palace', code: 'CRY', countryId: 1, venue: 'Selhurst Park', venueCapacity: 26047 },
    { id: 55, name: 'Brentford', code: 'BRE', countryId: 1, venue: 'Gtech Community Stadium', venueCapacity: 17250 },
    { id: 63, name: 'Nottingham Forest', code: 'NFO', countryId: 1, venue: 'City Ground', venueCapacity: 30455 },
    { id: 66, name: 'Aston Villa', code: 'AVL', countryId: 1, venue: 'Villa Park', venueCapacity: 42682 },
    { id: 57, name: 'Ipswich Town', code: 'IPS', countryId: 1, venue: 'Portman Road', venueCapacity: 30311 },
    { id: 41, name: 'Southampton', code: 'SOU', countryId: 1, venue: 'St. Mary\'s Stadium', venueCapacity: 32384 },
  ];

  for (const team of premierLeagueTeams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: {
        ...team,
        logo: `https://media.api-sports.io/football/teams/${team.id}.png`,
      },
      create: {
        ...team,
        logo: `https://media.api-sports.io/football/teams/${team.id}.png`,
      },
    });

    // Connect team to Premier League
    await prisma.team.update({
      where: { id: team.id },
      data: {
        leagues: {
          connect: { id: 39 },
        },
      },
    });
  }
  console.log(`✅ Created ${premierLeagueTeams.length} Premier League teams`);

  // Create sample fixtures for today
  const today = new Date();
  today.setHours(15, 0, 0, 0);
  const plSeasonId = 39 * 10000 + currentYear;

  const sampleFixtures = [
    {
      id: 1000001,
      homeTeamId: 42, // Arsenal
      awayTeamId: 49, // Chelsea
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
    },
    {
      id: 1000002,
      homeTeamId: 40, // Liverpool
      awayTeamId: 50, // Man City
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
    },
    {
      id: 1000003,
      homeTeamId: 33, // Man United
      awayTeamId: 47, // Tottenham
      goalsHome: 2,
      goalsAway: 1,
      xgHome: 1.85,
      xgAway: 1.42,
      status: 'Match Finished',
      statusShort: 'FT',
    },
    {
      id: 1000004,
      homeTeamId: 66, // Aston Villa
      awayTeamId: 34, // Newcastle
      goalsHome: 1,
      goalsAway: 1,
      xgHome: 0.95,
      xgAway: 1.67,
      status: 'Match Finished',
      statusShort: 'FT',
    },
  ];

  for (let i = 0; i < sampleFixtures.length; i++) {
    const fixtureDate = new Date(today);
    fixtureDate.setHours(15 + i * 2, 0, 0, 0);

    await prisma.fixture.upsert({
      where: { id: sampleFixtures[i].id },
      update: {
        ...sampleFixtures[i],
        date: fixtureDate,
        timestamp: Math.floor(fixtureDate.getTime() / 1000),
      },
      create: {
        id: sampleFixtures[i].id,
        date: fixtureDate,
        timestamp: Math.floor(fixtureDate.getTime() / 1000),
        timezone: 'UTC',
        status: sampleFixtures[i].status,
        statusShort: sampleFixtures[i].statusShort,
        round: 'Regular Season - 17',
        seasonId: plSeasonId,
        homeTeamId: sampleFixtures[i].homeTeamId,
        awayTeamId: sampleFixtures[i].awayTeamId,
        goalsHome: sampleFixtures[i].goalsHome,
        goalsAway: sampleFixtures[i].goalsAway,
        xgHome: sampleFixtures[i].xgHome,
        xgAway: sampleFixtures[i].xgAway,
      },
    });
  }
  console.log(`✅ Created ${sampleFixtures.length} sample fixtures`);

  // Create Christmas Day 2025 fixtures (December 25, 2025)
  // Boxing Day style Premier League fixtures
  const christmasDay = new Date('2025-12-25T12:30:00Z');
  
  const christmasFixtures = [
    {
      id: 2000001,
      homeTeamId: 42, // Arsenal
      awayTeamId: 57, // Ipswich Town
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T12:30:00Z'),
      round: 'Regular Season - 18',
      venue: 'Emirates Stadium',
      referee: 'Michael Oliver',
    },
    {
      id: 2000002,
      homeTeamId: 35, // Bournemouth
      awayTeamId: 52, // Crystal Palace
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T15:00:00Z'),
      round: 'Regular Season - 18',
      venue: 'Vitality Stadium',
      referee: 'Anthony Taylor',
    },
    {
      id: 2000003,
      homeTeamId: 49, // Chelsea
      awayTeamId: 36, // Fulham
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T15:00:00Z'),
      round: 'Regular Season - 18',
      venue: 'Stamford Bridge',
      referee: 'Simon Hooper',
    },
    {
      id: 2000004,
      homeTeamId: 34, // Newcastle
      awayTeamId: 66, // Aston Villa
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T15:00:00Z'),
      round: 'Regular Season - 18',
      venue: "St. James' Park",
      referee: 'Stuart Attwell',
    },
    {
      id: 2000005,
      homeTeamId: 63, // Nottingham Forest
      awayTeamId: 47, // Tottenham
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T15:00:00Z'),
      round: 'Regular Season - 18',
      venue: 'City Ground',
      referee: 'Chris Kavanagh',
    },
    {
      id: 2000006,
      homeTeamId: 41, // Southampton
      awayTeamId: 48, // West Ham
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T15:00:00Z'),
      round: 'Regular Season - 18',
      venue: "St. Mary's Stadium",
      referee: 'Peter Bankes',
    },
    {
      id: 2000007,
      homeTeamId: 39, // Wolves
      awayTeamId: 33, // Man United
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T17:30:00Z'),
      round: 'Regular Season - 18',
      venue: 'Molineux Stadium',
      referee: 'David Coote',
    },
    {
      id: 2000008,
      homeTeamId: 50, // Man City
      awayTeamId: 45, // Everton
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T20:00:00Z'),
      round: 'Regular Season - 18',
      venue: 'Etihad Stadium',
      referee: 'Michael Oliver',
    },
    {
      id: 2000009,
      homeTeamId: 40, // Liverpool
      awayTeamId: 46, // Leicester
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T20:00:00Z'),
      round: 'Regular Season - 18',
      venue: 'Anfield',
      referee: 'Paul Tierney',
    },
    {
      id: 2000010,
      homeTeamId: 55, // Brentford
      awayTeamId: 51, // Brighton
      goalsHome: null,
      goalsAway: null,
      xgHome: null,
      xgAway: null,
      status: 'Not Started',
      statusShort: 'NS',
      kickoff: new Date('2025-12-25T17:30:00Z'),
      round: 'Regular Season - 18',
      venue: 'Gtech Community Stadium',
      referee: 'Robert Jones',
    },
  ];

  for (const fixture of christmasFixtures) {
    await prisma.fixture.upsert({
      where: { id: fixture.id },
      update: {
        date: fixture.kickoff,
        timestamp: Math.floor(fixture.kickoff.getTime() / 1000),
        timezone: 'UTC',
        status: fixture.status,
        statusShort: fixture.statusShort,
        round: fixture.round,
        venue: fixture.venue,
        referee: fixture.referee,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        goalsHome: fixture.goalsHome,
        goalsAway: fixture.goalsAway,
        xgHome: fixture.xgHome,
        xgAway: fixture.xgAway,
      },
      create: {
        id: fixture.id,
        date: fixture.kickoff,
        timestamp: Math.floor(fixture.kickoff.getTime() / 1000),
        timezone: 'UTC',
        status: fixture.status,
        statusShort: fixture.statusShort,
        round: fixture.round,
        venue: fixture.venue,
        referee: fixture.referee,
        seasonId: plSeasonId,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        goalsHome: fixture.goalsHome,
        goalsAway: fixture.goalsAway,
        xgHome: fixture.xgHome,
        xgAway: fixture.xgAway,
      },
    });
  }
  console.log(`✅ Created ${christmasFixtures.length} Christmas Day 2025 fixtures`);

  // Create sample standings
  const standingsData = [
    { rank: 1, teamId: 40, points: 39, goalsDiff: 25, played: 16, win: 12, draw: 3, lose: 1, goalsFor: 36, goalsAgainst: 11, form: 'WWWWD' },
    { rank: 2, teamId: 42, points: 33, goalsDiff: 18, played: 16, win: 10, draw: 3, lose: 3, goalsFor: 32, goalsAgainst: 14, form: 'WDWWL' },
    { rank: 3, teamId: 63, points: 31, goalsDiff: 8, played: 16, win: 9, draw: 4, lose: 3, goalsFor: 24, goalsAgainst: 16, form: 'DWWLW' },
    { rank: 4, teamId: 49, points: 30, goalsDiff: 12, played: 16, win: 9, draw: 3, lose: 4, goalsFor: 31, goalsAgainst: 19, form: 'WWDLW' },
    { rank: 5, teamId: 34, points: 29, goalsDiff: 9, played: 16, win: 8, draw: 5, lose: 3, goalsFor: 26, goalsAgainst: 17, form: 'DWDWW' },
    { rank: 6, teamId: 50, points: 28, goalsDiff: 11, played: 16, win: 8, draw: 4, lose: 4, goalsFor: 30, goalsAgainst: 19, form: 'WLWDL' },
    { rank: 7, teamId: 36, points: 27, goalsDiff: 4, played: 16, win: 7, draw: 6, lose: 3, goalsFor: 26, goalsAgainst: 22, form: 'WDWDD' },
    { rank: 8, teamId: 35, points: 26, goalsDiff: 2, played: 16, win: 7, draw: 5, lose: 4, goalsFor: 24, goalsAgainst: 22, form: 'DLWWD' },
    { rank: 9, teamId: 51, points: 25, goalsDiff: 5, played: 16, win: 6, draw: 7, lose: 3, goalsFor: 25, goalsAgainst: 20, form: 'DDDWL' },
    { rank: 10, teamId: 66, points: 25, goalsDiff: 3, played: 16, win: 7, draw: 4, lose: 5, goalsFor: 23, goalsAgainst: 20, form: 'LWDLD' },
  ];

  for (const standing of standingsData) {
    await prisma.standing.upsert({
      where: {
        seasonId_teamId: {
          seasonId: plSeasonId,
          teamId: standing.teamId,
        },
      },
      update: standing,
      create: {
        ...standing,
        seasonId: plSeasonId,
      },
    });
  }
  console.log(`✅ Created ${standingsData.length} standings entries`);

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

