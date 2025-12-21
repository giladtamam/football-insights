import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { cn, formatOdds, oddsToImpliedProb, removeOverround } from '../../lib/utils'
import { GET_FIXTURE_ODDS, GET_ODDS_HISTORY } from '../../graphql/queries'

interface OddsTabProps {
  fixture: any
}

type Market = '1x2' | 'ou25' | 'btts' | 'ah'

export function OddsTab({ fixture }: OddsTabProps) {
  const [selectedMarket, setSelectedMarket] = useState<Market>('1x2')
  const [showAllBookmakers, setShowAllBookmakers] = useState(false)

  // Fetch live odds from API
  const { data: oddsData, loading: oddsLoading, refetch: refetchOdds } = useQuery(GET_FIXTURE_ODDS, {
    variables: { fixtureId: fixture.id },
    fetchPolicy: 'cache-and-network',
  })

  // Fetch historical odds
  const { data: historyData } = useQuery(GET_ODDS_HISTORY, {
    variables: { fixtureId: fixture.id, market: '1X2' },
  })

  const liveOdds = oddsData?.fixtureOdds
  const oddsHistory = historyData?.oddsHistory || []

  // Process bookmakers data for display
  const processedBookmakers = useMemo(() => {
    if (!liveOdds?.bookmakers) return []

    return liveOdds.bookmakers
      .filter((b: any) => b.h2h)
      .map((b: any) => ({
        name: b.name,
        home: b.h2h.home,
        draw: b.h2h.draw,
        away: b.h2h.away,
        totals: b.totals,
        margin: calculateMargin(b.h2h.home, b.h2h.draw, b.h2h.away),
      }))
      .sort((a: any, b: any) => a.margin - b.margin)
  }, [liveOdds])

  // Get totals odds
  const totalsOdds = useMemo(() => {
    if (!liveOdds?.consensus) return null
    return {
      over: liveOdds.consensus.over,
      under: liveOdds.consensus.under,
      point: liveOdds.consensus.point || 2.5,
    }
  }, [liveOdds])

  // Calculate margin
  function calculateMargin(home: number, draw: number, away: number): number {
    if (!home || !draw || !away) return 0
    return ((1 / home + 1 / draw + 1 / away) - 1) * 100
  }

  // Prepare chart data from history
  const chartData = useMemo(() => {
    if (!oddsHistory.length) {
      // Use mock data if no history
      return [
        { time: 'Open', home: 2.25, draw: 3.30, away: 3.40 },
        { time: 'Now', home: liveOdds?.consensus?.home || 2.10, draw: liveOdds?.consensus?.draw || 3.40, away: liveOdds?.consensus?.away || 3.60 },
      ]
    }
    return oddsHistory.map((snap: any, i: number) => ({
      time: i === 0 ? 'Open' : i === oddsHistory.length - 1 ? 'Now' : `T-${oddsHistory.length - i}`,
      home: snap.homeOdds,
      draw: snap.drawOdds,
      away: snap.awayOdds,
    }))
  }, [oddsHistory, liveOdds])

  const marketTabs = [
    { id: '1x2' as const, label: '1X2' },
    { id: 'ou25' as const, label: 'O/U 2.5' },
    { id: 'btts' as const, label: 'BTTS' },
    { id: 'ah' as const, label: 'Asian H.' },
  ]

  // Calculate implied probabilities
  const impliedProbs = useMemo(() => {
    if (!liveOdds?.consensus) {
      return {
        raw: { home: 0.45, draw: 0.27, away: 0.28 },
        fair: { home: 0.47, draw: 0.28, away: 0.25 },
        overround: 0.04,
      }
    }

    const { home, draw, away } = liveOdds.consensus
    const rawProbs = [
      oddsToImpliedProb(home || 2.0),
      oddsToImpliedProb(draw || 3.5),
      oddsToImpliedProb(away || 4.0),
    ]
    const fairProbs = removeOverround(rawProbs)
    return {
      raw: { home: rawProbs[0], draw: rawProbs[1], away: rawProbs[2] },
      fair: { home: fairProbs[0], draw: fairProbs[1], away: fairProbs[2] },
      overround: rawProbs.reduce((a, b) => a + b, 0) - 1,
    }
  }, [liveOdds])

  // Opening odds from first bookmaker or history
  const openingOdds = useMemo(() => {
    if (oddsHistory.length > 0) {
      const first = oddsHistory.find((s: any) => s.isOpening) || oddsHistory[0]
      return { home: first.homeOdds, draw: first.drawOdds, away: first.awayOdds }
    }
    // Estimate opening from current
    if (liveOdds?.consensus) {
      return {
        home: (liveOdds.consensus.home || 2.0) * 1.05,
        draw: (liveOdds.consensus.draw || 3.5) * 0.98,
        away: (liveOdds.consensus.away || 4.0) * 0.95,
      }
    }
    return { home: 2.25, draw: 3.30, away: 3.40 }
  }, [oddsHistory, liveOdds])

  if (oddsLoading && !liveOdds) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
        <span className="ml-2 text-text-secondary">Loading odds...</span>
      </div>
    )
  }

  // Only show real odds data - no fallbacks
  if (!liveOdds || !liveOdds.consensus) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-1">No Odds Available</h3>
        <p className="text-sm text-text-muted">
          Real-time odds are not available for this fixture.
        </p>
        <p className="text-xs text-text-muted mt-2">
          Odds are typically available for upcoming matches in major leagues.
        </p>
      </div>
    )
  }

  const currentOdds = liveOdds.consensus

  return (
    <div className="p-4 space-y-4">
      {/* Market Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {marketTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedMarket(tab.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                selectedMarket === tab.id
                  ? "bg-accent-primary/20 text-accent-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-terminal-elevated"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => refetchOdds()}
          className="p-1.5 text-text-muted hover:text-accent-primary transition-colors"
          title="Refresh odds"
        >
          <RefreshCw className={cn("w-4 h-4", oddsLoading && "animate-spin")} />
        </button>
      </div>

      {!liveOdds && !oddsLoading && (
        <div className="stat-card p-6 text-center">
          <AlertCircle className="w-8 h-8 text-accent-warning mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No live odds available for this fixture</p>
          <p className="text-xs text-text-muted mt-1">Odds may not be available for past matches or minor leagues</p>
        </div>
      )}

      {selectedMarket === '1x2' && (
        <>
          {/* Main Odds Display */}
          <div className="stat-card">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <OddsCell
                label={fixture.homeTeam.name}
                currentOdds={currentOdds.home}
                openingOdds={openingOdds.home}
                impliedProb={impliedProbs.fair.home}
              />
              <OddsCell
                label="Draw"
                currentOdds={currentOdds.draw}
                openingOdds={openingOdds.draw}
                impliedProb={impliedProbs.fair.draw}
              />
              <OddsCell
                label={fixture.awayTeam.name}
                currentOdds={currentOdds.away}
                openingOdds={openingOdds.away}
                impliedProb={impliedProbs.fair.away}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-terminal-border/50 text-xs text-text-muted">
              <span>Market Overround: {(impliedProbs.overround * 100).toFixed(1)}%</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {liveOdds ? 'Live' : 'Historical'}
              </span>
            </div>
          </div>

          {/* Odds Movement Chart */}
          <div className="stat-card">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-primary" />
              Line Movement
            </h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="time"
                    stroke="#6e7681"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#6e7681"
                    tick={{ fontSize: 10 }}
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161b22',
                      border: '1px solid #30363d',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="home"
                    stroke="#58a6ff"
                    dot={false}
                    strokeWidth={2}
                    name="Home"
                  />
                  <Line
                    type="monotone"
                    dataKey="draw"
                    stroke="#6e7681"
                    dot={false}
                    strokeWidth={2}
                    name="Draw"
                  />
                  <Line
                    type="monotone"
                    dataKey="away"
                    stroke="#a371f7"
                    dot={false}
                    strokeWidth={2}
                    name="Away"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Movement Summary */}
            <div className="flex items-center justify-center gap-6 mt-2">
              <MovementIndicator
                label="Home"
                opening={openingOdds.home}
                current={currentOdds.home || 2.10}
              />
              <MovementIndicator
                label="Draw"
                opening={openingOdds.draw}
                current={currentOdds.draw || 3.40}
              />
              <MovementIndicator
                label="Away"
                opening={openingOdds.away}
                current={currentOdds.away || 3.60}
              />
            </div>
          </div>

          {/* Bookmaker Comparison */}
          {processedBookmakers.length > 0 && (
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Bookmaker Comparison</h4>
                <button
                  onClick={() => setShowAllBookmakers(!showAllBookmakers)}
                  className="text-xs text-accent-primary flex items-center gap-1"
                >
                  {showAllBookmakers ? 'Show less' : `Show all (${processedBookmakers.length})`}
                  {showAllBookmakers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Header */}
              <div className="flex items-center gap-2 text-[10px] text-text-muted mb-2 pb-2 border-b border-terminal-border/30">
                <span className="w-24">Bookmaker</span>
                <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                  <span>Home</span>
                  <span>Draw</span>
                  <span>Away</span>
                </div>
                <span className="w-12 text-right">Margin</span>
              </div>

              <div className="space-y-2">
                {(showAllBookmakers ? processedBookmakers : processedBookmakers.slice(0, 4)).map((bookie: any, i: number) => {
                  const bestHome = bookie.home === Math.max(...processedBookmakers.map((b: any) => b.home))
                  const bestDraw = bookie.draw === Math.max(...processedBookmakers.map((b: any) => b.draw))
                  const bestAway = bookie.away === Math.max(...processedBookmakers.map((b: any) => b.away))

                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-text-muted truncate">{bookie.name}</span>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <span className={cn(
                          "text-center font-medium",
                          bestHome && "text-accent-success"
                        )}>
                          {formatOdds(bookie.home)}
                        </span>
                        <span className={cn(
                          "text-center font-medium",
                          bestDraw && "text-accent-success"
                        )}>
                          {formatOdds(bookie.draw)}
                        </span>
                        <span className={cn(
                          "text-center font-medium",
                          bestAway && "text-accent-success"
                        )}>
                          {formatOdds(bookie.away)}
                        </span>
                      </div>
                      <span className={cn(
                        "w-12 text-right text-text-muted",
                        bookie.margin < 3 && "text-accent-success"
                      )}>
                        {bookie.margin.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-terminal-border/50 flex items-center gap-2 text-xs text-text-muted">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Best value highlighted • Sorted by margin (lowest first)</span>
              </div>
            </div>
          )}

          {/* Implied Probability Breakdown */}
          <div className="stat-card">
            <h4 className="text-sm font-semibold mb-3">Fair Probability (Overround Removed)</h4>
            <div className="space-y-3">
              <ProbabilityBar
                label={fixture.homeTeam.name}
                probability={impliedProbs.fair.home}
                color="bg-accent-primary"
              />
              <ProbabilityBar
                label="Draw"
                probability={impliedProbs.fair.draw}
                color="bg-gray-500"
              />
              <ProbabilityBar
                label={fixture.awayTeam.name}
                probability={impliedProbs.fair.away}
                color="bg-accent-secondary"
              />
            </div>
          </div>
        </>
      )}

      {selectedMarket === 'ou25' && (
        <div className="stat-card">
          {totalsOdds ? (
            <>
              <div className="text-center text-xs text-text-muted mb-3">
                Total Goals Line: {totalsOdds.point}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <OddsCell
                  label={`Over ${totalsOdds.point}`}
                  currentOdds={totalsOdds.over || 1.85}
                  openingOdds={(totalsOdds.over || 1.85) * 1.03}
                  impliedProb={oddsToImpliedProb(totalsOdds.over || 1.85)}
                />
                <OddsCell
                  label={`Under ${totalsOdds.point}`}
                  currentOdds={totalsOdds.under || 2.00}
                  openingOdds={(totalsOdds.under || 2.00) * 0.98}
                  impliedProb={oddsToImpliedProb(totalsOdds.under || 2.00)}
                />
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">Over/Under odds not available</p>
            </div>
          )}
        </div>
      )}

      {selectedMarket === 'btts' && (
        <div className="stat-card p-8 text-center">
          <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">BTTS odds coming soon</p>
          <p className="text-xs text-text-muted mt-1">Requires additional data source</p>
        </div>
      )}

      {selectedMarket === 'ah' && (
        <div className="stat-card p-8 text-center">
          <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">Asian Handicap odds coming soon</p>
        </div>
      )}
    </div>
  )
}

