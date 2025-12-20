import { gql } from "@apollo/client";

// Fragment definitions for reuse
export const TEAM_FRAGMENT = gql`
  fragment TeamFields on Team {
    id
    name
    code
    logo
  }
`;

export const FIXTURE_FRAGMENT = gql`
  fragment FixtureFields on Fixture {
    id
    date
    timestamp
    timezone
    status
    statusShort
    elapsed
    round
    venue
    referee
    goalsHome
    goalsAway
    xgHome
    xgAway
    isLive
    isFinished
    isUpcoming
    homeTeam {
      ...TeamFields
    }
    awayTeam {
      ...TeamFields
    }
    season {
      id
      year
      league {
        id
        name
        logo
        country {
          id
          name
          code
          flag
        }
      }
    }
  }
  ${TEAM_FRAGMENT}
`;

export const FIXTURE_WITH_STATS_FRAGMENT = gql`
  fragment FixtureWithStatsFields on Fixture {
    ...FixtureFields
    stats {
      homeStats
      awayStats
    }
    notes {
      id
      content
      tags
      createdAt
    }
  }
  ${FIXTURE_FRAGMENT}
`;

// Queries
export const GET_COUNTRIES = gql`
  query GetCountries {
    countries {
      id
      name
      code
      flag
      leagues {
        id
        name
        type
        logo
      }
    }
  }
`;

export const GET_LEAGUES = gql`
  query GetLeagues($countryId: Int) {
    leagues(countryId: $countryId) {
      id
      name
      type
      logo
      country {
        id
        name
        code
        flag
      }
      seasons {
        id
        year
        current
        startDate
        endDate
      }
    }
  }
`;

export const GET_LEAGUE = gql`
  query GetLeague($id: Int!) {
    league(id: $id) {
      id
      name
      type
      logo
      country {
        id
        name
        code
        flag
      }
      seasons {
        id
        year
        current
        startDate
        endDate
      }
    }
  }
`;

export const GET_FIXTURES = gql`
  query GetFixtures($filter: FixtureFilterInput, $limit: Int, $offset: Int) {
    fixtures(filter: $filter, limit: $limit, offset: $offset) {
      ...FixtureFields
    }
  }
  ${FIXTURE_FRAGMENT}
`;

export const GET_TODAY_FIXTURES = gql`
  query GetTodayFixtures($leagueIds: [Int!]) {
    todayFixtures(leagueIds: $leagueIds) {
      ...FixtureFields
    }
  }
  ${FIXTURE_FRAGMENT}
`;

export const GET_LIVE_FIXTURES = gql`
  query GetLiveFixtures {
    liveFixtures {
      ...FixtureFields
    }
  }
  ${FIXTURE_FRAGMENT}
`;

// Real-time live fixtures directly from API-Football
export const GET_LIVE_FIXTURES_FROM_API = gql`
  query GetLiveFixturesFromApi {
    liveFixturesFromApi {
      id
      date
      timestamp
      status
      statusShort
      elapsed
      round
      homeTeam {
        id
        name
        logo
      }
      awayTeam {
        id
        name
        logo
      }
      goalsHome
      goalsAway
      league {
        id
        name
        logo
        country
      }
    }
  }
`;

export const GET_UPCOMING_FIXTURES = gql`
  query GetUpcomingFixtures($hours: Int, $leagueIds: [Int!]) {
    upcomingFixtures(hours: $hours, leagueIds: $leagueIds) {
      ...FixtureFields
    }
  }
  ${FIXTURE_FRAGMENT}
`;

export const GET_FIXTURE = gql`
  query GetFixture($id: Int!) {
    fixture(id: $id) {
      ...FixtureWithStatsFields
    }
  }
  ${FIXTURE_WITH_STATS_FRAGMENT}
`;

export const GET_HEAD_TO_HEAD = gql`
  query GetHeadToHead($team1Id: Int!, $team2Id: Int!, $limit: Int) {
    headToHead(team1Id: $team1Id, team2Id: $team2Id, limit: $limit) {
      ...FixtureFields
    }
  }
  ${FIXTURE_FRAGMENT}
`;

