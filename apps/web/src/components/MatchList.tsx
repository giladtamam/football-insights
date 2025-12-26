import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@apollo/client'
import {
  Calendar,
  Radio,
  History,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Zap,
  Users,
  Trophy,
  Clock,
} from 'lucide-react'
import { GET_LIVE_FIXTURES_FROM_API, GET_FIXTURES } from '../graphql/queries'
import { useAppStore, TOP_LEAGUES } from '../lib/store'
import { cn, formatTime, formatDate, isLiveStatus, getStatusText } from '../lib/utils'
import { StandingsTable } from './StandingsTable'

interface Fixture {
  id: number
  date: string
  timestamp: number
  status: string
  statusShort: string
  elapsed: number | null
  round: string | null
  goalsHome: number | null
  goalsAway: number | null
  xgHome: number | null
  xgAway: number | null
  isLive: boolean
  isFinished: boolean
  isUpcoming: boolean
  homeTeam: {
    id: number
    name: string
    logo: string | null
  }
  awayTeam: {
    id: number
    name: string
    logo: string | null
  }
  season: {
    id: number
    league: {
      id: number
      name: string
      logo: string | null
      country: {
        name: string
        flag: string | null
      }
    }
  }
}

type Tab = 'fixtures' | 'results' | 'live' | 'odds' | 'insights' | 'standings'

// Helper to get start and end of a day in UTC
function getDayBoundsUTC(date: Date) {
  const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0))
  const end = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999))
  return { start, end }
}

