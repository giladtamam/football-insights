import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  Bookmark,
  Play,
  Star,
} from 'lucide-react'
import { cn } from '../lib/utils'
import {
  GET_SAVED_SCREENS,
  CREATE_SAVED_SCREEN,
  UPDATE_SAVED_SCREEN,
  DELETE_SAVED_SCREEN,
} from '../graphql/queries'
import { useAppStore, TOP_LEAGUES } from '../lib/store'

interface SavedScreen {
  id: number
  name: string
  filters: {
    leagueIds?: number[]
    minOdds?: number
    maxOdds?: number
    minXgDiff?: number
    markets?: string[]
    formFilter?: string
    valueThreshold?: number
    timeWindow?: string
  }
  createdAt: string
  updatedAt: string
}

interface SavedScreensProps {
  onApplyScreen?: (filters: SavedScreen['filters']) => void
}

const FORM_FILTERS = [
  { id: 'good_home', label: 'Good Home Form' },
  { id: 'poor_home', label: 'Poor Home Form' },
  { id: 'good_away', label: 'Good Away Form' },
  { id: 'poor_away', label: 'Poor Away Form' },
  { id: 'xg_overperforming', label: 'xG Overperforming' },
  { id: 'xg_underperforming', label: 'xG Underperforming' },
]

const TIME_WINDOWS = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This Week' },
  { id: '48h', label: 'Next 48 Hours' },
]