export const GET_STANDINGS = gql`
  query GetStandings($leagueId: Int, $seasonId: Int) {
    standings(leagueId: $leagueId, seasonId: $seasonId) {
      id
      rank
      points
      goalsDiff
      form
      status
      description
      played
      win
      draw
      lose
      goalsFor
      goalsAgainst
      homeWin
      homeDraw
      homeLose
      homeGoalsFor
      homeGoalsAgainst
      awayWin
      awayDraw
      awayLose
      awayGoalsFor
      awayGoalsAgainst
      team {
        ...TeamFields
      }
    }
  }
  ${TEAM_FRAGMENT}
`;

// Real-time standings from API for 2024-2025 season
export const GET_LIVE_STANDINGS = gql`
  query GetLiveStandings($leagueId: Int!, $season: Int) {
    liveStandings(leagueId: $leagueId, season: $season) {
      rank
      team {
        id
        name
        logo
      }
      points
      goalsDiff
      form
      status
      description
      played
      win
      draw
      lose
      goalsFor
      goalsAgainst
      homeWin
      homeDraw
      homeLose
      homeGoalsFor
      homeGoalsAgainst
      awayWin
      awayDraw
      awayLose
      awayGoalsFor
      awayGoalsAgainst
    }
  }
`;

export const GET_TEAM = gql`
  query GetTeam($id: Int!) {
    team(id: $id) {
      id
      name
      code
      logo
      venue
      venueCapacity
      country {
        id
        name
        code
        flag
      }
    }
  }
`;

export const GET_TEAM_FIXTURES = gql`
  query GetTeamFixtures($teamId: Int!, $limit: Int) {
    fixtures(filter: { teamIds: [$teamId], finished: true }, limit: $limit) {
      ...FixtureFields
    }
  }
  ${FIXTURE_FRAGMENT}
`;

// Mutations
export const ADD_MATCH_NOTE = gql`
  mutation AddMatchNote($input: MatchNoteInput!) {
    addMatchNote(input: $input) {
      id
      content
      tags
      createdAt
    }
  }
`;

export const UPDATE_MATCH_NOTE = gql`
  mutation UpdateMatchNote($id: Int!, $input: MatchNoteInput!) {
    updateMatchNote(id: $id, input: $input) {
      id
      content
      tags
      updatedAt
    }
  }
`;

export const DELETE_MATCH_NOTE = gql`
  mutation DeleteMatchNote($id: Int!) {
    deleteMatchNote(id: $id)
  }
`;

export const TOGGLE_FAVORITE_LEAGUE = gql`
  mutation ToggleFavoriteLeague($leagueId: Int!) {
    toggleFavoriteLeague(leagueId: $leagueId) {
      id
      favoriteLeagues {
        id
        league {
          id
          name
        }
      }
    }
  }
`;

export const TOGGLE_FAVORITE_TEAM = gql`
  mutation ToggleFavoriteTeam($teamId: Int!) {
    toggleFavoriteTeam(teamId: $teamId) {
      id
      favoriteTeams {
        id
        team {
          id
          name
        }
      }
    }
  }
`;

// Odds queries
export const GET_FIXTURE_ODDS = gql`
  query GetFixtureOdds($fixtureId: Int!) {
    fixtureOdds(fixtureId: $fixtureId) {
      eventId
      homeTeam
      awayTeam
      commenceTime
      bookmakers {
        key
        name
        lastUpdate
        h2h {
          home
          draw
          away
        }
        totals {
          over
          under
          point
        }
      }
      consensus {
        home
        draw
        away
        over
        under
        point
      }
      impliedProbabilities {
        home
        draw
        away
        overround
      }
    }
  }
`;

export const GET_LIVE_ODDS = gql`
  query GetLiveOdds($leagueId: Int!) {
    liveOdds(leagueId: $leagueId) {
      eventId
      homeTeam
      awayTeam
      commenceTime
      consensus {
        home
        draw
        away
        over
        under
        point
      }
      impliedProbabilities {
        home
        draw
        away
        overround
      }
    }
  }
`;

