import { useState, useMemo } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  BarChart3,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  Calendar,
  Loader2,
  Trophy,
  XCircle,
  CircleDot,
} from 'lucide-react'
import { cn, formatOdds } from '../lib/utils'
import {
  GET_SELECTIONS,
  GET_SELECTION_STATS,
  CREATE_SELECTION,
  UPDATE_SELECTION,
  DELETE_SELECTION,
} from '../graphql/queries'

interface Selection {
  id: number
  fixtureId: number
  market: string
  selection: string
  odds: number
  openingOdds?: number
  closingOdds?: number
  stake?: number
  result?: string
  profit?: number
  createdAt: string
  fixture?: {
    id: number
    date: string
    homeTeam: { id: number; name: string; logo?: string }
    awayTeam: { id: number; name: string; logo?: string }
    goalsHome?: number
    goalsAway?: number
    statusShort: string
  }
}

interface SelectionStats {
  totalSelections: number
  wins: number
  losses: number
  pending: number
  winRate: number
  totalStaked: number
  totalProfit: number
  roi: number
}

type ResultFilter = 'all' | 'pending' | 'win' | 'lose'

export function SelectionTracker() {
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state for adding selection
  const [newSelection, setNewSelection] = useState({
    fixtureId: 0,
    market: '1X2',
    selection: 'home',
    odds: 2.0,
    stake: 10,
  })

  const { data: selectionsData, loading: selectionsLoading, refetch } = useQuery(GET_SELECTIONS, {
    variables: {
      result: resultFilter === 'all' ? undefined : resultFilter,
      limit: 50,
    },
  })

  const { data: statsData, loading: statsLoading } = useQuery(GET_SELECTION_STATS)

  const [createSelection, { loading: creating }] = useMutation(CREATE_SELECTION)
  const [updateSelection] = useMutation(UPDATE_SELECTION)
  const [deleteSelection] = useMutation(DELETE_SELECTION)

  const selections: Selection[] = selectionsData?.selections || []
  const stats: SelectionStats = statsData?.selectionStats || {
    totalSelections: 0,
    wins: 0,
    losses: 0,
    pending: 0,
    winRate: 0,
    totalStaked: 0,
    totalProfit: 0,
    roi: 0,
  }

  // Group selections by date
  const groupedSelections = useMemo(() => {
    const groups: Record<string, Selection[]> = {}
    selections.forEach((s) => {
      const date = new Date(s.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(s)
    })
    return groups
  }, [selections])

  const handleSettleSelection = async (id: number, result: 'win' | 'lose' | 'void') => {
    await updateSelection({
      variables: { id, result },
    })
    refetch()
  }

  const handleDeleteSelection = async (id: number) => {
    await deleteSelection({ variables: { id } })
    refetch()
  }

  const getResultIcon = (result?: string) => {
    switch (result) {
      case 'win':
      case 'half_win':
        return <Trophy className="w-4 h-4 text-accent-success" />
      case 'lose':
      case 'half_lose':
        return <XCircle className="w-4 h-4 text-accent-error" />
      case 'void':
        return <CircleDot className="w-4 h-4 text-text-muted" />
      default:
        return <Clock className="w-4 h-4 text-accent-warning" />
    }
  }

  const getSelectionLabel = (market: string, selection: string) => {
    if (market === '1X2') {
      if (selection === 'home') return 'Home Win'
      if (selection === 'draw') return 'Draw'
      if (selection === 'away') return 'Away Win'
    }
    if (market === 'O/U 2.5') {
      if (selection === 'over') return 'Over 2.5'
      if (selection === 'under') return 'Under 2.5'
    }
    if (market === 'BTTS') {
      if (selection === 'yes') return 'BTTS Yes'
      if (selection === 'no') return 'BTTS No'
    }
    return `${market}: ${selection}`
  }

  return (
    <div className="h-full flex flex-col bg-terminal-bg">
      {/* Header */}
      <div className="p-4 border-b border-terminal-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-primary" />
            Selection Tracker
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Selection
          </button>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-surface-card rounded-lg p-2 border border-terminal-border">
              <div className="text-[10px] text-text-muted uppercase tracking-wide">Win Rate</div>
              <div className={cn(
                "text-lg font-mono font-bold",
                stats.winRate >= 50 ? "text-accent-success" : "text-accent-error"
              )}>
                {stats.winRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-text-muted">
                {stats.wins}W / {stats.losses}L
              </div>
            </div>

            <div className="bg-surface-card rounded-lg p-2 border border-terminal-border">
              <div className="text-[10px] text-text-muted uppercase tracking-wide">P&L</div>
              <div className={cn(
                "text-lg font-mono font-bold",
                stats.totalProfit >= 0 ? "text-accent-success" : "text-accent-error"
              )}>
                {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
              </div>
              <div className="text-[10px] text-text-muted">
                Staked: {stats.totalStaked.toFixed(0)}
              </div>
            </div>

            <div className="bg-surface-card rounded-lg p-2 border border-terminal-border">
              <div className="text-[10px] text-text-muted uppercase tracking-wide">ROI</div>
              <div className={cn(
                "text-lg font-mono font-bold",
                stats.roi >= 0 ? "text-accent-success" : "text-accent-error"
              )}>
                {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
              </div>
              <div className="text-[10px] text-text-muted">
                Return on Investment
              </div>
            </div>

            <div className="bg-surface-card rounded-lg p-2 border border-terminal-border">
              <div className="text-[10px] text-text-muted uppercase tracking-wide">Pending</div>
              <div className="text-lg font-mono font-bold text-accent-warning">
                {stats.pending}
              </div>
              <div className="text-[10px] text-text-muted">
                Open selections
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-terminal-border flex gap-1">
        {(['all', 'pending', 'win', 'lose'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setResultFilter(filter)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg transition-colors capitalize",
              resultFilter === filter
                ? "bg-accent-primary text-white"
                : "text-text-muted hover:bg-surface-hover"
            )}
          >
            {filter === 'all' ? 'All' : filter}
          </button>
        ))}
      </div>

      {/* Selections List */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : selections.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No selections found</p>
            <p className="text-xs mt-1">Start tracking your bets</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSelections).map(([date, daySelections]) => (
              <div key={date}>
                <div className="text-xs text-text-muted mb-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {date}
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {daySelections.map((selection) => (
                      <motion.div
                        key={selection.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-surface-card rounded-lg border border-terminal-border p-3"
                      >
                        <div className="flex items-start gap-3">
                          {/* Result Icon */}
                          <div className={cn(
                            "p-2 rounded-lg",
                            selection.result === 'win' && "bg-accent-success/20",
                            selection.result === 'lose' && "bg-accent-error/20",
                            selection.result === 'pending' && "bg-accent-warning/20",
                            !selection.result && "bg-surface-hover"
                          )}>
                            {getResultIcon(selection.result)}
                          </div>

                          {/* Selection Details */}
                          <div className="flex-1 min-w-0">
                            {selection.fixture ? (
                              <div className="text-sm font-medium mb-0.5">
                                {selection.fixture.homeTeam.name} vs {selection.fixture.awayTeam.name}
                              </div>
                            ) : (
                              <div className="text-sm font-medium mb-0.5 text-text-muted">
                                Fixture #{selection.fixtureId}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded">
                                {getSelectionLabel(selection.market, selection.selection)}
                              </span>
                              <span className="font-mono font-medium">
                                @ {formatOdds(selection.odds)}
                              </span>
                              {selection.stake && (
                                <span className="text-text-muted">
                                  £{selection.stake.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Profit/Actions */}
                          <div className="text-right">
                            {selection.result && selection.result !== 'pending' ? (
                              <div className={cn(
                                "text-sm font-mono font-bold",
                                selection.profit && selection.profit >= 0 ? "text-accent-success" : "text-accent-error"
                              )}>
                                {selection.profit && selection.profit >= 0 ? '+' : ''}
                                {selection.profit?.toFixed(2) || '0.00'}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSettleSelection(selection.id, 'win')}
                                  className="p-1.5 rounded bg-accent-success/20 text-accent-success hover:bg-accent-success/30 transition-colors"
                                  title="Mark as Win"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleSettleSelection(selection.id, 'lose')}
                                  className="p-1.5 rounded bg-accent-error/20 text-accent-error hover:bg-accent-error/30 transition-colors"
                                  title="Mark as Loss"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSelection(selection.id)}
                                  className="p-1.5 rounded text-text-muted hover:bg-surface-hover transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Selection Modal - simplified for now */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-card border border-terminal-border rounded-xl w-full max-w-md shadow-2xl"
            >
              <div className="p-4 border-b border-terminal-border flex items-center justify-between">
                <h3 className="font-semibold">Add Selection</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded hover:bg-surface-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Fixture ID</label>
                  <input
                    type="number"
                    value={newSelection.fixtureId || ''}
                    onChange={(e) => setNewSelection({ ...newSelection, fixtureId: Number(e.target.value) })}
                    className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm"
                    placeholder="Enter fixture ID"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Market</label>
                    <select
                      value={newSelection.market}
                      onChange={(e) => setNewSelection({ ...newSelection, market: e.target.value })}
                      className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="1X2">1X2</option>
                      <option value="O/U 2.5">Over/Under 2.5</option>
                      <option value="BTTS">Both Teams To Score</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Selection</label>
                    <select
                      value={newSelection.selection}
                      onChange={(e) => setNewSelection({ ...newSelection, selection: e.target.value })}
                      className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm"
                    >
                      {newSelection.market === '1X2' && (
                        <>
                          <option value="home">Home Win</option>
                          <option value="draw">Draw</option>
                          <option value="away">Away Win</option>
                        </>
                      )}
                      {newSelection.market === 'O/U 2.5' && (
                        <>
                          <option value="over">Over 2.5</option>
                          <option value="under">Under 2.5</option>
                        </>
                      )}
                      {newSelection.market === 'BTTS' && (
                        <>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newSelection.odds}
                      onChange={(e) => setNewSelection({ ...newSelection, odds: Number(e.target.value) })}
                      className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Stake (£)</label>
                    <input
                      type="number"
                      value={newSelection.stake}
                      onChange={(e) => setNewSelection({ ...newSelection, stake: Number(e.target.value) })}
                      className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-terminal-border flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn bg-surface-hover hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await createSelection({
                      variables: newSelection,
                    })
                    refetch()
                    setShowAddModal(false)
                  }}
                  disabled={creating || !newSelection.fixtureId}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Selection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

