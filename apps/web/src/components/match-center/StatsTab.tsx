import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { 
  BarChart3,
  Crosshair,
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { cn } from '../../lib/utils'
import { GET_FIXTURE_STATS, GET_FIXTURE_EVENTS } from '../../graphql/queries'

interface StatsTabProps {
  fixture: any
}

export function StatsTab({ fixture }: StatsTabProps) {
  const { data, loading, refetch } = useQuery(GET_FIXTURE_STATS, {
    variables: { fixtureId: fixture.id },
    fetchPolicy: 'cache-and-network',
  })

  const { data: eventsData } = useQuery(GET_FIXTURE_EVENTS, {
    variables: { fixtureId: fixture.id },
  })

  // Parse stats from API response
  const stats = useMemo(() => {
    const apiStats = data?.fixtureStats
    if (!apiStats || !Array.isArray(apiStats) || apiStats.length < 2) {
      // Fallback to mock/xG data
      return {
        home: {
          possession: 50,
          shots: fixture.stats?.homeStats?.shots ?? 0,
          shotsOnTarget: fixture.stats?.homeStats?.shotsOnTarget ?? 0,
          corners: 0,
          fouls: 0,
          yellowCards: 0,
          redCards: 0,
          offsides: 0,
          passes: 0,
          passAccuracy: 0,
          xg: fixture.xgHome ?? 0,
          bigChances: 0,
        },
        away: {
          possession: 50,
          shots: fixture.stats?.awayStats?.shots ?? 0,
          shotsOnTarget: fixture.stats?.awayStats?.shotsOnTarget ?? 0,
          corners: 0,
          fouls: 0,
          yellowCards: 0,
          redCards: 0,
          offsides: 0,
          passes: 0,
          passAccuracy: 0,
          xg: fixture.xgAway ?? 0,
          bigChances: 0,
        },
        hasData: false,
      }
    }

    // Parse team stats from API
    const homeStats = apiStats[0]?.statistics || []
    const awayStats = apiStats[1]?.statistics || []

    const getStatValue = (stats: any[], type: string): number => {
      const stat = stats.find((s: any) => s.type === type)
      if (!stat?.value) return 0
      if (typeof stat.value === 'string' && stat.value.includes('%')) {
        return parseFloat(stat.value)
      }
      return typeof stat.value === 'number' ? stat.value : parseInt(stat.value) || 0
    }

    return {
      home: {
        possession: getStatValue(homeStats, 'Ball Possession'),
        shots: getStatValue(homeStats, 'Total Shots'),
        shotsOnTarget: getStatValue(homeStats, 'Shots on Goal'),
        corners: getStatValue(homeStats, 'Corner Kicks'),
        fouls: getStatValue(homeStats, 'Fouls'),
        yellowCards: getStatValue(homeStats, 'Yellow Cards'),
        redCards: getStatValue(homeStats, 'Red Cards'),
        offsides: getStatValue(homeStats, 'Offsides'),
        passes: getStatValue(homeStats, 'Total passes'),
        passAccuracy: getStatValue(homeStats, 'Passes %'),
        xg: getStatValue(homeStats, 'expected_goals') || fixture.xgHome || 0,
        bigChances: getStatValue(homeStats, 'Big Chances'),
      },
      away: {
        possession: getStatValue(awayStats, 'Ball Possession'),
        shots: getStatValue(awayStats, 'Total Shots'),
        shotsOnTarget: getStatValue(awayStats, 'Shots on Goal'),
        corners: getStatValue(awayStats, 'Corner Kicks'),
        fouls: getStatValue(awayStats, 'Fouls'),
        yellowCards: getStatValue(awayStats, 'Yellow Cards'),
        redCards: getStatValue(awayStats, 'Red Cards'),
        offsides: getStatValue(awayStats, 'Offsides'),
        passes: getStatValue(awayStats, 'Total passes'),
        passAccuracy: getStatValue(awayStats, 'Passes %'),
        xg: getStatValue(awayStats, 'expected_goals') || fixture.xgAway || 0,
        bigChances: getStatValue(awayStats, 'Big Chances'),
      },
      hasData: true,
    }
  }, [data, fixture])

  // Build xG timeline from events
  const xgTimeline = useMemo(() => {
    const events = eventsData?.fixtureEvents || []
    const goals = events.filter((e: any) => e.type === 'Goal')
    
    // Create timeline based on goals scored
    const timeline = [{ minute: 0, home: 0, away: 0 }]
    let homeXg = 0
    let awayXg = 0
    
    // Distribute xG across the match based on goals
    const homeGoalTimes = goals.filter((g: any) => g.teamId === fixture.homeTeam.id).map((g: any) => g.time)
    const awayGoalTimes = goals.filter((g: any) => g.teamId === fixture.awayTeam.id).map((g: any) => g.time)
    
    const xgPerHomeGoal = stats.home.xg / Math.max(fixture.goalsHome || 1, 1)
    const xgPerAwayGoal = stats.away.xg / Math.max(fixture.goalsAway || 1, 1)
    
    for (let minute = 15; minute <= 90; minute += 15) {
      homeXg += homeGoalTimes.filter((t: number) => t > minute - 15 && t <= minute).length * xgPerHomeGoal
      awayXg += awayGoalTimes.filter((t: number) => t > minute - 15 && t <= minute).length * xgPerAwayGoal
      
      // Add some baseline xG accumulation
      homeXg = Math.min(homeXg + (stats.home.xg / 6), stats.home.xg)
      awayXg = Math.min(awayXg + (stats.away.xg / 6), stats.away.xg)
      
      timeline.push({ minute, home: Number(homeXg.toFixed(2)), away: Number(awayXg.toFixed(2)) })
    }
    
    // Ensure final values match actual xG
    timeline[timeline.length - 1] = { minute: 90, home: stats.home.xg, away: stats.away.xg }
    
    return timeline
  }, [eventsData, stats, fixture])

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
        <span className="ml-2 text-text-secondary">Loading statistics...</span>
      </div>
    )
  }

  if (!stats.hasData && !fixture.isFinished) {
    return (
      <div className="p-4 space-y-4">
        <div className="stat-card p-8 text-center">
          <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Statistics Not Available</h3>
          <p className="text-sm text-text-secondary mb-4">
            Match statistics will be available during and after the match
          </p>
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terminal-elevated hover:bg-terminal-muted rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* xG Timeline Chart */}
      {(stats.home.xg > 0 || stats.away.xg > 0) && (
        <div className="stat-card">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-primary" />
            xG Timeline
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xgTimeline}>
                <defs>
                  <linearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="awayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a371f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a371f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="minute" 
                  stroke="#6e7681"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}'`}
                />
                <YAxis 
                  stroke="#6e7681"
                  tick={{ fontSize: 10 }}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(v) => `${v}'`}
                />
                {fixture.goalsHome !== null && (
                  <ReferenceLine y={fixture.goalsHome} stroke="#3fb950" strokeDasharray="3 3" />
                )}
                {fixture.goalsAway !== null && (
                  <ReferenceLine y={fixture.goalsAway} stroke="#f85149" strokeDasharray="3 3" />
                )}
                <Area 
                  type="monotone" 
                  dataKey="home" 
                  stroke="#58a6ff" 
                  fill="url(#homeGradient)"
                  name={fixture.homeTeam.name}
                />
                <Area 
                  type="monotone" 
                  dataKey="away" 
                  stroke="#a371f7" 
                  fill="url(#awayGradient)"
                  name={fixture.awayTeam.name}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-accent-primary rounded" />
              <span className="text-text-secondary">{fixture.homeTeam.name}: {stats.home.xg.toFixed(2)} xG</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-accent-purple rounded" />
              <span className="text-text-secondary">{fixture.awayTeam.name}: {stats.away.xg.toFixed(2)} xG</span>
            </div>
          </div>
        </div>
      )}

      {/* Key Stats Comparison */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent-primary" />
            Match Statistics
          </h4>
          <button 
            onClick={() => refetch()}
            className="p-1 text-text-muted hover:text-accent-primary transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
        <div className="space-y-3">
          <StatBar 
            label="Possession" 
            homeValue={stats.home.possession} 
            awayValue={stats.away.possession}
            suffix="%"
            isPercentage
          />
          <StatBar 
            label="Shots" 
            homeValue={stats.home.shots} 
            awayValue={stats.away.shots}
          />
          <StatBar 
            label="Shots on Target" 
            homeValue={stats.home.shotsOnTarget} 
            awayValue={stats.away.shotsOnTarget}
          />
          {(stats.home.xg > 0 || stats.away.xg > 0) && (
            <StatBar 
              label="xG" 
              homeValue={stats.home.xg} 
              awayValue={stats.away.xg}
              decimals={2}
            />
          )}
          <StatBar 
            label="Corners" 
            homeValue={stats.home.corners} 
            awayValue={stats.away.corners}
          />
          <StatBar 
            label="Pass Accuracy" 
            homeValue={stats.home.passAccuracy} 
            awayValue={stats.away.passAccuracy}
            suffix="%"
            isPercentage
          />
          <StatBar 
            label="Fouls" 
            homeValue={stats.home.fouls} 
            awayValue={stats.away.fouls}
            inverse
          />
          <StatBar 
            label="Offsides" 
            homeValue={stats.home.offsides} 
            awayValue={stats.away.offsides}
          />
        </div>
      </div>

      {/* Cards */}
      {(stats.home.yellowCards > 0 || stats.away.yellowCards > 0 || stats.home.redCards > 0 || stats.away.redCards > 0) && (
        <div className="stat-card">
          <h4 className="text-sm font-semibold mb-3">Discipline</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs text-text-muted mb-2">{fixture.homeTeam.name}</div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-5 bg-yellow-400 rounded-sm" />
                  <span className="font-bold">{stats.home.yellowCards}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-5 bg-red-500 rounded-sm" />
                  <span className="font-bold">{stats.home.redCards}</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-muted mb-2">{fixture.awayTeam.name}</div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-5 bg-yellow-400 rounded-sm" />
                  <span className="font-bold">{stats.away.yellowCards}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-5 bg-red-500 rounded-sm" />
                  <span className="font-bold">{stats.away.redCards}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finishing Analysis */}
      {fixture.isFinished && (stats.home.shots > 0 || stats.away.shots > 0) && (
        <div className="stat-card">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-accent-warning" />
            Finishing Analysis
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-muted mb-2">{fixture.homeTeam.name}</div>
              <FinishingIndicator 
                goals={fixture.goalsHome ?? 0}
                xg={stats.home.xg}
                shots={stats.home.shots}
                shotsOnTarget={stats.home.shotsOnTarget}
              />
            </div>
            <div>
              <div className="text-xs text-text-muted mb-2">{fixture.awayTeam.name}</div>
              <FinishingIndicator 
                goals={fixture.goalsAway ?? 0}
                xg={stats.away.xg}
                shots={stats.away.shots}
                shotsOnTarget={stats.away.shotsOnTarget}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatBarProps {
  label: string
  homeValue: number
  awayValue: number
  suffix?: string
  decimals?: number
  isPercentage?: boolean
  inverse?: boolean
}

function StatBar({ label, homeValue, awayValue, suffix = '', decimals = 0, isPercentage, inverse }: StatBarProps) {
  const total = homeValue + awayValue
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50
  const awayPercent = 100 - homePercent

  const homeWins = inverse ? homeValue < awayValue : homeValue > awayValue
  const awayWins = inverse ? awayValue < homeValue : awayValue > homeValue

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "font-medium",
          homeWins && "text-accent-success"
        )}>
          {homeValue.toFixed(decimals)}{suffix}
        </span>
        <span className="text-text-muted">{label}</span>
        <span className={cn(
          "font-medium",
          awayWins && "text-accent-success"
        )}>
          {awayValue.toFixed(decimals)}{suffix}
        </span>
      </div>
      <div className="h-1.5 bg-terminal-elevated rounded-full overflow-hidden flex">
        <div 
          className={cn(
            "transition-all rounded-l-full",
            homeWins ? "bg-accent-primary" : "bg-terminal-muted"
          )}
          style={{ width: `${isPercentage ? homeValue : homePercent}%` }}
        />
        <div 
          className={cn(
            "transition-all rounded-r-full",
            awayWins ? "bg-accent-purple" : "bg-terminal-muted"
          )}
          style={{ width: `${isPercentage ? awayValue : awayPercent}%` }}
        />
      </div>
    </div>
  )
}

interface FinishingIndicatorProps {
  goals: number
  xg: number
  shots: number
  shotsOnTarget: number
}

function FinishingIndicator({ goals, xg, shots, shotsOnTarget }: FinishingIndicatorProps) {
  const finishingDelta = xg > 0 ? goals - xg : 0
  const conversionRate = shots > 0 ? (goals / shots) * 100 : 0
  const accuracyRate = shots > 0 ? (shotsOnTarget / shots) * 100 : 0

  return (
    <div className="space-y-2">
      {xg > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Goals vs xG</span>
          <span className={cn(
            "text-sm font-semibold",
            finishingDelta > 0 ? "text-accent-success" : finishingDelta < 0 ? "text-accent-danger" : "text-text-secondary"
          )}>
            {finishingDelta > 0 ? '+' : ''}{finishingDelta.toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">Conversion</span>
        <span className="text-sm font-semibold">{conversionRate.toFixed(0)}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">Shot Accuracy</span>
        <span className="text-sm font-semibold">{accuracyRate.toFixed(0)}%</span>
      </div>
    </div>
  )
}
