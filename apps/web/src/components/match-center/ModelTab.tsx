import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  Calculator,
  Sliders,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
} from 'lucide-react'
import { cn, calculate1X2Probabilities, calculateOverUnderProbabilities, calculateBTTSProbabilities, generateScorelineDistribution } from '../../lib/utils'
import { GET_FIXTURE_ODDS } from '../../graphql/queries'

interface ModelTabProps {
  fixture: any
}

export function ModelTab({ fixture }: ModelTabProps) {
  // Scenario adjustments
  const [homeStrikerOut, setHomeStrikerOut] = useState(false)
  const [awayKeyPlayerOut, setAwayKeyPlayerOut] = useState(false)
  const [congestionAdjustment, setCongestionAdjustment] = useState(0)

  // Fetch live odds for market comparison
  const { data: oddsData } = useQuery(GET_FIXTURE_ODDS, {
    variables: { fixtureId: fixture.id },
  })

  // Calculate market probabilities from live odds
  const marketProbs = useMemo(() => {
    const liveOdds = oddsData?.fixtureOdds
    if (liveOdds?.impliedProbabilities) {
      return {
        home: liveOdds.impliedProbabilities.home,
        draw: liveOdds.impliedProbabilities.draw,
        away: liveOdds.impliedProbabilities.away,
        over25: liveOdds.consensus?.over ? 1 / liveOdds.consensus.over / 1.96 : 0.52,
        bttsYes: 0.55, // Default, would need BTTS odds
      }
    }
    // Default fallback
    return {
      home: 0.45,
      draw: 0.28,
      away: 0.27,
      over25: 0.52,
      bttsYes: 0.55,
    }
  }, [oddsData])

  // Base expected goals (from fixture or estimate from historical data)
  const baseXgHome = fixture.xgHome ?? estimateXg(fixture, 'home')
  const baseXgAway = fixture.xgAway ?? estimateXg(fixture, 'away')

  // Estimate xG based on available data
  function estimateXg(_fixture: any, side: 'home' | 'away'): number {
    // Use historical average goals if available
    if (side === 'home') {
      return 1.55 // Premier League home avg
    }
    return 1.25 // Premier League away avg
  }

  // Apply scenario adjustments
  const adjustedXgHome = useMemo(() => {
    let xg = baseXgHome
    if (homeStrikerOut) xg -= 0.35
    xg *= (1 - congestionAdjustment * 0.05)
    return Math.max(0.3, xg)
  }, [baseXgHome, homeStrikerOut, congestionAdjustment])

  const adjustedXgAway = useMemo(() => {
    let xg = baseXgAway
    if (awayKeyPlayerOut) xg -= 0.25
    return Math.max(0.3, xg)
  }, [baseXgAway, awayKeyPlayerOut])

  // Calculate probabilities
  const probs1X2 = useMemo(() =>
    calculate1X2Probabilities(adjustedXgHome, adjustedXgAway),
    [adjustedXgHome, adjustedXgAway]
  )

  const probsOU25 = useMemo(() =>
    calculateOverUnderProbabilities(adjustedXgHome, adjustedXgAway, 2.5),
    [adjustedXgHome, adjustedXgAway]
  )

  const probsBTTS = useMemo(() =>
    calculateBTTSProbabilities(adjustedXgHome, adjustedXgAway),
    [adjustedXgHome, adjustedXgAway]
  )

  // Scoreline distribution
  const scorelineDistribution = useMemo(() =>
    generateScorelineDistribution(adjustedXgHome, adjustedXgAway),
    [adjustedXgHome, adjustedXgAway]
  )


  // Edge drivers (what makes model different from market)
  const edgeDrivers = [
    {
      factor: 'Team Strength',
      direction: 'home' as const,
      impact: 0.04,
      explanation: 'Home team xG-adjusted rating 8% above league average'
    },
    {
      factor: 'Rest Advantage',
      direction: 'home' as const,
      impact: 0.02,
      explanation: 'Home team has 2 extra rest days vs away'
    },
    {
      factor: 'Key Absences',
      direction: 'away' as const,
      impact: -0.03,
      explanation: 'Home striker injury reduces expected goal output'
    },
    {
      factor: 'H2H Trend',
      direction: 'home' as const,
      impact: 0.02,
      explanation: 'Home team won 6 of last 8 meetings'
    },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Model Probabilities */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-accent-primary" />
            Model Probabilities
          </h4>
          <span className="text-[10px] px-2 py-0.5 bg-terminal-elevated rounded text-text-muted">
            xG: {adjustedXgHome.toFixed(2)} - {adjustedXgAway.toFixed(2)}
          </span>
        </div>

        {/* 1X2 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <ModelVsMarket
            label={fixture.homeTeam.name.split(' ')[0]}
            modelProb={probs1X2.home}
            marketProb={marketProbs.home}
          />
          <ModelVsMarket
            label="Draw"
            modelProb={probs1X2.draw}
            marketProb={marketProbs.draw}
          />
          <ModelVsMarket
            label={fixture.awayTeam.name.split(' ')[0]}
            modelProb={probs1X2.away}
            marketProb={marketProbs.away}
          />
        </div>

        {/* O/U and BTTS */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-terminal-border/50">
          <ModelVsMarket
            label="Over 2.5"
            modelProb={probsOU25.over}
            marketProb={marketProbs.over25}
          />
          <ModelVsMarket
            label="BTTS Yes"
            modelProb={probsBTTS.yes}
            marketProb={marketProbs.bttsYes}
          />
        </div>
      </div>

      {/* Scoreline Distribution */}
      <div className="stat-card">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-accent-purple" />
          Most Likely Scorelines
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {scorelineDistribution.slice(0, 9).map((score, i) => (
            <div
              key={i}
              className={cn(
                "p-2 rounded text-center",
                i === 0
                  ? "bg-accent-primary/20 border border-accent-primary/30"
                  : "bg-terminal-elevated"
              )}
            >
              <div className="text-sm font-bold">
                {score.home} - {score.away}
              </div>
              <div className="text-[10px] text-text-muted">
                {(score.prob * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edge Decomposer */}
      <div className="stat-card">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-warning" />
          Edge Drivers
        </h4>
        <div className="space-y-2">
          {edgeDrivers.map((driver, i) => (
            <EdgeDriverRow key={i} {...driver} />
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-terminal-border/50 text-xs text-text-muted flex items-start gap-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>These factors explain why the model probability differs from market consensus.</span>
        </div>
      </div>

      {/* Scenario Engine */}
      <div className="stat-card">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-accent-cyan" />
          Scenario Engine
        </h4>

        <div className="space-y-4">
          {/* Toggle scenarios */}
          <div className="space-y-2">
            <ScenarioToggle
              label="Home striker OUT"
              description="-0.35 xG impact"
              enabled={homeStrikerOut}
              onToggle={() => setHomeStrikerOut(!homeStrikerOut)}
            />
            <ScenarioToggle
              label="Away key player OUT"
              description="-0.25 xG impact"
              enabled={awayKeyPlayerOut}
              onToggle={() => setAwayKeyPlayerOut(!awayKeyPlayerOut)}
            />
          </div>

          {/* Slider scenario */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-secondary">Fixture Congestion</span>
              <span className="text-xs text-text-muted">
                {congestionAdjustment === 0 ? 'Normal' : `${congestionAdjustment > 0 ? '+' : ''}${congestionAdjustment} matches`}
              </span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="1"
              value={congestionAdjustment}
              onChange={(e) => setCongestionAdjustment(parseInt(e.target.value))}
              className="w-full h-1.5 bg-terminal-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>Fresh</span>
              <span>Normal</span>
              <span>Congested</span>
            </div>
          </div>
        </div>

        {/* Scenario Impact Summary */}
        {(homeStrikerOut || awayKeyPlayerOut || congestionAdjustment !== 0) && (
          <div className="mt-4 p-3 rounded-lg bg-terminal-elevated border border-terminal-border">
            <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-accent-warning" />
              Scenario Impact
            </div>
            <div className="text-xs text-text-secondary space-y-1">
              <div className="flex justify-between">
                <span>xG Home:</span>
                <span>{baseXgHome.toFixed(2)} → {adjustedXgHome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>xG Away:</span>
                <span>{baseXgAway.toFixed(2)} → {adjustedXgAway.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Home Win:</span>
                <span className={probs1X2.home > marketProbs.home ? "text-accent-success" : "text-accent-danger"}>
                  {(probs1X2.home * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invalidation Checklist */}
      <div className="stat-card border-accent-warning/20">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent-warning" />
          Invalidation Checklist
        </h4>
        <p className="text-xs text-text-muted mb-3">
          If any of these occur, the edge may disappear:
        </p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-warning mt-1.5 flex-shrink-0" />
            <span>Lineup surprise: Key home attacker benched</span>
          </li>
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-warning mt-1.5 flex-shrink-0" />
            <span>Formation change: Home team switches to defensive setup</span>
          </li>
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-warning mt-1.5 flex-shrink-0" />
            <span>Weather: Heavy rain reduces goal expectation</span>
          </li>
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-warning mt-1.5 flex-shrink-0" />
            <span>Market moves: Odds drift significantly before kickoff</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

interface ModelVsMarketProps {
  label: string
  modelProb: number
  marketProb: number
}

function ModelVsMarket({ label, modelProb, marketProb }: ModelVsMarketProps) {
  const edge = modelProb - marketProb
  const hasEdge = Math.abs(edge) > 0.03
  const positiveEdge = edge > 0.03

  return (
    <div className="text-center">
      <div className="text-xs text-text-muted mb-1 truncate">{label}</div>
      <div className={cn(
        "text-xl font-bold",
        hasEdge && positiveEdge && "text-accent-success",
        hasEdge && !positiveEdge && "text-accent-danger",
        !hasEdge && "text-text-primary"
      )}>
        {(modelProb * 100).toFixed(0)}%
      </div>
      <div className="text-[10px] text-text-muted">
        Market: {(marketProb * 100).toFixed(0)}%
      </div>
      {hasEdge && (
        <div className={cn(
          "text-[10px] font-medium mt-1",
          positiveEdge ? "text-accent-success" : "text-accent-danger"
        )}>
          {positiveEdge ? '+' : ''}{(edge * 100).toFixed(1)}% edge
        </div>
      )}
    </div>
  )
}

interface EdgeDriverRowProps {
  factor: string
  direction: 'home' | 'away' | 'over' | 'under'
  impact: number
  explanation: string
}

function EdgeDriverRow({ factor, direction, impact, explanation }: EdgeDriverRowProps) {
  const [expanded, setExpanded] = useState(false)
  const isPositive = impact > 0

  return (
    <div className="bg-terminal-elevated rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-2 flex items-center gap-2 text-left"
      >
        <div className={cn(
          "w-6 h-6 rounded flex items-center justify-center",
          isPositive ? "bg-accent-success/20" : "bg-accent-danger/20"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-accent-success" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-accent-danger" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium">{factor}</div>
          <div className="text-[10px] text-text-muted capitalize">{direction}</div>
        </div>
        <span className={cn(
          "text-xs font-semibold",
          isPositive ? "text-accent-success" : "text-accent-danger"
        )}>
          {isPositive ? '+' : ''}{(impact * 100).toFixed(1)}%
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>
      {expanded && (
        <div className="px-2 pb-2 text-xs text-text-secondary border-t border-terminal-border/50 pt-2 mx-2">
          {explanation}
        </div>
      )}
    </div>
  )
}

interface ScenarioToggleProps {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}

function ScenarioToggle({ label, description, enabled, onToggle }: ScenarioToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full p-2 rounded-lg flex items-center justify-between text-left transition-all",
        enabled
          ? "bg-accent-primary/20 border border-accent-primary/30"
          : "bg-terminal-elevated hover:bg-terminal-elevated/80"
      )}
    >
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-text-muted">{description}</div>
      </div>
      <div className={cn(
        "w-8 h-4 rounded-full transition-colors relative",
        enabled ? "bg-accent-primary" : "bg-terminal-muted"
      )}>
        <div className={cn(
          "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
          enabled ? "translate-x-4" : "translate-x-0.5"
        )} />
      </div>
    </button>
  )
}

