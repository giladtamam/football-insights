import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Users,
  TrendingUp,
  Clock,
  Zap,
  X,
  Check,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { GET_ALERTS, CREATE_ALERT, DELETE_ALERT, TOGGLE_ALERT } from '../graphql/queries'
import { TOP_LEAGUES } from '../lib/store'

type AlertType = 'lineup' | 'odds_move' | 'value' | 'kickoff'

interface Alert {
  id: number
  type: string
  config: {
    fixtureId?: number
    teamId?: number
    leagueId?: number
    threshold?: number
    market?: string
    minutesBefore?: number
  }
  isActive: boolean
  lastTriggered?: string
  createdAt: string
}

const ALERT_TYPES: { id: AlertType; label: string; icon: typeof Bell; description: string }[] = [
  { id: 'lineup', label: 'Lineup Changes', icon: Users, description: 'Get notified when lineups are announced' },
  { id: 'odds_move', label: 'Odds Movement', icon: TrendingUp, description: 'Alert when odds move by threshold %' },
  { id: 'value', label: 'Value Found', icon: Zap, description: 'Alert when model finds value bet' },
  { id: 'kickoff', label: 'Kickoff Reminder', icon: Clock, description: 'Reminder before match starts' },
]

export function AlertsPanel() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedType, setSelectedType] = useState<AlertType>('lineup')
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [threshold, setThreshold] = useState(5)
  const [minutesBefore, setMinutesBefore] = useState(30)
  const [market, setMarket] = useState('1X2')

  const { data, loading, refetch } = useQuery(GET_ALERTS)
  const [createAlert, { loading: creating }] = useMutation(CREATE_ALERT)
  const [deleteAlert] = useMutation(DELETE_ALERT)
  const [toggleAlert] = useMutation(TOGGLE_ALERT)

  const alerts: Alert[] = data?.alerts || []

  const handleCreate = async () => {
    const config: Record<string, unknown> = {}
    
    if (selectedLeague) config.leagueId = selectedLeague
    if (selectedType === 'odds_move') {
      config.threshold = threshold
      config.market = market
    }
    if (selectedType === 'kickoff') {
      config.minutesBefore = minutesBefore
    }

    await createAlert({
      variables: {
        type: selectedType,
        config,
      },
    })
    
    refetch()
    setShowCreateModal(false)
    resetForm()
  }

  const handleDelete = async (id: number) => {
    await deleteAlert({ variables: { id } })
    refetch()
  }

  const handleToggle = async (id: number) => {
    await toggleAlert({ variables: { id } })
    refetch()
  }

  const resetForm = () => {
    setSelectedType('lineup')
    setSelectedLeague(null)
    setThreshold(5)
    setMinutesBefore(30)
    setMarket('1X2')
  }

  const getAlertIcon = (type: string) => {
    const alertType = ALERT_TYPES.find(t => t.id === type)
    return alertType?.icon || Bell
  }

  const getAlertDescription = (alert: Alert) => {
    const league = TOP_LEAGUES.find(l => l.id === alert.config.leagueId)
    const leagueName = league?.name || 'All Leagues'
    
    switch (alert.type) {
      case 'lineup':
        return `Lineup changes for ${leagueName}`
      case 'odds_move':
        return `${alert.config.market || '1X2'} odds move ≥${alert.config.threshold || 5}% in ${leagueName}`
      case 'value':
        return `Value bets found in ${leagueName}`
      case 'kickoff':
        return `${alert.config.minutesBefore || 30}min before kickoff in ${leagueName}`
      default:
        return 'Custom alert'
    }
  }

  return (
    <div className="h-full flex flex-col bg-terminal-bg">
      {/* Header */}
      <div className="p-4 border-b border-terminal-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent-primary" />
            Alerts
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New Alert
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Get notified about lineup changes, odds movements, and more.
        </p>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <BellOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No alerts configured</p>
            <p className="text-xs mt-1">Create an alert to get started</p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type)
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    alert.isActive
                      ? "bg-surface-card border-terminal-border"
                      : "bg-surface-card/50 border-terminal-border/50 opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      alert.isActive ? "bg-accent-primary/20" : "bg-surface-hover"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        alert.isActive ? "text-accent-primary" : "text-text-muted"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">
                          {alert.type.replace('_', ' ')}
                        </span>
                        {alert.isActive && (
                          <span className="badge-live text-[10px] px-1.5">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {getAlertDescription(alert)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(alert.id)}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          alert.isActive
                            ? "text-accent-success hover:bg-accent-success/20"
                            : "text-text-muted hover:bg-surface-hover"
                        )}
                        title={alert.isActive ? 'Disable' : 'Enable'}
                      >
                        {alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-1.5 rounded text-text-muted hover:text-accent-error hover:bg-accent-error/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-card border border-terminal-border rounded-xl w-full max-w-md shadow-2xl"
            >
              <div className="p-4 border-b border-terminal-border flex items-center justify-between">
                <h3 className="font-semibold">Create Alert</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded hover:bg-surface-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Alert Type */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Alert Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALERT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          selectedType === type.id
                            ? "border-accent-primary bg-accent-primary/10"
                            : "border-terminal-border hover:border-text-muted"
                        )}
                      >
                        <type.icon className={cn(
                          "w-4 h-4 mb-1",
                          selectedType === type.id ? "text-accent-primary" : "text-text-muted"
                        )} />
                        <div className="text-sm font-medium">{type.label}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* League Selection */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">League (optional)</label>
                  <div className="relative">
                    <select
                      value={selectedLeague || ''}
                      onChange={(e) => setSelectedLeague(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">All Leagues</option>
                      {TOP_LEAGUES.map((league) => (
                        <option key={league.id} value={league.id}>
                          {league.flag} {league.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Conditional fields */}
                {selectedType === 'odds_move' && (
                  <>
                    <div>
                      <label className="text-xs text-text-muted mb-2 block">
                        Movement Threshold: {threshold}%
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-full accent-accent-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-2 block">Market</label>
                      <select
                        value={market}
                        onChange={(e) => setMarket(e.target.value)}
                        className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="1X2">1X2</option>
                        <option value="O/U 2.5">Over/Under 2.5</option>
                        <option value="BTTS">Both Teams To Score</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedType === 'kickoff' && (
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">
                      Minutes before: {minutesBefore}min
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={minutesBefore}
                      onChange={(e) => setMinutesBefore(Number(e.target.value))}
                      className="w-full accent-accent-primary"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-terminal-border flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn bg-surface-hover hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Create Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