export const GET_ODDS_HISTORY = gql`
  query GetOddsHistory($fixtureId: Int!, $market: String) {
    oddsHistory(fixtureId: $fixtureId, market: $market) {
      id
      bookmaker
      market
      homeOdds
      drawOdds
      awayOdds
      overOdds
      underOdds
      line
      isOpening
      isClosing
      capturedAt
    }
  }
`;

// Sync mutations
export const SYNC_LEAGUES = gql`
  mutation SyncLeagues {
    syncLeagues {
      success
      message
      count
    }
  }
`;

export const SYNC_FIXTURES = gql`
  mutation SyncFixtures($leagueId: Int!, $season: Int!) {
    syncFixtures(leagueId: $leagueId, season: $season) {
      success
      message
      count
    }
  }
`;

export const SYNC_TEAMS = gql`
  mutation SyncTeams($leagueId: Int!, $season: Int!) {
    syncTeams(leagueId: $leagueId, season: $season) {
      success
      message
      count
    }
  }
`;

export const SYNC_STANDINGS = gql`
  mutation SyncStandings($leagueId: Int!, $season: Int!) {
    syncStandings(leagueId: $leagueId, season: $season) {
      success
      message
      count
    }
  }
`;

export const SYNC_ODDS = gql`
  mutation SyncOdds($leagueId: Int!, $markAsOpening: Boolean) {
    syncOdds(leagueId: $leagueId, markAsOpening: $markAsOpening) {
      success
      message
      snapshotsCreated
      eventsMatched
    }
  }
`;

// Top leagues query
export const GET_TOP_LEAGUES = gql`
  query GetTopLeagues {
    topLeagues {
      id
      name
      type
      logo
      country {
        id
        name
        code
        flag
      }
    }
  }
`;

// Fixture lineups query
export const GET_FIXTURE_LINEUPS = gql`
  query GetFixtureLineups($fixtureId: Int!) {
    fixtureLineups(fixtureId: $fixtureId) {
      teamId
      teamName
      teamLogo
      formation
      startXI {
        id
        name
        number
        pos
      }
      substitutes {
        id
        name
        number
        pos
      }
      coach {
        id
        name
        photo
      }
    }
  }
`;

// Fixture events query
export const GET_FIXTURE_EVENTS = gql`
  query GetFixtureEvents($fixtureId: Int!) {
    fixtureEvents(fixtureId: $fixtureId) {
      time
      extraTime
      teamId
      teamName
      playerName
      assistName
      type
      detail
      comments
    }
  }
`;

// Fixture statistics query
export const GET_FIXTURE_STATS = gql`
  query GetFixtureStats($fixtureId: Int!) {
    fixtureStats(fixtureId: $fixtureId)
  }
`;

// Head to head query from API
export const GET_H2H_FROM_API = gql`
  query GetH2HFromApi($team1Id: Int!, $team2Id: Int!, $limit: Int) {
    h2hFromApi(team1Id: $team1Id, team2Id: $team2Id, limit: $limit) {
      summary {
        totalMatches
        team1Wins
        team2Wins
        draws
        team1Goals
        team2Goals
      }
      matches {
        fixtureId
        date
        venue
        homeTeamId
        homeTeamName
        homeTeamLogo
        awayTeamId
        awayTeamName
        awayTeamLogo
        homeGoals
        awayGoals
        homeWinner
        leagueName
        leagueLogo
      }
    }
  }
`;

// Fixture player statistics
export const GET_FIXTURE_PLAYER_STATS = gql`
  query GetFixturePlayerStats($fixtureId: Int!) {
    fixturePlayerStats(fixtureId: $fixtureId) {
      teamId
      teamName
      teamLogo
      players {
        playerId
        playerName
        playerPhoto
        position
        rating
        minutes
        goals
        assists
        shots
        shotsOnTarget
        passes
        keyPasses
        passAccuracy
        tackles
        interceptions
        yellowCards
        redCards
      }
    }
  }
`;

// ============================================
// V2 Features - Alerts, Screens, Selections
// ============================================

