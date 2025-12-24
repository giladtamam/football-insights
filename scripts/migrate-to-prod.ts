import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Read from local SQLite
const localDb = new Database('./packages/database/prisma/dev.db', { readonly: true });

// Write to production PostgreSQL
const prodPrisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting migration to production...\n');

  try {
    // 1. Migrate Countries
    console.log('📍 Migrating countries...');
    const countries = localDb.prepare('SELECT * FROM Country').all() as any[];
    for (const country of countries) {
      await prodPrisma.country.upsert({
        where: { id: country.id },
        create: { id: country.id, name: country.name, code: country.code, flag: country.flag },
        update: { name: country.name, code: country.code, flag: country.flag },
      });
    }
    console.log(`   ✅ Migrated ${countries.length} countries\n`);

    // 2. Migrate Leagues
    console.log('🏆 Migrating leagues...');
    const leagues = localDb.prepare('SELECT * FROM League').all() as any[];
    for (const league of leagues) {
      await prodPrisma.league.upsert({
        where: { id: league.id },
        create: { id: league.id, name: league.name, type: league.type, logo: league.logo, countryId: league.countryId },
        update: { name: league.name, type: league.type, logo: league.logo },
      });
    }
    console.log(`   ✅ Migrated ${leagues.length} leagues\n`);

    // 3. Migrate Teams
    console.log('⚽ Migrating teams...');
    const teams = localDb.prepare('SELECT * FROM Team').all() as any[];
    for (const team of teams) {
      await prodPrisma.team.upsert({
        where: { id: team.id },
        create: { 
          id: team.id, 
          name: team.name, 
          code: team.code, 
          logo: team.logo, 
          venue: team.venue, 
          venueCapacity: team.venueCapacity, 
          countryId: team.countryId 
        },
        update: { name: team.name, code: team.code, logo: team.logo, venue: team.venue, venueCapacity: team.venueCapacity },
      });
    }
    console.log(`   ✅ Migrated ${teams.length} teams\n`);

    // 4. Migrate Seasons
    console.log('📅 Migrating seasons...');
    const seasons = localDb.prepare('SELECT * FROM Season').all() as any[];
    for (const season of seasons) {
      await prodPrisma.season.upsert({
        where: { id: season.id },
        create: { 
          id: season.id, 
          year: season.year, 
          startDate: new Date(season.startDate), 
          endDate: new Date(season.endDate), 
          current: Boolean(season.current), 
          leagueId: season.leagueId 
        },
        update: { year: season.year, startDate: new Date(season.startDate), endDate: new Date(season.endDate), current: Boolean(season.current) },
      });
    }
    console.log(`   ✅ Migrated ${seasons.length} seasons\n`);

    // 5. Migrate Fixtures (in batches)
    console.log('🎮 Migrating fixtures...');
    const fixtures = localDb.prepare('SELECT * FROM Fixture').all() as any[];
    let fixtureCount = 0;
    for (const f of fixtures) {
      try {
        await prodPrisma.fixture.upsert({
          where: { id: f.id },
          create: {
            id: f.id,
            date: new Date(f.date),
            timestamp: f.timestamp,
            timezone: f.timezone,
            status: f.status,
            statusShort: f.statusShort,
            elapsed: f.elapsed,
            round: f.round,
            venue: f.venue,
            referee: f.referee,
            seasonId: f.seasonId,
            homeTeamId: f.homeTeamId,
            awayTeamId: f.awayTeamId,
            goalsHome: f.goalsHome,
            goalsAway: f.goalsAway,
            xgHome: f.xgHome,
            xgAway: f.xgAway,
          },
          update: {
            status: f.status,
            statusShort: f.statusShort,
            elapsed: f.elapsed,
            goalsHome: f.goalsHome,
            goalsAway: f.goalsAway,
            xgHome: f.xgHome,
            xgAway: f.xgAway,
          },
        });
        fixtureCount++;
        if (fixtureCount % 500 === 0) {
          console.log(`   ... ${fixtureCount}/${fixtures.length} fixtures`);
        }
      } catch (e) {
        // Skip fixtures with missing foreign keys
      }
    }
    console.log(`   ✅ Migrated ${fixtureCount} fixtures\n`);

    // 6. Migrate Standings
    console.log('📊 Migrating standings...');
    const standings = localDb.prepare('SELECT * FROM Standing').all() as any[];
    let standingCount = 0;
    for (const s of standings) {
      try {
        await prodPrisma.standing.upsert({
          where: { seasonId_teamId: { seasonId: s.seasonId, teamId: s.teamId } },
          create: {
            seasonId: s.seasonId,
            teamId: s.teamId,
            rank: s.rank,
            points: s.points,
            goalsDiff: s.goalsDiff,
            group: s.group,
            form: s.form,
            status: s.status,
            description: s.description,
            played: s.played,
            win: s.win,
            draw: s.draw,
            lose: s.lose,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            homeWin: s.homeWin,
            homeDraw: s.homeDraw,
            homeLose: s.homeLose,
            homeGoalsFor: s.homeGoalsFor,
            homeGoalsAgainst: s.homeGoalsAgainst,
            awayWin: s.awayWin,
            awayDraw: s.awayDraw,
            awayLose: s.awayLose,
            awayGoalsFor: s.awayGoalsFor,
            awayGoalsAgainst: s.awayGoalsAgainst,
          },
          update: {
            rank: s.rank,
            points: s.points,
            goalsDiff: s.goalsDiff,
            form: s.form,
            played: s.played,
            win: s.win,
            draw: s.draw,
            lose: s.lose,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
          },
        });
        standingCount++;
      } catch (e) {
        // Skip if foreign key missing
      }
    }
    console.log(`   ✅ Migrated ${standingCount} standings\n`);

    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    localDb.close();
    await prodPrisma.$disconnect();
  }
}

migrate();
