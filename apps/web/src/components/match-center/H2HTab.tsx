import { useQuery } from '@apollo/client'
import { 
  History,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Calendar,
} from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'
import { GET_H2H_FROM_API, GET_HEAD_TO_HEAD } from '../../graphql/queries'

interface H2HTabProps {
  fixture: any
}

export function H2HTab({ fixture }: H2HTabProps) {
  // Try API first, fallback to database
  const { data: apiData, loading: apiLoading, error: apiError, refetch: refetchApi } = useQuery(GET_H2H_FROM_API, {
    variables: {
      team1Id: fixture.homeTeam.id,
      team2Id: fixture.awayTeam.id,
      limit: 15,
    },
    fetchPolicy: 'cache-and-network',
  })

  // Fallback to database H2H
  const { data: dbData, loading: dbLoading } = useQuery(GET_HEAD_TO_HEAD, {
    variables: {
      team1Id: fixture.homeTeam.id,
      team2Id: fixture.awayTeam.id,
      limit: 10,
    },
    skip: !apiError, // Only fetch if API fails
  })

  const loading = apiLoading && dbLoading
  const h2hResult = apiData?.h2hFromApi
  const dbMatches = dbData?.headToHead || []

  // Use API data if available, otherwise use database
  const hasApiData = h2hResult && h2hResult.matches.length > 0
  const hasDbData = dbMatches.length > 0

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
        <span className="ml-2 text-text-secondary">Loading head-to-head data...</span>
      </div>
    )
  }

  if (!hasApiData && !hasDbData) {
    return (
      <div className="p-8 text-center">
        <History className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-1">No Head-to-Head Data</h3>
        <p className="text-sm text-text-secondary mb-4">
          No previous matches found between {fixture.homeTeam.name} and {fixture.awayTeam.name}
        </p>
        <button 
          onClick={() => refetchApi()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-terminal-elevated hover:bg-terminal-muted rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    )
  }

  // Calculate stats for API data
  if (hasApiData) {
    return (
      <ApiH2HDisplay 
        fixture={fixture} 
        h2hResult={h2hResult} 
        loading={apiLoading}
        onRefresh={() => refetchApi()}
      />
    )
  }

  // Fallback to DB data display
  return (
    <DbH2HDisplay 
      fixture={fixture} 
      matches={dbMatches} 
    />
  )
}