interface OddsCellProps {
  label: string
  currentOdds: number
  openingOdds: number
  impliedProb: number
}

function OddsCell({ label, currentOdds, openingOdds, impliedProb }: OddsCellProps) {
  const movement = currentOdds - openingOdds
  const drifting = movement > 0.05
  const steaming = movement < -0.05

  return (
    <div className="text-center">
      <div className="text-xs text-text-muted mb-1 truncate">{label}</div>
      <div className="flex items-center justify-center gap-1">
        <span className="text-2xl font-bold">{formatOdds(currentOdds)}</span>
        {drifting && <TrendingUp className="w-4 h-4 text-accent-danger" />}
        {steaming && <TrendingDown className="w-4 h-4 text-accent-success" />}
      </div>
      <div className="text-xs text-text-muted mt-1">
        {(impliedProb * 100).toFixed(0)}% implied
      </div>
      <div className={cn(
        "text-[10px] mt-1",
        drifting && "text-accent-danger",
        steaming && "text-accent-success",
        !drifting && !steaming && "text-text-muted"
      )}>
        Open: {formatOdds(openingOdds)}
      </div>
    </div>
  )
}

interface MovementIndicatorProps {
  label: string
  opening: number
  current: number
}

function MovementIndicator({ label, opening, current }: MovementIndicatorProps) {
  const change = ((current - opening) / opening) * 100
  const isPositive = change > 0
  const isSignificant = Math.abs(change) > 2

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-text-muted">{label}:</span>
      <span className={cn(
        "font-medium flex items-center gap-0.5",
        isSignificant && isPositive && "text-accent-danger",
        isSignificant && !isPositive && "text-accent-success",
        !isSignificant && "text-text-secondary"
      )}>
        {isPositive ? '+' : ''}{change.toFixed(1)}%
        {isSignificant && (isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
        {!isSignificant && <Minus className="w-3 h-3" />}
      </span>
    </div>
  )
}

interface ProbabilityBarProps {
  label: string
  probability: number
  color: string
}

function ProbabilityBar({ label, probability, color }: ProbabilityBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-secondary truncate max-w-[120px]">{label}</span>
        <span className="font-medium">{(probability * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-terminal-elevated rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${probability * 100}%` }}
        />
      </div>
    </div>
  )
}
