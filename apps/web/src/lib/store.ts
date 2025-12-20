import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface League {
  id: number
  name: string
  logo?: string | null
  countryId: number
}

interface Team {
  id: number
  name: string
  logo?: string | null
}

interface AppState {
  // Selection state
  selectedLeagueId: number | null
  selectedSeasonId: number | null
  selectedFixtureId: number | null
  
  // Favorites
  favoriteLeagueIds: number[]
  favoriteTeamIds: number[]
  
  // Filters
  activeTab: 'fixtures' | 'results' | 'live' | 'odds' | 'insights' | 'standings'
  dateFilter: 'today' | 'tomorrow' | 'week' | 'custom'
  customDateRange: { from: Date | null; to: Date | null }
  
  // UI state
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  showCommandPalette: boolean
  showMatchCenter: boolean
  showResponsibleGamblingModal: boolean
  showV2Panel: 'alerts' | 'screens' | 'tracker' | null
  
  // Notes
  matchNotes: Record<number, { content: string; tags: string[] }>
  
  // User preferences
  showOdds: boolean
  showXg: boolean
  defaultOddsFormat: 'decimal' | 'fractional' | 'american'
  
  // Responsible gambling
  sessionStartTime: number | null
  sessionDurationWarningMinutes: number
  hasSeenDisclaimer: boolean
  totalSessionTime: number // in minutes
  
  // Actions
  setSelectedLeague: (leagueId: number | null, seasonId?: number | null) => void
  setSelectedFixture: (fixtureId: number | null) => void
  toggleFavoriteLeague: (leagueId: number) => void
  toggleFavoriteTeam: (teamId: number) => void
  setActiveTab: (tab: AppState['activeTab']) => void
  setDateFilter: (filter: AppState['dateFilter']) => void
  setCustomDateRange: (range: { from: Date | null; to: Date | null }) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setMatchNote: (fixtureId: number, content: string, tags: string[]) => void
  setShowOdds: (show: boolean) => void
  setShowXg: (show: boolean) => void
  startSession: () => void
  acknowledgeDisclaimer: () => void
  setShowCommandPalette: (show: boolean) => void
  setShowMatchCenter: (show: boolean) => void
  setShowResponsibleGamblingModal: (show: boolean) => void
  setShowV2Panel: (panel: 'alerts' | 'screens' | 'tracker' | null) => void
  updateSessionTime: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedLeagueId: null,
      selectedSeasonId: null,
      selectedFixtureId: null,
      favoriteLeagueIds: [],
      favoriteTeamIds: [],
      activeTab: 'fixtures',
      dateFilter: 'today',
      customDateRange: { from: null, to: null },
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      showCommandPalette: false,
      showMatchCenter: true,
      showResponsibleGamblingModal: false,
      showV2Panel: null,
      matchNotes: {},
      showOdds: true,
      showXg: true,
      defaultOddsFormat: 'decimal',
      sessionStartTime: null,
      sessionDurationWarningMinutes: 60,
      hasSeenDisclaimer: false,
      totalSessionTime: 0,
      
      // Actions
      setSelectedLeague: (leagueId, seasonId) => set({ 
        selectedLeagueId: leagueId,
        selectedSeasonId: seasonId ?? null,
        selectedFixtureId: null,
      }),
      
      setSelectedFixture: (fixtureId) => set({ 
        selectedFixtureId: fixtureId,
        showMatchCenter: fixtureId !== null, // Show match center when fixture is selected
        rightPanelCollapsed: false, // Ensure panel is not collapsed
      }),
      
      toggleFavoriteLeague: (leagueId) => set((state) => ({
        favoriteLeagueIds: state.favoriteLeagueIds.includes(leagueId)
          ? state.favoriteLeagueIds.filter(id => id !== leagueId)
          : [...state.favoriteLeagueIds, leagueId],
      })),
      
      toggleFavoriteTeam: (teamId) => set((state) => ({
        favoriteTeamIds: state.favoriteTeamIds.includes(teamId)
          ? state.favoriteTeamIds.filter(id => id !== teamId)
          : [...state.favoriteTeamIds, teamId],
      })),
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      setDateFilter: (filter) => set({ dateFilter: filter }),
      setCustomDateRange: (range) => set({ customDateRange: range }),
      toggleLeftPanel: () => set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed })),
      toggleRightPanel: () => set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),
      
      setMatchNote: (fixtureId, content, tags) => set((state) => ({
        matchNotes: {
          ...state.matchNotes,
          [fixtureId]: { content, tags },
        },
      })),
      
      setShowOdds: (show) => set({ showOdds: show }),
      setShowXg: (show) => set({ showXg: show }),
      
      startSession: () => set({ sessionStartTime: Date.now() }),
      acknowledgeDisclaimer: () => set({ hasSeenDisclaimer: true }),
      setShowCommandPalette: (show) => set({ showCommandPalette: show }),
      setShowMatchCenter: (show) => set({ showMatchCenter: show }),
      setShowResponsibleGamblingModal: (show) => set({ showResponsibleGamblingModal: show }),
      setShowV2Panel: (panel) => set({ showV2Panel: panel }),
      updateSessionTime: () => {
        const state = get()
        if (state.sessionStartTime) {
          const elapsed = Math.floor((Date.now() - state.sessionStartTime) / 60000)
          set({ totalSessionTime: elapsed })
        }
      },
    }),
    {
      name: 'football-insights-storage',
      partialize: (state) => ({
        favoriteLeagueIds: state.favoriteLeagueIds,
        favoriteTeamIds: state.favoriteTeamIds,
        matchNotes: state.matchNotes,
        showOdds: state.showOdds,
        showXg: state.showXg,
        defaultOddsFormat: state.defaultOddsFormat,
        hasSeenDisclaimer: state.hasSeenDisclaimer,
        sessionDurationWarningMinutes: state.sessionDurationWarningMinutes,
      }),
    }
  )
)

// Top leagues configuration
export const TOP_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga', country: 'Spain', flag: '🇪🇸' },
  { id: 135, name: 'Serie A', country: 'Italy', flag: '🇮🇹' },
  { id: 78, name: 'Bundesliga', country: 'Germany', flag: '🇩🇪' },
  { id: 61, name: 'Ligue 1', country: 'France', flag: '🇫🇷' },
  { id: 40, name: 'Championship', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 88, name: 'Eredivisie', country: 'Netherlands', flag: '🇳🇱' },
  { id: 94, name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹' },
]