function ApiH2HDisplay({ fixture, h2hResult, loading, onRefresh }: { 
  fixture: any
  h2hResult: any
  loading: boolean
  onRefresh: () => void
}) {
  const { summary, matches } = h2hResult
  
  // Calculate per-match averages
  const avgGoalsTeam1 = summary.totalMatches > 0 
    ? (summary.team1Goals / summary.totalMatches).toFixed(1)
    : '0'
  const avgGoalsTeam2 = summary.totalMatches > 0 
    ? (summary.team2Goals / summary.totalMatches).toFixed(1)
    : '0'
  
  // Form streak analysis
  const getStreak = () => {
    if (matches.length === 0) return { type: 'none', count: 0 }
    
    let currentType: 'home' | 'away' | 'draw' | null = null
    let count = 0
    
    for (const match of matches) {
      const team1Home = match.homeTeamId === fixture.homeTeam.id
      const team1Won = (team1Home && match.homeGoals > match.awayGoals) || (!team1Home && match.awayGoals > match.homeGoals)
      const team2Won = (team1Home && match.awayGoals > match.homeGoals) || (!team1Home && match.homeGoals > match.awayGoals)
      const isDraw = match.homeGoals === match.awayGoals
      
      const matchType = isDraw ? 'draw' : team1Won ? 'home' : 'away'
      
      if (currentType === null) {
        currentType = matchType
        count = 1
      } else if (matchType === currentType) {
        count++
      } else {
        break
      }
    }
    
    return { type: currentType, count }
  }
  
  const streak = getStreak()

  return (
    <div className="p-4 space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History className="w-4 h-4 text-accent-primary" />
          Historical Meetings ({summary.totalMatches})
        </h3>
        <button 
          onClick={onRefresh}
          className="p-1 text-text-muted hover:text-accent-primary transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="stat-card p-4">
        <div className="flex items-center justify-between mb-4">
          {/* Home team */}
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              {fixture.homeTeam.logo && (
                <img src={fixture.homeTeam.logo} alt="" className="w-8 h-8 object-contain" />
              )}
            </div>
            <div className="text-3xl font-bold text-accent-success">{summary.team1Wins}</div>
            <div className="text-xs text-text-muted">Wins</div>
          </div>
          
          {/* Draws */}
          <div className="text-center px-8">
            <div className="text-3xl font-bold text-text-muted">{summary.draws}</div>
            <div className="text-xs text-text-muted">Draws</div>
          </div>
          
          {/* Away team */}
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              {fixture.awayTeam.logo && (
                <img src={fixture.awayTeam.logo} alt="" className="w-8 h-8 object-contain" />
              )}
            </div>
            <div className="text-3xl font-bold text-accent-danger">{summary.team2Wins}</div>
            <div className="text-xs text-text-muted">Wins</div>
          </div>
        </div>
        
        {/* Visual bar */}
        <div className="h-2 rounded-full bg-terminal-elevated overflow-hidden flex">
          <div 
            className="bg-accent-success transition-all" 
            style={{ width: `${(summary.team1Wins / summary.totalMatches) * 100}%` }} 
          />
          <div 
            className="bg-terminal-muted transition-all" 
            style={{ width: `${(summary.draws / summary.totalMatches) * 100}%` }} 
          />
          <div 
            className="bg-accent-danger transition-all" 
            style={{ width: `${(summary.team2Wins / summary.totalMatches) * 100}%` }} 
          />
        </div>

        {/* Goals stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-terminal-border/50">
          <div className="text-center">
            <div className="text-xl font-semibold">{summary.team1Goals}</div>
            <div className="text-[10px] text-text-muted uppercase">Goals Scored</div>
            <div className="text-xs text-accent-primary mt-1">{avgGoalsTeam1} per game</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold">{summary.team1Goals + summary.team2Goals}</div>
            <div className="text-[10px] text-text-muted uppercase">Total Goals</div>
            <div className="text-xs text-text-secondary mt-1">
              {((summary.team1Goals + summary.team2Goals) / summary.totalMatches).toFixed(1)} per game
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold">{summary.team2Goals}</div>
            <div className="text-[10px] text-text-muted uppercase">Goals Scored</div>
            <div className="text-xs text-accent-purple mt-1">{avgGoalsTeam2} per game</div>
          </div>
        </div>
      </div>

      {/* Current Streak */}
      {streak.count > 1 && (
        <div className={cn(
          "stat-card p-3 flex items-center gap-3",
          streak.type === 'home' && "border-accent-success/30",
          streak.type === 'away' && "border-accent-danger/30",
        )}>
          {streak.type === 'home' ? (
            <TrendingUp className="w-5 h-5 text-accent-success" />
          ) : streak.type === 'away' ? (
            <TrendingDown className="w-5 h-5 text-accent-danger" />
          ) : (
            <Minus className="w-5 h-5 text-text-muted" />
          )}
          <div>
            <div className="text-sm font-medium">
              {streak.type === 'home' 
                ? `${fixture.homeTeam.name} on ${streak.count}-game winning streak`
                : streak.type === 'away'
                ? `${fixture.awayTeam.name} on ${streak.count}-game winning streak`
                : `${streak.count} consecutive draws`}
            </div>
            <div className="text-xs text-text-muted">Current form in H2H meetings</div>
          </div>
        </div>
      )}

      {/* Match List */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Recent Meetings
        </h4>
        <div className="space-y-2">
          {matches.slice(0, 10).map((match: any, i: number) => {
            const team1IsHome = match.homeTeamId === fixture.homeTeam.id
            const team1Goals = team1IsHome ? match.homeGoals : match.awayGoals
            const team2Goals = team1IsHome ? match.awayGoals : match.homeGoals
            const team1Won = team1Goals > team2Goals
            const team2Won = team2Goals > team1Goals
            
            return (
              <div
                key={i}
                className={cn(
                  "stat-card p-3 flex items-center gap-3 transition-all",
                  team1Won && "border-l-2 border-l-accent-success",
                  team2Won && "border-l-2 border-l-accent-danger",
                )}
              >
                <div className="text-xs text-text-muted w-24">
                  {formatDate(match.date, { day: 'numeric', month: 'short', year: '2-digit' })}
                </div>
                
                <div className="flex-1 flex items-center gap-2">
                  {/* Home team */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className={cn(
                      "text-sm",
                      match.homeGoals > match.awayGoals && "font-semibold"
                    )}>
                      {match.homeTeamName}
                    </span>
                    {match.homeTeamLogo && (
                      <img src={match.homeTeamLogo} alt="" className="w-5 h-5 object-contain" />
                    )}
                  </div>
                  
                  {/* Score */}
                  <div className={cn(
                    "px-3 py-1 rounded font-bold text-sm min-w-[50px] text-center",
                    match.homeGoals > match.awayGoals && "bg-accent-success/20",
                    match.awayGoals > match.homeGoals && "bg-accent-danger/20",
                    match.homeGoals === match.awayGoals && "bg-terminal-muted/50",
                  )}>
                    {match.homeGoals} - {match.awayGoals}
                  </div>
                  
                  {/* Away team */}
                  <div className="flex items-center gap-2 flex-1">
                    {match.awayTeamLogo && (
                      <img src={match.awayTeamLogo} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span className={cn(
                      "text-sm",
                      match.awayGoals > match.homeGoals && "font-semibold"
                    )}>
                      {match.awayTeamName}
                    </span>
                  </div>
                </div>

                {/* League badge */}
                <div className="flex items-center gap-1">
                  {match.leagueLogo && (
                    <img src={match.leagueLogo} alt="" className="w-4 h-4 object-contain" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Betting Insights */}
      <div className="stat-card p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-accent-warning" />
          H2H Betting Insights
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-text-muted text-xs mb-1">BTTS Rate</div>
            <div className="font-semibold">
              {((matches.filter((m: any) => m.homeGoals > 0 && m.awayGoals > 0).length / matches.length) * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">Over 2.5 Rate</div>
            <div className="font-semibold">
              {((matches.filter((m: any) => (m.homeGoals + m.awayGoals) > 2.5).length / matches.length) * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">Avg Goals</div>
            <div className="font-semibold">
              {((summary.team1Goals + summary.team2Goals) / summary.totalMatches).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-text-muted text-xs mb-1">Clean Sheets</div>
            <div className="font-semibold">
              {matches.filter((m: any) => m.homeGoals === 0 || m.awayGoals === 0).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DbH2HDisplay({ fixture, matches }: { fixture: any; matches: any[] }) {
  // Calculate H2H stats from database matches
  const homeWins = matches.filter((m: any) => 
    (m.homeTeam.id === fixture.homeTeam.id && m.goalsHome > m.goalsAway) ||
    (m.awayTeam.id === fixture.homeTeam.id && m.goalsAway > m.goalsHome)
  ).length
  const awayWins = matches.filter((m: any) => 
    (m.homeTeam.id === fixture.awayTeam.id && m.goalsHome > m.goalsAway) ||
    (m.awayTeam.id === fixture.awayTeam.id && m.goalsAway > m.goalsHome)
  ).length
  const draws = matches.length - homeWins - awayWins

  return (
    <div className="p-4 space-y-4">
      {/* Summary */}
      <div className="stat-card p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          Head-to-Head Summary
        </h4>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-success">{homeWins}</div>
            <div className="text-xs text-text-muted">{fixture.homeTeam.name}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-muted">{draws}</div>
            <div className="text-xs text-text-muted">Draws</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-danger">{awayWins}</div>
            <div className="text-xs text-text-muted">{fixture.awayTeam.name}</div>
          </div>
        </div>
        
        {/* Visual bar */}
        <div className="mt-3 h-2 rounded-full bg-terminal-elevated overflow-hidden flex">
          <div 
            className="bg-accent-success" 
            style={{ width: `${(homeWins / matches.length) * 100}%` }} 
          />
          <div 
            className="bg-terminal-muted" 
            style={{ width: `${(draws / matches.length) * 100}%` }} 
          />
          <div 
            className="bg-accent-danger" 
            style={{ width: `${(awayWins / matches.length) * 100}%` }} 
          />
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Recent Meetings</h4>
        <div className="space-y-2">
          {matches.map((match: any) => (
            <div
              key={match.id}
              className="stat-card p-3 flex items-center gap-3"
            >
              <div className="text-xs text-text-muted w-20">
                {formatDate(match.date, { day: 'numeric', month: 'short', year: '2-digit' })}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className={cn(
                  "text-sm",
                  match.goalsHome > match.goalsAway && "font-semibold"
                )}>
                  {match.homeTeam.name}
                </span>
                <span className="font-bold">
                  {match.goalsHome} - {match.goalsAway}
                </span>
                <span className={cn(
                  "text-sm",
                  match.goalsAway > match.goalsHome && "font-semibold"
                )}>
                  {match.awayTeam.name}
                </span>
              </div>
              {match.xgHome !== null && (
                <div className="text-xs text-text-muted">
                  {match.xgHome?.toFixed(1)} - {match.xgAway?.toFixed(1)} xG
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