// Alerts
export const GET_ALERTS = gql`
  query GetAlerts($type: String, $isActive: Boolean) {
    alerts(type: $type, isActive: $isActive) {
      id
      userId
      type
      config
      isActive
      lastTriggered
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ALERT = gql`
  mutation CreateAlert($type: String!, $config: AlertConfigInput!) {
    createAlert(type: $type, config: $config) {
      id
      type
      config
      isActive
    }
  }
`;

export const UPDATE_ALERT = gql`
  mutation UpdateAlert(
    $id: Int!
    $type: String
    $config: AlertConfigInput
    $isActive: Boolean
  ) {
    updateAlert(id: $id, type: $type, config: $config, isActive: $isActive) {
      id
      type
      config
      isActive
    }
  }
`;

export const DELETE_ALERT = gql`
  mutation DeleteAlert($id: Int!) {
    deleteAlert(id: $id)
  }
`;

export const TOGGLE_ALERT = gql`
  mutation ToggleAlert($id: Int!) {
    toggleAlert(id: $id) {
      id
      isActive
    }
  }
`;

// Saved Screens
export const GET_SAVED_SCREENS = gql`
  query GetSavedScreens {
    savedScreens {
      id
      userId
      name
      filters
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SAVED_SCREEN = gql`
  mutation CreateSavedScreen($name: String!, $filters: ScreenFiltersInput!) {
    createSavedScreen(name: $name, filters: $filters) {
      id
      name
      filters
    }
  }
`;

export const UPDATE_SAVED_SCREEN = gql`
  mutation UpdateSavedScreen(
    $id: Int!
    $name: String
    $filters: ScreenFiltersInput
  ) {
    updateSavedScreen(id: $id, name: $name, filters: $filters) {
      id
      name
      filters
    }
  }
`;

export const DELETE_SAVED_SCREEN = gql`
  mutation DeleteSavedScreen($id: Int!) {
    deleteSavedScreen(id: $id)
  }
`;

// User Selections (Betting Tracker)
export const GET_SELECTIONS = gql`
  query GetSelections($result: String, $market: String, $limit: Int) {
    selections(result: $result, market: $market, limit: $limit) {
      id
      fixtureId
      market
      selection
      odds
      openingOdds
      closingOdds
      stake
      result
      profit
      createdAt
      fixture {
        id
        date
        homeTeam {
          id
          name
          logo
        }
        awayTeam {
          id
          name
          logo
        }
        goalsHome
        goalsAway
        statusShort
      }
    }
  }
`;

export const GET_FIXTURE_SELECTIONS = gql`
  query GetFixtureSelections($fixtureId: Int!) {
    fixtureSelections(fixtureId: $fixtureId) {
      id
      market
      selection
      odds
      stake
      result
      profit
      createdAt
    }
  }
`;

export const GET_SELECTION_STATS = gql`
  query GetSelectionStats(
    $dateFrom: DateTime
    $dateTo: DateTime
    $market: String
  ) {
    selectionStats(dateFrom: $dateFrom, dateTo: $dateTo, market: $market) {
      totalSelections
      wins
      losses
      pending
      winRate
      totalStaked
      totalProfit
      roi
    }
  }
`;

export const CREATE_SELECTION = gql`
  mutation CreateSelection(
    $fixtureId: Int!
    $market: String!
    $selection: String!
    $odds: Float!
    $stake: Float
    $openingOdds: Float
  ) {
    createSelection(
      fixtureId: $fixtureId
      market: $market
      selection: $selection
      odds: $odds
      stake: $stake
      openingOdds: $openingOdds
    ) {
      id
      market
      selection
      odds
      stake
      result
    }
  }
`;

export const UPDATE_SELECTION = gql`
  mutation UpdateSelection(
    $id: Int!
    $result: String
    $closingOdds: Float
    $stake: Float
  ) {
    updateSelection(
      id: $id
      result: $result
      closingOdds: $closingOdds
      stake: $stake
    ) {
      id
      result
      closingOdds
      stake
      profit
    }
  }
`;

export const DELETE_SELECTION = gql`
  mutation DeleteSelection($id: Int!) {
    deleteSelection(id: $id)
  }
`;
