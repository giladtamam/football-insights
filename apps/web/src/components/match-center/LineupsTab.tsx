import { useQuery } from '@apollo/client'
import { 
  Users,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { GET_FIXTURE_LINEUPS, GET_FIXTURE_EVENTS } from '../../graphql/queries'

interface LineupsTabProps {
  fixture: any
}

export function LineupsTab({ fixture }: LineupsTabProps) {
  const { data, loading, error, refetch } = useQuery(GET_FIXTURE_LINEUPS, {
    variables: { fixtureId: fixture.id },
    fetchPolicy: 'cache-and-network',
  })

  const { data: eventsData } = useQuery(GET_FIXTURE_EVENTS, {
    variables: { fixtureId: fixture.id },
  })

  const lineups = data?.fixtureLineups || []
  const events = eventsData?.fixtureEvents || []
  
  // Get substitution events
  const substitutions = events.filter((e: any) => e.type === 'subst')
  
  const homeLineup = lineups[0]
  const awayLineup = lineups[1]
  
  const isConfirmed = fixture.isFinished || fixture.statusShort === 'LIVE' || lineups.length > 0

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
        <span className="ml-2 text-text-secondary">Loading lineups...</span>
      </div>
    )
  }

  if (lineups.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="stat-card p-8 text-center">
          <HelpCircle className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Lineups Not Available</h3>
          <p className="text-sm text-text-secondary mb-4">
            {fixture.isUpcoming 
              ? "Lineups will be available closer to kick-off (usually 1 hour before)"
              : "Lineup data is not available for this fixture"}
          </p>
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terminal-elevated hover:bg-terminal-muted rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Check Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Lineup Status Banner */}
      <div className={cn(
        "p-3 rounded-lg flex items-center justify-between text-sm",
        isConfirmed 
          ? "bg-accent-success/20 text-accent-success"
          : "bg-accent-warning/20 text-accent-warning"
      )}>
        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Official lineups</span>
            </>
          ) : (
            <>
              <HelpCircle className="w-4 h-4" />
              <span>Predicted lineups</span>
            </>
          )}
        </div>
        <button 
          onClick={() => refetch()}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Formation Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-primary">{homeLineup?.formation || '-'}</div>
          <div className="text-xs text-text-muted">{fixture.homeTeam.name}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-secondary">{awayLineup?.formation || '-'}</div>
          <div className="text-xs text-text-muted">{fixture.awayTeam.name}</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Home Team */}
        {homeLineup && (
          <LineupColumn
            teamName={fixture.homeTeam.name}
            teamLogo={fixture.homeTeam.logo}
            lineup={homeLineup}
            substitutions={substitutions.filter((s: any) => s.teamId === fixture.homeTeam.id)}
            isHome
          />
        )}
        
        {/* Away Team */}
        {awayLineup && (
          <LineupColumn
            teamName={fixture.awayTeam.name}
            teamLogo={fixture.awayTeam.logo}
            lineup={awayLineup}
            substitutions={substitutions.filter((s: any) => s.teamId === fixture.awayTeam.id)}
          />
        )}
      </div>

      {/* Coach Info */}
      {(homeLineup?.coach || awayLineup?.coach) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card p-3">
            <div className="text-[10px] text-text-muted uppercase mb-1">Manager</div>
            <div className="flex items-center gap-2">
              {homeLineup?.coach?.photo && (
                <img 
                  src={homeLineup.coach.photo} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="text-sm font-medium">{homeLineup?.coach?.name || 'Unknown'}</span>
            </div>
          </div>
          <div className="stat-card p-3">
            <div className="text-[10px] text-text-muted uppercase mb-1">Manager</div>
            <div className="flex items-center gap-2">
              {awayLineup?.coach?.photo && (
                <img 
                  src={awayLineup.coach.photo} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="text-sm font-medium">{awayLineup?.coach?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface LineupColumnProps {
  teamName: string
  teamLogo: string | null
  lineup: {
    formation: string
    startXI: Array<{ id: number; name: string; number: number; pos: string }>
    substitutes: Array<{ id: number; name: string; number: number; pos: string }>
  }
  substitutions: Array<{ time: number; playerName: string; assistName: string }>
  isHome?: boolean
}

function LineupColumn({ teamName, teamLogo, lineup, substitutions, isHome }: LineupColumnProps) {
  // Map position codes to readable names
  const positionMap: Record<string, string> = {
    'G': 'GK',
    'D': 'DEF',
    'M': 'MID',
    'F': 'FWD',
  }

  return (
    <div className="space-y-3">
      {/* Team Header */}
      <div className="flex items-center gap-2">
        {teamLogo && (
          <img src={teamLogo} alt="" className="w-6 h-6 object-contain" />
        )}
        <h4 className="text-sm font-semibold">{teamName}</h4>
      </div>

      {/* Starting XI */}
      <div className="stat-card p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Starting XI</span>
          <Users className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div className="space-y-1">
          {lineup.startXI.map((player, i) => {
            const subbed = substitutions.find(s => s.playerName === player.name)
            return (
              <div key={i} className={cn(
                "flex items-center gap-2 text-xs",
                subbed && "text-text-muted line-through"
              )}>
                <span className="w-5 text-text-muted text-right font-mono">{player.number}</span>
                <span className="flex-1 truncate">{player.name}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  player.pos === 'G' && "bg-accent-warning/20 text-accent-warning",
                  player.pos === 'D' && "bg-accent-primary/20 text-accent-primary",
                  player.pos === 'M' && "bg-accent-success/20 text-accent-success",
                  player.pos === 'F' && "bg-accent-danger/20 text-accent-danger",
                )}>
                  {positionMap[player.pos] || player.pos}
                </span>
                {subbed && (
                  <span className="text-[10px] text-accent-danger">{subbed.time}'</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Substitutes */}
      <div className="stat-card p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Substitutes</span>
        </div>
        <div className="space-y-1">
          {lineup.substitutes.map((player, i) => {
            const cameOn = substitutions.find(s => s.assistName === player.name)
            return (
              <div key={i} className={cn(
                "flex items-center gap-2 text-xs",
                cameOn ? "text-text-primary" : "text-text-secondary"
              )}>
                <span className="w-5 text-text-muted text-right font-mono">{player.number}</span>
                <span className="flex-1 truncate">{player.name}</span>
                <span className="text-[10px] text-text-muted">
                  {positionMap[player.pos] || player.pos}
                </span>
                {cameOn && (
                  <span className="text-[10px] text-accent-success">{cameOn.time}'</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Substitutions Made */}
      {substitutions.length > 0 && (
        <div className="stat-card p-2 border-accent-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-accent-primary uppercase tracking-wider">
              Substitutions ({substitutions.length})
            </span>
          </div>
          <div className="space-y-1">
            {substitutions.map((sub: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-text-muted w-6">{sub.time}'</span>
                <span className="text-accent-success">↑ {sub.assistName}</span>
                <span className="text-text-muted mx-1">for</span>
                <span className="text-accent-danger">↓ {sub.playerName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
