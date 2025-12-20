import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Calendar,
  Radio,
  History,
  Trophy,
  TrendingUp,
  Sparkles,
  Command,
  ArrowRight,
  Settings,
  Clock,
  Star,
  X,
} from 'lucide-react'
import { useAppStore, TOP_LEAGUES } from '../lib/store'
import { cn } from '../lib/utils'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: typeof Search
  action: () => void
  shortcut?: string
  category: 'navigation' | 'league' | 'settings' | 'action'
}

export function CommandPalette() {
  const { 
    showCommandPalette, 
    setShowCommandPalette,
    setSelectedLeague,
    setActiveTab,
    setShowResponsibleGamblingModal,
    favoriteLeagueIds,
  } = useAppStore()
  
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: CommandItem[] = useMemo(() => [
    // Navigation commands
    {
      id: 'nav-fixtures',
      label: 'Go to Fixtures',
      description: 'View today\'s fixtures',
      icon: Calendar,
      action: () => setActiveTab('fixtures'),
      shortcut: '1',
      category: 'navigation',
    },
    {
      id: 'nav-live',
      label: 'Go to Live Matches',
      description: 'View live matches',
      icon: Radio,
      action: () => setActiveTab('live'),
      shortcut: '2',
      category: 'navigation',
    },
    {
      id: 'nav-results',
      label: 'Go to Results',
      description: 'View finished matches',
      icon: History,
      action: () => setActiveTab('results'),
      shortcut: '3',
      category: 'navigation',
    },
    {
      id: 'nav-standings',
      label: 'Go to Standings',
      description: 'View league table',
      icon: Trophy,
      action: () => setActiveTab('standings'),
      shortcut: '4',
      category: 'navigation',
    },
    {
      id: 'nav-odds',
      label: 'Go to Odds',
      description: 'View betting odds',
      icon: TrendingUp,
      action: () => setActiveTab('odds'),
      shortcut: '5',
      category: 'navigation',
    },
    // League commands
    ...TOP_LEAGUES.map(league => ({
      id: `league-${league.id}`,
      label: league.name,
      description: league.country,
      icon: favoriteLeagueIds.includes(league.id) ? Star : Trophy,
      action: () => setSelectedLeague(league.id),
      category: 'league' as const,
    })),
    // Settings/Actions
    {
      id: 'action-responsible',
      label: 'Responsible Gambling',
      description: 'View session time and controls',
      icon: Clock,
      action: () => setShowResponsibleGamblingModal(true),
      category: 'action',
    },
  ], [favoriteLeagueIds, setActiveTab, setSelectedLeague, setShowResponsibleGamblingModal])

  const filteredCommands = useMemo(() => {
    if (!query) return commands
    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery)
    )
  }, [commands, query])

  useEffect(() => {
    if (showCommandPalette) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [showCommandPalette])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          setShowCommandPalette(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowCommandPalette(false)
        break
    }
  }

  const executeCommand = (cmd: CommandItem) => {
    cmd.action()
    setShowCommandPalette(false)
  }

  if (!showCommandPalette) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-terminal-bg/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
        onClick={() => setShowCommandPalette(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg bg-terminal-surface border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-terminal-border">
            <Search className="w-5 h-5 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, leagues, actions..."
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-sm"
            />
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <kbd className="px-1.5 py-0.5 bg-terminal-elevated rounded">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-terminal-elevated rounded">K</kbd>
            </div>
            <button
              onClick={() => setShowCommandPalette(false)}
              className="p-1 hover:bg-terminal-elevated rounded"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found</p>
              </div>
            ) : (
              <div className="p-2">
                {/* Group by category */}
                {['navigation', 'league', 'action'].map(category => {
                  const categoryCommands = filteredCommands.filter(c => c.category === category)
                  if (categoryCommands.length === 0) return null
                  
                  return (
                    <div key={category} className="mb-2 last:mb-0">
                      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted">
                        {category === 'navigation' && 'Navigation'}
                        {category === 'league' && 'Leagues'}
                        {category === 'action' && 'Actions'}
                      </div>
                      {categoryCommands.map((cmd) => {
                        const globalIndex = filteredCommands.indexOf(cmd)
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => executeCommand(cmd)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                              globalIndex === selectedIndex
                                ? "bg-accent-primary/20 text-text-primary"
                                : "hover:bg-terminal-elevated text-text-secondary"
                            )}
                          >
                            <cmd.icon className={cn(
                              "w-4 h-4",
                              globalIndex === selectedIndex ? "text-accent-primary" : "text-text-muted"
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{cmd.label}</div>
                              {cmd.description && (
                                <div className="text-xs text-text-muted truncate">{cmd.description}</div>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <kbd className="px-1.5 py-0.5 text-[10px] bg-terminal-elevated rounded text-text-muted">
                                {cmd.shortcut}
                              </kbd>
                            )}
                            <ArrowRight className={cn(
                              "w-4 h-4 transition-transform",
                              globalIndex === selectedIndex ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                            )} />
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-terminal-border flex items-center justify-between text-[10px] text-text-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 bg-terminal-elevated rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 bg-terminal-elevated rounded">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 bg-terminal-elevated rounded">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