export function MatchList() {
  const {
    activeTab,
    setActiveTab,
    selectedLeagueId,
    selectedFixtureId,
    setSelectedFixture,
    favoriteLeagueIds,
    showXg,
  } = useAppStore()

  // Selected date for fixtures tab - always show today's date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { start: dateFrom, end: dateTo } = getDayBoundsUTC(selectedDate)

  // Convert to Unix timestamps (seconds) for filtering
  const timestampFrom = Math.floor(dateFrom.getTime() / 1000)
  const timestampTo = Math.floor(dateTo.getTime() / 1000)

  // Fetch fixtures based on active tab and selected date
  const { data: fixturesData, loading: fixturesLoading } = useQuery(GET_FIXTURES, {
    variables: {
      filter: {
        timestampFrom,
        timestampTo,
        leagueIds: selectedLeagueId ? [selectedLeagueId] : undefined,
      },
      limit: 100,
    },
    skip: activeTab !== 'fixtures',
  })

  // Use real-time API for live fixtures
  const { data: liveApiData, loading: liveApiLoading } = useQuery(GET_LIVE_FIXTURES_FROM_API, {
    skip: activeTab !== 'live',
    pollInterval: 30000, // Refresh every 30 seconds for live updates
    fetchPolicy: 'network-only', // Always fetch fresh data
  })

  // Get timestamp for "now" to filter only past results
  const nowTimestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  
  const { data: resultsData, loading: resultsLoading } = useQuery(GET_FIXTURES, {
    variables: {
      filter: {
        finished: true,
        leagueIds: selectedLeagueId ? [selectedLeagueId] : undefined,
        timestampTo: nowTimestamp, // Only show results before now
      },
      limit: 50,
      orderDesc: true, // Show newest results first
    },
    skip: activeTab !== 'results',
  })

  const loading = fixturesLoading || liveApiLoading || resultsLoading

  // Transform live API data to match our Fixture interface
  const liveFixtures: Fixture[] = useMemo(() => {
    const apiFixtures = liveApiData?.liveFixturesFromApi || []
    return apiFixtures.map((f: any) => ({
      id: f.id,
      date: f.date,
      timestamp: f.timestamp,
      status: f.status,
      statusShort: f.statusShort,
      elapsed: f.elapsed,
      round: f.round,
      goalsHome: f.goalsHome,
      goalsAway: f.goalsAway,
      xgHome: null, // API doesn't provide xG for live
      xgAway: null,
      isLive: true,
      isFinished: false,
      isUpcoming: false,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      season: {
        id: 0,
        league: {
          id: f.league.id,
          name: f.league.name,
          logo: f.league.logo,
          country: {
            name: f.league.country,
            flag: null,
          },
        },
      },
    }))
  }, [liveApiData])

  const fixtures: Fixture[] = useMemo(() => {
    switch (activeTab) {
      case 'fixtures':
        return fixturesData?.fixtures || []
      case 'live':
        return liveFixtures
      case 'results':
        return resultsData?.fixtures || []
      default:
        return fixturesData?.fixtures || []
    }
  }, [activeTab, fixturesData, liveFixtures, resultsData])

  // Group fixtures by league
  const groupedFixtures = useMemo(() => {
    const groups = new Map<number, { league: Fixture['season']['league']; fixtures: Fixture[] }>()

    fixtures.forEach(fixture => {
      const leagueId = fixture.season.league.id
      if (!groups.has(leagueId)) {
        groups.set(leagueId, {
          league: fixture.season.league,
          fixtures: [],
        })
      }
      groups.get(leagueId)!.fixtures.push(fixture)
    })

    // Sort by league priority (favorites first, then top leagues)
    return Array.from(groups.values()).sort((a, b) => {
      const aFav = favoriteLeagueIds.includes(a.league.id) ? 0 : 1
      const bFav = favoriteLeagueIds.includes(b.league.id) ? 0 : 1
      if (aFav !== bFav) return aFav - bFav

      const aTop = TOP_LEAGUES.findIndex(l => l.id === a.league.id)
      const bTop = TOP_LEAGUES.findIndex(l => l.id === b.league.id)
      if (aTop >= 0 && bTop >= 0) return aTop - bTop
      if (aTop >= 0) return -1
      if (bTop >= 0) return 1

      return a.league.name.localeCompare(b.league.name)
    })
  }, [fixtures, favoriteLeagueIds])

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'fixtures', label: 'Fixtures', icon: Calendar },
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'results', label: 'Results', icon: History },
    { id: 'standings', label: 'Table', icon: Trophy },
    { id: 'odds', label: 'Odds', icon: TrendingUp },
    { id: 'insights', label: 'Insights', icon: Sparkles },
  ]

  // Date navigation helpers
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with tabs */}
      <div className="border-b border-terminal-border">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-sm font-semibold font-display">
            {selectedLeagueId
              ? TOP_LEAGUES.find(l => l.id === selectedLeagueId)?.name || 'League Matches'
              : isToday(selectedDate) ? "Today's Matches" : 'Matches'
            }
          </h2>
          
          {/* Date Navigation - only show for fixtures tab */}
          {activeTab === 'fixtures' && (
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousDay}
                className="p-1.5 rounded hover:bg-terminal-elevated transition-colors text-text-muted hover:text-text-primary"
                title="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={goToToday}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors",
                  isToday(selectedDate)
                    ? "bg-accent-primary/20 text-accent-primary"
                    : "hover:bg-terminal-elevated text-text-secondary hover:text-text-primary"
                )}
              >
                {formatDate(selectedDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </button>
              
              <button
                onClick={goToNextDay}
                className="p-1.5 rounded hover:bg-terminal-elevated transition-colors text-text-muted hover:text-text-primary"
                title="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {activeTab !== 'fixtures' && (
            <span className="text-xs text-text-muted">
              {formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        <div className="flex gap-1 px-2 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "tab flex items-center gap-1.5",
                activeTab === tab.id && "active"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'live' && liveFixtures.length > 0 && (
                <span className="badge-live text-[10px] px-1.5">
                  {liveFixtures.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Match List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'standings' ? (
          // Standings View
          selectedLeagueId ? (
            <StandingsTable leagueId={selectedLeagueId} />
          ) : (
            <div className="p-8 text-center">
              <Trophy className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">Select a League</h3>
              <p className="text-sm text-text-muted">
                Choose a league from the sidebar to view standings
              </p>
            </div>
          )
        ) : loading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-6 w-32 bg-terminal-elevated/50 rounded animate-pulse" />
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-16 bg-terminal-elevated/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : fixtures.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No matches found</h3>
            <p className="text-sm text-text-muted">
              {activeTab === 'live'
                ? 'No live matches at the moment'
                : 'Try selecting a different league or date'}
            </p>
          </div>
        ) : (
          <div className="animate-stagger">
            {groupedFixtures.map(({ league, fixtures: leagueFixtures }) => (
              <LeagueGroup
                key={league.id}
                league={league}
                fixtures={leagueFixtures}
                selectedFixtureId={selectedFixtureId}
                onSelectFixture={(id, fixture) => {
                  // For live fixtures from API, pass the full fixture data
                  if (fixture.isLive) {
                    setSelectedFixture(id, {
                      id: fixture.id,
                      date: fixture.date,
                      timestamp: fixture.timestamp,
                      status: fixture.status,
                      statusShort: fixture.statusShort,
                      elapsed: fixture.elapsed,
                      round: fixture.round,
                      goalsHome: fixture.goalsHome,
                      goalsAway: fixture.goalsAway,
                      homeTeam: fixture.homeTeam,
                      awayTeam: fixture.awayTeam,
                      league: {
                        id: fixture.season.league.id,
                        name: fixture.season.league.name,
                        logo: fixture.season.league.logo,
                        country: fixture.season.league.country?.name || 'Unknown',
                      },
                    })
                  } else {
                    setSelectedFixture(id)
                  }
                }}
                showXg={showXg}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface LeagueGroupProps {
  league: Fixture['season']['league']
  fixtures: Fixture[]
  selectedFixtureId: number | null
  onSelectFixture: (id: number, fixture: Fixture) => void
  showXg: boolean
}

function LeagueGroup({ league, fixtures, selectedFixtureId, onSelectFixture, showXg }: LeagueGroupProps) {
  return (
    <div className="border-b border-terminal-border last:border-b-0">
      {/* League header */}
      <div className="sticky top-0 z-10 glass-elevated px-3 py-2 flex items-center gap-2">
        {league.logo ? (
          <img src={league.logo} alt="" className="w-5 h-5 object-contain" />
        ) : (
          <span className="text-base">{league.country.flag}</span>
        )}
        <span className="text-xs font-medium text-text-primary">{league.name}</span>
        <span className="text-[10px] text-text-muted">• {league.country.name}</span>
        <span className="ml-auto text-[10px] text-text-muted">{fixtures.length} matches</span>
      </div>

      {/* Fixtures */}
      <div className="p-2 space-y-1">
        {fixtures.map(fixture => (
          <MatchCard
            key={fixture.id}
            fixture={fixture}
            isSelected={selectedFixtureId === fixture.id}
            onSelect={() => onSelectFixture(fixture.id, fixture)}
            showXg={showXg}
          />
        ))}
      </div>
    </div>
  )
}

interface MatchCardProps {
  fixture: Fixture
  isSelected: boolean
  onSelect: () => void
  showXg: boolean
}

function MatchCard({ fixture, isSelected, onSelect, showXg }: MatchCardProps) {
  const isLive = isLiveStatus(fixture.statusShort)
  const hasXg = fixture.xgHome !== null && fixture.xgAway !== null

  // Calculate signal chips based on real and mock data
  const signals: { type: 'edge' | 'move' | 'abs' | 'hot'; label: string }[] = []

  // xG edge signal
  if (hasXg && fixture.xgHome !== null && fixture.xgAway !== null) {
    const xgDiff = Math.abs(fixture.xgHome - fixture.xgAway)
    if (xgDiff > 1.5) {
      signals.push({ type: 'edge', label: 'xG Edge' })
    }
  }

  // Hot match signal (high-profile fixture or derby)
  const topTeams = ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham']
  const isTopMatch = topTeams.includes(fixture.homeTeam.name) && topTeams.includes(fixture.awayTeam.name)
  if (isTopMatch) {
    signals.push({ type: 'hot', label: 'Big Match' })
  }


  // Check if match is starting soon (within 2 hours)
  const kickoffTime = new Date(fixture.date).getTime()
  const now = Date.now()
  const timeUntilKickoff = kickoffTime - now
  const isStartingSoon = fixture.isUpcoming && timeUntilKickoff > 0 && timeUntilKickoff < 2 * 60 * 60 * 1000

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full p-3 rounded-lg transition-all text-left group",
        isSelected
          ? "glass-elevated glow-border"
          : "hover:bg-terminal-elevated/50",
        isLive && "border-l-2 border-l-accent-danger",
        isStartingSoon && !isLive && "border-l-2 border-l-accent-warning"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Time / Status */}
        <div className="w-14 text-center flex-shrink-0">
          {isLive ? (
            <span className="badge-live">
              {getStatusText(fixture.statusShort, fixture.elapsed)}
            </span>
          ) : fixture.isFinished ? (
            <span className="text-xs text-text-muted font-medium">FT</span>
          ) : isStartingSoon ? (
            <CountdownTimer targetTime={kickoffTime} />
          ) : (
            <span className="text-xs text-text-secondary font-medium">
              {formatTime(fixture.date)}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <TeamRow
            team={fixture.homeTeam}
            goals={fixture.goalsHome}
            xg={showXg ? fixture.xgHome : null}
            isWinner={fixture.isFinished && fixture.goalsHome !== null && fixture.goalsAway !== null && fixture.goalsHome > fixture.goalsAway}
          />
          <TeamRow
            team={fixture.awayTeam}
            goals={fixture.goalsAway}
            xg={showXg ? fixture.xgAway : null}
            isWinner={fixture.isFinished && fixture.goalsHome !== null && fixture.goalsAway !== null && fixture.goalsAway > fixture.goalsHome}
          />
        </div>

        {/* Signal chips */}
        {signals.length > 0 && (
          <div className="flex flex-col gap-1">
            {signals.map((signal, i) => (
              <span
                key={i}
                className={cn(
                  "chip text-[9px]",
                  signal.type === 'edge' && "chip-success",
                  signal.type === 'move' && "chip-warning",
                  signal.type === 'abs' && "chip-danger",
                  signal.type === 'hot' && "chip-info"
                )}
              >
                {signal.type === 'edge' && <Zap className="w-2.5 h-2.5" />}
                {signal.type === 'move' && <TrendingUp className="w-2.5 h-2.5" />}
                {signal.type === 'abs' && <AlertTriangle className="w-2.5 h-2.5" />}
                {signal.type === 'hot' && <Sparkles className="w-2.5 h-2.5" />}
                {signal.label}
              </span>
            ))}
          </div>
        )}

        {/* Arrow indicator */}
        <ChevronDown className={cn(
          "w-4 h-4 text-text-muted transition-transform",
          isSelected ? "-rotate-90" : "opacity-0 group-hover:opacity-100"
        )} />
      </div>
    </motion.button>
  )
}

interface TeamRowProps {
  team: { id: number; name: string; logo: string | null }
  goals: number | null
  xg: number | null
  isWinner: boolean
}

function TeamRow({ team, goals, xg, isWinner }: TeamRowProps) {
  return (
    <div className="flex items-center gap-2">
      {team.logo ? (
        <img src={team.logo} alt="" className="w-4 h-4 object-contain" />
      ) : (
        <Users className="w-4 h-4 text-text-muted" />
      )}
      <span className={cn(
        "text-sm flex-1 truncate",
        isWinner ? "font-semibold text-text-primary" : "text-text-secondary"
      )}>
        {team.name}
      </span>
      {goals !== null && (
        <span className={cn(
          "w-6 text-center text-sm font-bold",
          isWinner ? "text-text-primary" : "text-text-secondary"
        )}>
          {goals}
        </span>
      )}
      {xg !== null && (
        <span className="w-10 text-right text-[10px] text-text-muted">
          {xg.toFixed(2)} xG
        </span>
      )}
    </div>
  )
}

// Countdown timer for upcoming matches
function CountdownTimer({ targetTime }: { targetTime: number }) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = targetTime - Date.now()
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [targetTime])

  if (timeLeft <= 0) {
    return <span className="text-xs text-accent-success font-medium">Starting</span>
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  if (hours > 0) {
    return (
      <div className="text-center">
        <div className="text-xs text-accent-warning font-mono font-bold">
          {hours}h {minutes}m
        </div>
        <div className="text-[9px] text-text-muted flex items-center justify-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          until KO
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="text-xs text-accent-warning font-mono font-bold animate-pulse">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="text-[9px] text-text-muted flex items-center justify-center gap-0.5">
        <Clock className="w-2.5 h-2.5" />
        until KO
      </div>
    </div>
  )
}

