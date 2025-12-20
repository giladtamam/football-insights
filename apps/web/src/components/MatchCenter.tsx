import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@apollo/client'
import { 
  X,
  Clock,
  MapPin,
  User,
  Users,
  BarChart3,
  Target,
  TrendingUp,
  Calculator,
  FileText,
  History,
  ChevronRight,
  AlertTriangle,
  Zap,
  Shield,
  Swords,
} from 'lucide-react'
import { GET_FIXTURE, GET_HEAD_TO_HEAD, GET_TEAM_FIXTURES } from '../graphql/queries'
import { useAppStore } from '../lib/store'
import { cn, formatDate, formatTime, getStatusText, isLiveStatus, getFormColor } from '../lib/utils'
import { OverviewTab } from './match-center/OverviewTab'
import { LineupsTab } from './match-center/LineupsTab'
import { StatsTab } from './match-center/StatsTab'
import { OddsTab } from './match-center/OddsTab'
import { ModelTab } from './match-center/ModelTab'
import { NotesTab } from './match-center/NotesTab'
import { H2HTab } from './match-center/H2HTab'

type Tab = 'overview' | 'lineups' | 'stats' | 'odds' | 'model' | 'notes' | 'h2h'

export function MatchCenter() {
  const { selectedFixtureId, setSelectedFixture } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data, loading, error } = useQuery(GET_FIXTURE, {
    variables: { id: selectedFixtureId },
    skip: !selectedFixtureId,
  })

  const fixture = data?.fixture

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'lineups', label: 'Lineups', icon: Users },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'odds', label: 'Odds', icon: TrendingUp },
    { id: 'model', label: 'Model', icon: Calculator },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'h2h', label: 'H2H', icon: History },
  ]

  if (!selectedFixtureId) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <Target className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">Select a Match</h3>
          <p className="text-sm text-text-muted">
            Click on a match to see detailed analysis
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full p-4 space-y-4">
        <div className="h-24 bg-terminal-elevated/50 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-terminal-elevated/30 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-terminal-elevated/30 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error || !fixture) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-accent-danger mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">Error loading match</h3>
          <p className="text-sm text-text-muted">
            {error?.message || 'Match not found'}
          </p>
        </div>
      </div>
    )
  }

  const isLive = isLiveStatus(fixture.statusShort)

  return (
    <div className="h-full flex flex-col bg-terminal-surface/30">
      {/* Match Header */}
      <div className="border-b border-terminal-border">
        {/* Close button and league info */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-border/50">
          <div className="flex items-center gap-2">
            {fixture.season.league.logo && (
              <img src={fixture.season.league.logo} alt="" className="w-5 h-5 object-contain" />
            )}
            <span className="text-xs text-text-secondary">
              {fixture.season.league.name}
            </span>
            <span className="text-xs text-text-muted">•</span>
            <span className="text-xs text-text-muted">{fixture.round}</span>
          </div>
          <button
            onClick={() => setSelectedFixture(null)}
            className="btn btn-ghost p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Teams and Score */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Home Team */}
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-3">
                <div>
                  <h3 className="text-lg font-bold">{fixture.homeTeam.name}</h3>
                  <p className="text-xs text-text-muted">Home</p>
                </div>
                {fixture.homeTeam.logo ? (
                  <img src={fixture.homeTeam.logo} alt="" className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-terminal-elevated flex items-center justify-center">
                    <Shield className="w-6 h-6 text-text-muted" />
                  </div>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="text-center px-6">
              {fixture.isUpcoming ? (
                <div className="text-2xl font-bold text-text-muted">vs</div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">{fixture.goalsHome ?? 0}</span>
                  <span className="text-text-muted">-</span>
                  <span className="text-3xl font-bold">{fixture.goalsAway ?? 0}</span>
                </div>
              )}
              {isLive ? (
                <span className="badge-live mt-2">
                  {getStatusText(fixture.statusShort, fixture.elapsed)}
                </span>
              ) : fixture.isFinished ? (
                <span className="text-xs text-text-muted mt-1 block">Full Time</span>
              ) : (
                <span className="text-xs text-accent-primary mt-1 block">
                  {formatTime(fixture.date)}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {fixture.awayTeam.logo ? (
                  <img src={fixture.awayTeam.logo} alt="" className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-terminal-elevated flex items-center justify-center">
                    <Shield className="w-6 h-6 text-text-muted" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold">{fixture.awayTeam.name}</h3>
                  <p className="text-xs text-text-muted">Away</p>
                </div>
              </div>
            </div>
          </div>

          {/* xG Display */}
          {(fixture.xgHome !== null || fixture.xgAway !== null) && (
            <div className="flex items-center justify-center gap-8 mt-3 pt-3 border-t border-terminal-border/50">
              <div className="text-center">
                <span className="text-lg font-semibold text-accent-primary">
                  {fixture.xgHome?.toFixed(2) ?? '-'}
                </span>
                <span className="text-xs text-text-muted ml-1">xG</span>
              </div>
              <Swords className="w-4 h-4 text-text-muted" />
              <div className="text-center">
                <span className="text-lg font-semibold text-accent-purple">
                  {fixture.xgAway?.toFixed(2) ?? '-'}
                </span>
                <span className="text-xs text-text-muted ml-1">xG</span>
              </div>
            </div>
          )}

          {/* Match Info */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(fixture.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            {fixture.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{fixture.venue}</span>
              </div>
            )}
            {fixture.referee && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{fixture.referee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-2 pb-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "tab flex items-center gap-1.5 whitespace-nowrap",
                activeTab === tab.id && "active"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'overview' && <OverviewTab fixture={fixture} />}
            {activeTab === 'lineups' && <LineupsTab fixture={fixture} />}
            {activeTab === 'stats' && <StatsTab fixture={fixture} />}
            {activeTab === 'odds' && <OddsTab fixture={fixture} />}
            {activeTab === 'model' && <ModelTab fixture={fixture} />}
            {activeTab === 'notes' && <NotesTab fixture={fixture} />}
            {activeTab === 'h2h' && <H2HTab fixture={fixture} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}


