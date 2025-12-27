import { gql } from '@apollo/client'

export const SYNC_ALL = gql`
  mutation SyncAll($leagueIds: [Int!]) {
    syncAll(leagueIds: $leagueIds) {
      success
      message
      count
    }
  }
`

export const GET_SYNC_STATUS = gql`
  query GetSyncStatus {
    syncStatus {
      lastFixtureUpdate
      totalFixtures
      totalTeams
      totalLeagues
      fixturesLast24h
    }
  }
`

