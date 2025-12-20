import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Loader2,
  RefreshCw,
  Download,
  Copy,
  Check,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { GET_LIVE_STANDINGS } from '../graphql/queries'
import { useExport } from '../hooks/useExport'

interface StandingsTableProps {
  leagueId: number
  seasonId?: number
  compact?: boolean
  onTeamClick?: (teamId: number) => void
}

type SortKey = 'rank' | 'points' | 'goalsDiff' | 'goalsFor' | 'goalsAgainst' | 'played' | 'win' | 'draw' | 'lose' | 'form'

export function StandingsTable({ leagueId, compact = false, onTeamClick }: StandingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortAsc, setSortAsc] = useState(true)
  const [showFullTable, setShowFullTable] = useState(!compact)
  const [copied, setCopied] = useState(false)

  const { exportToCSV, copyToClipboard, exportStandings } = useExport()

  // Use live standings from API - season auto-detected by backend based on current date
  const { data, loading, error, refetch } = useQuery(GET_LIVE_STANDINGS, {
    variables: { leagueId }, // Let backend auto-detect current season
    fetchPolicy: 'network-only', // Always fetch fresh data from API
  })

  const standings = data?.liveStandings || []
  const leagueName = standings[0]?.team?.name ? 'League' : 'Standings'

  const handleExportCSV = () => {
    const exportData = exportStandings(standings, leagueName)
    exportToCSV(exportData)
  }

  const handleCopyToClipboard = async () => {
    const exportData = exportStandings(standings, leagueName)
    const success = await copyToClipboard(exportData)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sortedStandings = useMemo(() => {
    if (!standings.length) return []

    const sorted = [...standings].sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortKey) {
        case 'rank':
          aVal = a.rank
          bVal = b.rank
          break
        case 'points':
          aVal = a.points
          bVal = b.points
          break
        case 'goalsDiff':
          aVal = a.goalsDiff
          bVal = b.goalsDiff
          break
        case 'goalsFor':
          aVal = a.goalsFor
          bVal = b.goalsFor
          break
        case 'goalsAgainst':
          aVal = a.goalsAgainst
          bVal = b.goalsAgainst
          break
        case 'played':
          aVal = a.played
          bVal = b.played
          break
        case 'win':
          aVal = a.win
          bVal = b.win
          break
        case 'draw':
          aVal = a.draw
          bVal = b.draw
          break
        case 'lose':
          aVal = a.lose
          bVal = b.lose
          break
        case 'form':
          // Count recent wins
          aVal = (a.form || '').split('').filter((c: string) => c === 'W').length
          bVal = (b.form || '').split('').filter((c: string) => c === 'W').length
          break
      }

      if (sortAsc) {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    })

    return showFullTable ? sorted : sorted.slice(0, 6)
  }, [standings, sortKey, sortAsc, showFullTable])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(key === 'rank' || key === 'goalsAgainst' || key === 'lose')
    }
  }

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
        <span className="ml-2 text-text-secondary">Loading standings...</span>
      </div>
    )
  }

  if (error || standings.length === 0) {
    return (
      <div className="p-8 text-center">
        <Trophy className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">No Standings Available</h3>
        <p className="text-sm text-text-secondary mb-4">
          Standings data is not available for this league
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-terminal-elevated hover:bg-terminal-muted rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    )
  }

  const SortHeader = ({ label, sortKeyName, className }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <th
      className={cn(
        "px-2 py-2 text-left cursor-pointer hover:bg-terminal-elevated/50 transition-colors select-none",
        className
      )}
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {sortKey === sortKeyName && (
          sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  )

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent-warning" />
          League Table
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyToClipboard}
            className="p-1.5 text-text-muted hover:text-accent-primary transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-accent-success" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleExportCSV}
            className="p-1.5 text-text-muted hover:text-accent-primary transition-colors"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => refetch()}
            className="p-1.5 text-text-muted hover:text-accent-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-terminal-elevated/50 text-text-muted uppercase tracking-wider">
            <tr>
              <SortHeader label="#" sortKeyName="rank" className="w-8 text-center" />
              <th className="px-2 py-2 text-left">Team</th>
              <SortHeader label="P" sortKeyName="played" className="w-8 text-center" />
              <SortHeader label="W" sortKeyName="win" className="w-8 text-center hidden sm:table-cell" />
              <SortHeader label="D" sortKeyName="draw" className="w-8 text-center hidden sm:table-cell" />
              <SortHeader label="L" sortKeyName="lose" className="w-8 text-center hidden sm:table-cell" />
              <SortHeader label="GF" sortKeyName="goalsFor" className="w-10 text-center hidden md:table-cell" />
              <SortHeader label="GA" sortKeyName="goalsAgainst" className="w-10 text-center hidden md:table-cell" />
              <SortHeader label="GD" sortKeyName="goalsDiff" className="w-10 text-center" />
              <SortHeader label="Pts" sortKeyName="points" className="w-10 text-center font-bold" />
              <th className="px-2 py-2 text-center hidden lg:table-cell">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border/50">
            {sortedStandings.map((team: any) => (
              <tr
                key={`${team.rank}-${team.team.id}`}
                onClick={() => onTeamClick?.(team.team.id)}
                className={cn(
                  "hover:bg-terminal-elevated/50 transition-colors",
                  onTeamClick && "cursor-pointer",
                  // Highlight zones
                  team.rank <= 4 && "bg-accent-success/5 border-l-2 border-l-accent-success",
                  team.rank === 5 && "bg-accent-primary/5 border-l-2 border-l-accent-primary",
                  team.rank >= standings.length - 2 && "bg-accent-danger/5 border-l-2 border-l-accent-danger",
                )}
              >
                <td className="px-2 py-2 text-center font-mono">
                  <div className="flex items-center justify-center gap-1">
                    {team.rank < (team.previousRank || team.rank) && (
                      <ArrowUp className="w-3 h-3 text-accent-success" />
                    )}
                    {team.rank > (team.previousRank || team.rank) && (
                      <ArrowDown className="w-3 h-3 text-accent-danger" />
                    )}
                    <span className={cn(
                      team.rank <= 4 && "text-accent-success font-bold",
                      team.rank >= standings.length - 2 && "text-accent-danger",
                    )}>
                      {team.rank}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    {team.team.logo && (
                      <img src={team.team.logo} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span className="font-medium truncate max-w-[120px] sm:max-w-[150px]">
                      {team.team.name}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center text-text-secondary">{team.played}</td>
                <td className="px-2 py-2 text-center text-accent-success hidden sm:table-cell">{team.win}</td>
                <td className="px-2 py-2 text-center text-text-muted hidden sm:table-cell">{team.draw}</td>
                <td className="px-2 py-2 text-center text-accent-danger hidden sm:table-cell">{team.lose}</td>
                <td className="px-2 py-2 text-center hidden md:table-cell">{team.goalsFor}</td>
                <td className="px-2 py-2 text-center hidden md:table-cell">{team.goalsAgainst}</td>
                <td className={cn(
                  "px-2 py-2 text-center font-mono",
                  team.goalsDiff > 0 && "text-accent-success",
                  team.goalsDiff < 0 && "text-accent-danger",
                )}>
                  {team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff}
                </td>
                <td className="px-2 py-2 text-center font-bold text-lg">{team.points}</td>
                <td className="px-2 py-2 hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-0.5">
                    {(team.form || '').split('').slice(-5).map((result: string, i: number) => (
                      <div
                        key={i}
                        className={cn(
                          "w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold text-terminal-bg",
                          result === 'W' && "bg-accent-success",
                          result === 'D' && "bg-terminal-muted text-text-primary",
                          result === 'L' && "bg-accent-danger",
                        )}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More / Legend */}
      <div className="px-4 py-3 border-t border-terminal-border flex items-center justify-between">
        {compact && standings.length > 6 && (
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            className="text-xs text-accent-primary hover:underline"
          >
            {showFullTable ? 'Show less' : `Show all ${standings.length} teams`}
          </button>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-text-muted ml-auto">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-accent-success rounded-sm" />
            <span>Champions League</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-accent-primary rounded-sm" />
            <span>Europa League</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-accent-danger rounded-sm" />
            <span>Relegation</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact standings widget for sidebar
export function StandingsWidget({ leagueId }: { leagueId: number; seasonId?: number }) {
  const { data, loading } = useQuery(GET_LIVE_STANDINGS, {
    variables: { leagueId }, // Let backend auto-detect current season
  })

  const standings = data?.liveStandings?.slice(0, 5) || []

  if (loading) {
    return (
      <div className="stat-card p-3">
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
        </div>
      </div>
    )
  }

  if (standings.length === 0) return null

  return (
    <div className="stat-card overflow-hidden">
      <div className="px-3 py-2 border-b border-terminal-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent-warning" />
        <span className="text-xs font-semibold">Table</span>
      </div>
      <div className="divide-y divide-terminal-border/30">
        {standings.map((team: any) => (
          <div
            key={team.team.id}
            className="flex items-center gap-2 px-3 py-1.5 text-xs"
          >
            <span className={cn(
              "w-4 text-center font-mono",
              team.rank <= 4 && "text-accent-success font-bold",
            )}>
              {team.rank}
            </span>
            {team.team.logo && (
              <img src={team.team.logo} alt="" className="w-4 h-4 object-contain" />
            )}
            <span className="flex-1 truncate">{team.team.name}</span>
            <span className="font-bold">{team.points}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

