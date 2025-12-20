import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Target,
  Shield,
  Circle,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { cn, getFormColor, calculate1X2Probabilities, calculateOverUnderProbabilities, formatDate } from '../../lib/utils'
import { GET_FIXTURE_EVENTS, GET_TEAM_FIXTURES } from '../../graphql/queries'

interface OverviewTabProps {
  fixture: any
}

export function OverviewTab({ fixture }: OverviewTabProps) {
  // Fetch events for match timeline
  const { data: eventsData, loading: eventsLoading } = useQuery(GET_FIXTURE_EVENTS, {
    variables: { fixtureId: fixture.id },
    skip: !fixture.isFinished && !fixture.statusShort?.includes('1H') && !fixture.statusShort?.includes('2H'),
  })

  // Fetch recent form (last 5 matches for each team)
  const { data: homeFormData } = useQuery(GET_TEAM_FIXTURES, {
    variables: { teamId: fixture.homeTeam.id, last: 5 },
  })
  const { data: awayFormData } = useQuery(GET_TEAM_FIXTURES, {
    variables: { teamId: fixture.awayTeam.id, last: 5 },
  })

  // Calculate form from fetched data
  const teamForm = useMemo(() => {
    const calculateForm = (fixtures: any[], teamId: number): string[] => {
      if (!fixtures) return ['?', '?', '?', '?', '?']
      return fixtures.slice(0, 5).map((f: any) => {
        const isHome = f.homeTeam.id === teamId
        const teamGoals = isHome ? f.goalsHome : f.goalsAway
        const opponentGoals = isHome ? f.goalsAway : f.goalsHome
        if (teamGoals === null || opponentGoals === null) return '?'
        if (teamGoals > opponentGoals) return 'W'
        if (teamGoals < opponentGoals) return 'L'
        return 'D'
      })
    }

    return {
      home: calculateForm(homeFormData?.teamFixtures || [], fixture.homeTeam.id),
      away: calculateForm(awayFormData?.teamFixtures || [], fixture.awayTeam.id),
    }
  }, [homeFormData, awayFormData, fixture])

  // Events timeline
  const events = eventsData?.fixtureEvents || []
  const goals = events.filter((e: any) => e.type === 'Goal')
  const cards = events.filter((e: any) => e.type === 'Card')
  
  // Calculate model probabilities (simplified Poisson-based)
  const lambdaHome = fixture.xgHome ?? 1.5
  const lambdaAway = fixture.xgAway ?? 1.2
  
  const probs1X2 = useMemo(() => 
    calculate1X2Probabilities(lambdaHome, lambdaAway), 
    [lambdaHome, lambdaAway]
  )

  const probsOU = useMemo(() => 
    calculateOverUnderProbabilities(lambdaHome, lambdaAway, 2.5),
    [lambdaHome, lambdaAway]
  )

  // Generate what to watch insights
  const insights = useMemo(() => {
    const items: { text: string; type: 'primary' | 'warning' | 'danger' }[] = []
    
    // xG based insights
    if (fixture.xgHome && fixture.xgAway) {
      const totalXg = fixture.xgHome + fixture.xgAway
      if (totalXg > 3) {
        items.push({ text: `Combined xG of ${totalXg.toFixed(2)} suggests high-scoring affair`, type: 'primary' })
      }
      if (fixture.xgHome > fixture.xgAway * 1.5) {
        items.push({ text: `${fixture.homeTeam.name} significantly outperforming on xG`, type: 'primary' })
      } else if (fixture.xgAway > fixture.xgHome * 1.5) {
        items.push({ text: `${fixture.awayTeam.name} significantly outperforming on xG`, type: 'primary' })
      }
    }

    // Form based insights
    const homeWins = teamForm.home.filter(r => r === 'W').length
    const awayWins = teamForm.away.filter(r => r === 'W').length
    if (homeWins >= 4) {
      items.push({ text: `${fixture.homeTeam.name} in excellent form (${homeWins} wins in last 5)`, type: 'primary' })
    }
    if (awayWins >= 4) {
      items.push({ text: `${fixture.awayTeam.name} in excellent form (${awayWins} wins in last 5)`, type: 'primary' })
    }
    const homeLosses = teamForm.home.filter(r => r === 'L').length
    const awayLosses = teamForm.away.filter(r => r === 'L').length
    if (homeLosses >= 3) {
      items.push({ text: `${fixture.homeTeam.name} struggling (${homeLosses} losses in last 5)`, type: 'warning' })
    }
    if (awayLosses >= 3) {
      items.push({ text: `${fixture.awayTeam.name} struggling (${awayLosses} losses in last 5)`, type: 'warning' })
    }

    // Probability based
    if (probsOU.over > 0.65) {
      items.push({ text: `Model suggests ${(probsOU.over * 100).toFixed(0)}% chance of Over 2.5 goals`, type: 'primary' })
    }
    if (probs1X2.draw > 0.30) {
      items.push({ text: `Higher than average draw probability (${(probs1X2.draw * 100).toFixed(0)}%)`, type: 'warning' })
    }

    return items.slice(0, 5) // Max 5 insights
  }, [fixture, teamForm, probs1X2, probsOU])

  return (
    <div className="p-4 space-y-4">
      {/* Match Events Timeline (for finished/live matches) */}
      {(fixture.isFinished || fixture.statusShort?.includes('H')) && events.length > 0 && (
        <div className="stat-card">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-warning" />
            Match Timeline
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.filter((e: any) => e.type === 'Goal' || e.type === 'Card').map((event: any, i: number) => (
              <div 
                key={i}
                className={cn(
                  "flex items-center gap-3 text-sm p-2 rounded",
                  event.teamId === fixture.homeTeam.id ? "bg-accent-primary/10" : "bg-accent-purple/10"
                )}
              >
                <span className="text-xs text-text-muted w-8 text-right font-mono">
                  {event.time}'
                  {event.extraTime && <span>+{event.extraTime}</span>}
                </span>
                {event.type === 'Goal' && (
                  <>
                    <Circle className="w-4 h-4 text-accent-success fill-accent-success" />
                    <span className="font-medium">{event.playerName}</span>
                    {event.assistName && (
                      <span className="text-text-muted text-xs">
                        (assist: {event.assistName})
                      </span>
                    )}
                  </>
                )}
                {event.type === 'Card' && (
                  <>
                    <div className={cn(
                      "w-3 h-4 rounded-sm",
                      event.detail === 'Yellow Card' && "bg-yellow-400",
                      event.detail === 'Red Card' && "bg-red-500",
                      event.detail === 'Second Yellow card' && "bg-yellow-400 border-2 border-red-500",
                    )} />
                    <span>{event.playerName}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Probability Summary Card */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-primary" />
            Expected Outcome
          </h4>
          <span className="text-[10px] text-text-muted bg-terminal-elevated px-2 py-0.5 rounded">
            Poisson Model
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <ProbabilityBar 
            label={fixture.homeTeam.name.split(' ')[0]}
            probability={probs1X2.home}
            color="success"
          />
          <ProbabilityBar 
            label="Draw"
            probability={probs1X2.draw}
            color="neutral"
          />
          <ProbabilityBar 
            label={fixture.awayTeam.name.split(' ')[0]}
            probability={probs1X2.away}
            color="danger"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-terminal-border/50">
          <div className="text-center">
            <div className="text-sm font-semibold text-accent-success">
              {(probsOU.over * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-text-muted">Over 2.5</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-accent-danger">
              {(probsOU.under * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-text-muted">Under 2.5</div>
          </div>
        </div>
      </div>

      {/* Form Comparison */}
      <div className="stat-card">
        <h4 className="text-sm font-semibold mb-3">Recent Form (Last 5)</h4>
        <div className="space-y-3">
          <FormRow 
            teamName={fixture.homeTeam.name}
            teamLogo={fixture.homeTeam.logo}
            form={teamForm.home}
            isHome
          />
          <FormRow 
            teamName={fixture.awayTeam.name}
            teamLogo={fixture.awayTeam.logo}
            form={teamForm.away}
          />
        </div>
      </div>

      {/* What to Watch */}
      {insights.length > 0 && (
        <div className="stat-card">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-purple" />
            Key Insights
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={cn(
                  "mt-0.5",
                  insight.type === 'primary' && "text-accent-primary",
                  insight.type === 'warning' && "text-accent-warning",
                  insight.type === 'danger' && "text-accent-danger",
                )}>•</span>
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scoreline Prediction */}
      <div className="stat-card">
        <h4 className="text-sm font-semibold mb-3">Most Likely Scorelines</h4>
        <div className="grid grid-cols-3 gap-2">
          {getMostLikelyScorelines(lambdaHome, lambdaAway).slice(0, 6).map((score, i) => (
            <div 
              key={i}
              className={cn(
                "p-2 rounded text-center",
                i === 0 ? "bg-accent-primary/20 border border-accent-primary/30" : "bg-terminal-elevated"
              )}
            >
              <div className="text-lg font-bold">{score.home}-{score.away}</div>
              <div className="text-[10px] text-text-muted">{(score.prob * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Credibility */}
      <div className="stat-card border-accent-primary/20">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Data Credibility
          </h4>
          <div className="flex items-center gap-2">
            <CredibilityIndicator 
              label="Form" 
              level={homeFormData && awayFormData ? "high" : "low"} 
            />
            <CredibilityIndicator 
              label="xG" 
              level={fixture.xgHome !== null ? "high" : "medium"} 
            />
            <CredibilityIndicator 
              label="Events" 
              level={events.length > 0 ? "high" : fixture.isUpcoming ? "medium" : "low"} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate most likely scorelines
function getMostLikelyScorelines(lambdaHome: number, lambdaAway: number) {
  const scorelines: { home: number; away: number; prob: number }[] = []
  
  const poisson = (lambda: number, k: number) => {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
  }
  
  const factorial = (n: number): number => {
    if (n <= 1) return 1
    return n * factorial(n - 1)
  }

  for (let home = 0; home <= 5; home++) {
    for (let away = 0; away <= 5; away++) {
      const prob = poisson(lambdaHome, home) * poisson(lambdaAway, away)
      scorelines.push({ home, away, prob })
    }
  }

  return scorelines.sort((a, b) => b.prob - a.prob)
}

interface ProbabilityBarProps {
  label: string
  probability: number
  color: 'success' | 'danger' | 'neutral'
}

function ProbabilityBar({ label, probability, color }: ProbabilityBarProps) {
  const colorClasses = {
    success: 'bg-accent-success',
    danger: 'bg-accent-danger', 
    neutral: 'bg-terminal-muted',
  }

  return (
    <div className="text-center">
      <div className="text-lg font-bold mb-1">
        {(probability * 100).toFixed(0)}%
      </div>
      <div className="h-1.5 bg-terminal-elevated rounded-full overflow-hidden mb-1">
        <div 
          className={cn("h-full rounded-full transition-all", colorClasses[color])}
          style={{ width: `${probability * 100}%` }}
        />
      </div>
      <div className="text-[10px] text-text-muted truncate">{label}</div>
    </div>
  )
}

interface FormRowProps {
  teamName: string
  teamLogo?: string | null
  form: string[]
  isHome?: boolean
}

function FormRow({ teamName, teamLogo, form, isHome }: FormRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {teamLogo ? (
          <img src={teamLogo} alt="" className="w-5 h-5 object-contain" />
        ) : (
          <Shield className="w-4 h-4 text-text-muted" />
        )}
        <span className="text-sm truncate max-w-[120px]">{teamName}</span>
        {isHome && (
          <span className="text-[10px] px-1.5 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
            HOME
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {form.map((result, i) => (
          <div
            key={i}
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
              result === '?' ? "bg-terminal-elevated text-text-muted" : "text-terminal-bg",
              result !== '?' && getFormColor(result)
            )}
          >
            {result}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CredibilityIndicatorProps {
  label: string
  level: 'high' | 'medium' | 'low'
}

function CredibilityIndicator({ label, level }: CredibilityIndicatorProps) {
  const colors = {
    high: 'bg-accent-success',
    medium: 'bg-accent-warning',
    low: 'bg-accent-danger',
  }

  return (
    <div className="flex items-center gap-1">
      <div className={cn("w-2 h-2 rounded-full", colors[level])} />
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  )
}