export function SavedScreens({ onApplyScreen }: SavedScreensProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingScreen, setEditingScreen] = useState<SavedScreen | null>(null)

  // Form state
  const [screenName, setScreenName] = useState('')
  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([])
  const [minOdds, setMinOdds] = useState<number | undefined>()
  const [maxOdds, setMaxOdds] = useState<number | undefined>()
  const [valueThreshold, setValueThreshold] = useState<number | undefined>()
  const [formFilter, setFormFilter] = useState<string | undefined>()
  const [timeWindow, setTimeWindow] = useState<string>('today')

  const { setSelectedLeague, setActiveTab } = useAppStore()

  const { data, loading, refetch } = useQuery(GET_SAVED_SCREENS)
  const [createScreen, { loading: creating }] = useMutation(CREATE_SAVED_SCREEN)
  const [updateScreen, { loading: updating }] = useMutation(UPDATE_SAVED_SCREEN)
  const [deleteScreen] = useMutation(DELETE_SAVED_SCREEN)

  const screens: SavedScreen[] = data?.savedScreens || []

  const handleCreate = async () => {
    const filters: SavedScreen['filters'] = {
      timeWindow,
    }

    if (selectedLeagues.length > 0) filters.leagueIds = selectedLeagues
    if (minOdds !== undefined) filters.minOdds = minOdds
    if (maxOdds !== undefined) filters.maxOdds = maxOdds
    if (valueThreshold !== undefined) filters.valueThreshold = valueThreshold
    if (formFilter) filters.formFilter = formFilter

    await createScreen({
      variables: {
        name: screenName,
        filters,
      },
    })

    refetch()
    setShowCreateModal(false)
    resetForm()
  }

  const handleUpdate = async () => {
    if (!editingScreen) return

    const filters: SavedScreen['filters'] = {
      timeWindow,
    }

    if (selectedLeagues.length > 0) filters.leagueIds = selectedLeagues
    if (minOdds !== undefined) filters.minOdds = minOdds
    if (maxOdds !== undefined) filters.maxOdds = maxOdds
    if (valueThreshold !== undefined) filters.valueThreshold = valueThreshold
    if (formFilter) filters.formFilter = formFilter

    await updateScreen({
      variables: {
        id: editingScreen.id,
        name: screenName,
        filters,
      },
    })

    refetch()
    setEditingScreen(null)
    resetForm()
  }

  const handleDelete = async (id: number) => {
    await deleteScreen({ variables: { id } })
    refetch()
  }

  const handleApply = (screen: SavedScreen) => {
    // Apply the first league filter to the main view
    if (screen.filters.leagueIds?.length) {
      setSelectedLeague(screen.filters.leagueIds[0])
    }
    setActiveTab('fixtures')

    // Call parent callback if provided
    if (onApplyScreen) {
      onApplyScreen(screen.filters)
    }
  }

  const handleEdit = (screen: SavedScreen) => {
    setEditingScreen(screen)
    setScreenName(screen.name)
    setSelectedLeagues(screen.filters.leagueIds || [])
    setMinOdds(screen.filters.minOdds)
    setMaxOdds(screen.filters.maxOdds)
    setValueThreshold(screen.filters.valueThreshold)
    setFormFilter(screen.filters.formFilter)
    setTimeWindow(screen.filters.timeWindow || 'today')
  }

  const resetForm = () => {
    setScreenName('')
    setSelectedLeagues([])
    setMinOdds(undefined)
    setMaxOdds(undefined)
    setValueThreshold(undefined)
    setFormFilter(undefined)
    setTimeWindow('today')
  }

  const getFilterSummary = (filters: SavedScreen['filters']) => {
    const parts: string[] = []

    if (filters.leagueIds?.length) {
      const leagueNames = filters.leagueIds
        .map(id => TOP_LEAGUES.find(l => l.id === id)?.name)
        .filter(Boolean)
      parts.push(leagueNames.length > 2
        ? `${leagueNames.slice(0, 2).join(', ')} +${leagueNames.length - 2}`
        : leagueNames.join(', '))
    }

    if (filters.minOdds || filters.maxOdds) {
      const odds = filters.minOdds && filters.maxOdds
        ? `${filters.minOdds}-${filters.maxOdds}`
        : filters.minOdds
          ? `>${filters.minOdds}`
          : `<${filters.maxOdds}`
      parts.push(`Odds: ${odds}`)
    }

    if (filters.valueThreshold) {
      parts.push(`Value ≥${filters.valueThreshold}%`)
    }

    if (filters.formFilter) {
      const form = FORM_FILTERS.find(f => f.id === filters.formFilter)
      if (form) parts.push(form.label)
    }

    if (filters.timeWindow) {
      const time = TIME_WINDOWS.find(t => t.id === filters.timeWindow)
      if (time) parts.push(time.label)
    }

    return parts.length > 0 ? parts.join(' • ') : 'No filters'
  }

  const toggleLeague = (id: number) => {
    setSelectedLeagues(prev =>
      prev.includes(id)
        ? prev.filter(l => l !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="h-full flex flex-col bg-terminal-bg">
      {/* Header */}
      <div className="p-4 border-b border-terminal-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-accent-primary" />
            Saved Screens
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New Screen
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Save and load custom filter configurations for quick access.
        </p>
      </div>

      {/* Screens List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : screens.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No saved screens</p>
            <p className="text-xs mt-1">Create a screen to save filter presets</p>
          </div>
        ) : (
          <AnimatePresence>
            {screens.map((screen) => (
              <motion.div
                key={screen.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-3 rounded-lg border bg-surface-card border-terminal-border hover:border-accent-primary/50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent-primary/20">
                    <Star className="w-4 h-4 text-accent-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium mb-0.5">{screen.name}</div>
                    <p className="text-xs text-text-muted truncate">
                      {getFilterSummary(screen.filters)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleApply(screen)}
                      className="p-1.5 rounded bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors"
                      title="Apply Screen"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(screen)}
                      className="p-1.5 rounded text-text-muted hover:bg-surface-hover transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(screen.id)}
                      className="p-1.5 rounded text-text-muted hover:text-accent-error hover:bg-accent-error/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingScreen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowCreateModal(false)
              setEditingScreen(null)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-card border border-terminal-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-terminal-border flex items-center justify-between">
                <h3 className="font-semibold">
                  {editingScreen ? 'Edit Screen' : 'Create Screen'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingScreen(null)
                    resetForm()
                  }}
                  className="p-1 rounded hover:bg-surface-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Screen Name */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Screen Name</label>
                  <input
                    type="text"
                    value={screenName}
                    onChange={(e) => setScreenName(e.target.value)}
                    className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g., Big 5 Value Picks"
                  />
                </div>

                {/* League Selection */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Leagues</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {TOP_LEAGUES.map((league) => (
                      <button
                        key={league.id}
                        onClick={() => toggleLeague(league.id)}
                        className={cn(
                          "px-3 py-2 rounded-lg border text-xs text-left transition-all flex items-center gap-2",
                          selectedLeagues.includes(league.id)
                            ? "border-accent-primary bg-accent-primary/10"
                            : "border-terminal-border hover:border-text-muted"
                        )}
                      >
                        <span>{league.flag}</span>
                        <span className="truncate">{league.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Odds Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Min Odds</label>
                    <input
                      type="number"
                      step="0.1"
                      value={minOdds ?? ''}
                      onChange={(e) => setMinOdds(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono"
                      placeholder="1.50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Max Odds</label>
                    <input
                      type="number"
                      step="0.1"
                      value={maxOdds ?? ''}
                      onChange={(e) => setMaxOdds(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm font-mono"
                      placeholder="3.00"
                    />
                  </div>
                </div>

                {/* Value Threshold */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">
                    Min Value Edge: {valueThreshold ?? 0}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={valueThreshold ?? 0}
                    onChange={(e) => setValueThreshold(Number(e.target.value) || undefined)}
                    className="w-full accent-accent-primary"
                  />
                </div>

                {/* Form Filter */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Form Filter</label>
                  <select
                    value={formFilter || ''}
                    onChange={(e) => setFormFilter(e.target.value || undefined)}
                    className="w-full bg-surface-hover border border-terminal-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">No filter</option>
                    {FORM_FILTERS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Time Window */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Time Window</label>
                  <div className="flex gap-2">
                    {TIME_WINDOWS.map((tw) => (
                      <button
                        key={tw.id}
                        onClick={() => setTimeWindow(tw.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs transition-colors",
                          timeWindow === tw.id
                            ? "bg-accent-primary text-white"
                            : "bg-surface-hover text-text-muted hover:text-text-primary"
                        )}
                      >
                        {tw.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-terminal-border flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingScreen(null)
                    resetForm()
                  }}
                  className="flex-1 btn bg-surface-hover hover:bg-surface-card"
                >
                  Cancel
                </button>
                <button
                  onClick={editingScreen ? handleUpdate : handleCreate}
                  disabled={creating || updating || !screenName.trim()}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  {(creating || updating) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingScreen ? 'Update' : 'Create'} Screen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

