import { builder } from '../builder';
import { footballApiClient } from '../../services/football-api/client';

// Query to get fixture lineups
builder.queryField('fixtureLineups', (t) =>
  t.field({
    type: ['TeamLineup'],
    args: {
      fixtureId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args) => {
      try {
        const lineups = await footballApiClient.getFixtureLineups(args.fixtureId);
        
        return lineups.map((lineup) => ({
          teamId: lineup.team.id,
          teamName: lineup.team.name,
          teamLogo: lineup.team.logo,
          formation: lineup.formation || '4-4-2',
          startXI: lineup.startXI.map((p) => ({
            id: p.player.id,
            name: p.player.name,
            number: p.player.number,
            pos: p.player.pos || 'Unknown',
          })),
          substitutes: lineup.substitutes.map((p) => ({
            id: p.player.id,
            name: p.player.name,
            number: p.player.number,
            pos: p.player.pos || 'Sub',
          })),
          coach: lineup.coach ? {
            id: lineup.coach.id,
            name: lineup.coach.name,
            photo: lineup.coach.photo,
          } : null,
        }));
      } catch (error) {
        console.error('Error fetching lineups:', error);
        return [];
      }
    },
  })
);

// Query to get fixture events
builder.queryField('fixtureEvents', (t) =>
  t.field({
    type: ['MatchEvent'],
    args: {
      fixtureId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args) => {
      try {
        const events = await footballApiClient.getFixtureEvents(args.fixtureId);
        
        return events.map((event) => ({
          time: event.time.elapsed,
          extraTime: event.time.extra,
          teamId: event.team.id,
          teamName: event.team.name,
          playerName: event.player.name,
          assistName: event.assist?.name || null,
          type: event.type,
          detail: event.detail,
          comments: event.comments,
        }));
      } catch (error) {
        console.error('Error fetching events:', error);
        return [];
      }
    },
  })
);

// Query to get head-to-head data from API
builder.queryField('h2hFromApi', (t) =>
  t.field({
    type: 'H2HResult',
    args: {
      team1Id: t.arg.int({ required: true }),
      team2Id: t.arg.int({ required: true }),
      limit: t.arg.int({ required: false, defaultValue: 10 }),
    },
    resolve: async (_parent, args) => {
      try {
        const h2hData = await footballApiClient.getHeadToHead(
          args.team1Id,
          args.team2Id,
          args.limit ?? 10
        );

        // Calculate summary stats
        let team1Wins = 0;
        let team2Wins = 0;
        let draws = 0;
        let team1Goals = 0;
        let team2Goals = 0;

        const matches = h2hData.map((match) => {
          const isTeam1Home = match.teams.home.id === args.team1Id;
          const homeGoals = match.goals.home ?? 0;
          const awayGoals = match.goals.away ?? 0;

          if (isTeam1Home) {
            team1Goals += homeGoals;
            team2Goals += awayGoals;
            if (match.teams.home.winner === true) team1Wins++;
            else if (match.teams.away.winner === true) team2Wins++;
            else draws++;
          } else {
            team1Goals += awayGoals;
            team2Goals += homeGoals;
            if (match.teams.away.winner === true) team1Wins++;
            else if (match.teams.home.winner === true) team2Wins++;
            else draws++;
          }

          return {
            fixtureId: match.fixture.id,
            date: match.fixture.date,
            venue: match.fixture.venue?.name || null,
            homeTeamId: match.teams.home.id,
            homeTeamName: match.teams.home.name,
            homeTeamLogo: match.teams.home.logo,
            awayTeamId: match.teams.away.id,
            awayTeamName: match.teams.away.name,
            awayTeamLogo: match.teams.away.logo,
            homeGoals: match.goals.home,
            awayGoals: match.goals.away,
            homeWinner: match.teams.home.winner,
            leagueName: match.league.name,
            leagueLogo: match.league.logo,
          };
        });

        return {
          summary: {
            totalMatches: h2hData.length,
            team1Wins,
            team2Wins,
            draws,
            team1Goals,
            team2Goals,
          },
          matches,
        };
      } catch (error) {
        console.error('Error fetching H2H:', error);
        return {
          summary: {
            totalMatches: 0,
            team1Wins: 0,
            team2Wins: 0,
            draws: 0,
            team1Goals: 0,
            team2Goals: 0,
          },
          matches: [],
        };
      }
    },
  })
);

// H2H result type
builder.objectType('H2HResult', {
  fields: (t) => ({
    summary: t.field({ type: 'H2HSummary' }),
    matches: t.field({ type: ['H2HMatch'] }),
  }),
});

// Query to get player statistics for a fixture
builder.queryField('fixturePlayerStats', (t) =>
  t.field({
    type: ['TeamPlayerStats'],
    args: {
      fixtureId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args) => {
      try {
        const playerData = await footballApiClient.getFixturePlayers(args.fixtureId);
        
        return playerData.map((team) => ({
          teamId: team.team.id,
          teamName: team.team.name,
          teamLogo: team.team.logo,
          players: team.players.map((p) => {
            const stats = p.statistics[0] || {};
            return {
              playerId: p.player.id,
              playerName: p.player.name,
              playerPhoto: p.player.photo,
              position: stats.games?.position || null,
              rating: stats.games?.rating ? parseFloat(stats.games.rating) : null,
              minutes: stats.games?.minutes || null,
              goals: stats.goals?.total || null,
              assists: stats.goals?.assists || null,
              shots: stats.shots?.total || null,
              shotsOnTarget: stats.shots?.on || null,
              passes: stats.passes?.total || null,
              keyPasses: stats.passes?.key || null,
              passAccuracy: stats.passes?.accuracy || null,
              tackles: stats.tackles?.total || null,
              interceptions: stats.tackles?.interceptions || null,
              duelsWon: stats.duels?.won || null,
              duelsTotal: stats.duels?.total || null,
              dribblesSuccess: stats.dribbles?.success || null,
              dribblesAttempts: stats.dribbles?.attempts || null,
              foulsDrawn: stats.fouls?.drawn || null,
              foulsCommitted: stats.fouls?.committed || null,
              yellowCards: stats.cards?.yellow || null,
              redCards: stats.cards?.red || null,
            };
          }),
        }));
      } catch (error) {
        console.error('Error fetching player stats:', error);
        return [];
      }
    },
  })
);

// Query to get fixture statistics (team stats like possession, shots, etc.)
builder.queryField('fixtureStats', (t) =>
  t.field({
    type: 'JSON',
    args: {
      fixtureId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args) => {
      try {
        const stats = await footballApiClient.getFixtureStatistics(args.fixtureId);
        return stats;
      } catch (error) {
        console.error('Error fetching fixture stats:', error);
        return null;
      }
    },
  })
);

