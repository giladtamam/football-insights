import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Check, X, Database, Clock, Trophy, Users } from 'lucide-react'
import { SYNC_ALL, GET_SYNC_STATUS } from '../../graphql/sync'
import { cn } from '../../lib/utils'

interface SyncStatus {
  lastFixtureUpdate: string | null
  totalFixtures: number
  totalTeams: number
  totalLeagues: number
  fixturesLast24h: number
}

export function SyncButton() {
  const [showStatus, setShowStatus] = useState(false)
  
  const { data: statusData, refetch: refetchStatus } = useQuery<{ syncStatus: SyncStatus }>(GET_SYNC_STATUS, {
    pollInterval: 60000, // Refresh every minute
  })
  
  const [syncAll, { loading: syncing }] = useMutation(SYNC_ALL, {
    onCompleted: () => {
      refetchStatus()
    },
  })

  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSync = async () => {
    setLastResult(null)
    try {
      const { data } = await syncAll()
      if (data?.syncAll) {
        setLastResult({
          success: data.syncAll.success,
          message: data.syncAll.message,
        })
        // Clear result after 5 seconds
        setTimeout(() => setLastResult(null), 5000)
      }
    } catch (error: any) {
      setLastResult({
        success: false,
        message: error.message || 'Sync failed',
      })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const status = statusData?.syncStatus

  return (
    <div className="relative">
      <button
        onClick={() => setShowStatus(!showStatus)}
        className={cn(
          'btn btn-ghost p-2 relative',
          syncing && 'text-accent-primary'
        )}
        title="Data Sync"
      >
        <Database className={cn('w-5 h-5', syncing && 'animate-pulse')} />
        {status && status.fixturesLast24h > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-success rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 bg-terminal-bg border border-terminal-border rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-terminal-border">
              <h3 className="font-semibold text-sm">Data Sync Status</h3>
            </div>

            {/* Stats */}
            {status && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-accent-primary" />
                    <span className="text-text-muted">Leagues:</span>
                    <span className="font-medium">{status.totalLeagues}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-accent-purple" />
                    <span className="text-text-muted">Teams:</span>
                    <span className="font-medium">{status.totalTeams}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Database className="w-4 h-4 text-accent-success" />
                  <span className="text-text-muted">Total Fixtures:</span>
                  <span className="font-medium">{status.totalFixtures.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-accent-warning" />
                  <span className="text-text-muted">Last Update:</span>
                  <span className="font-medium">{formatDate(status.lastFixtureUpdate)}</span>
                </div>

                <div className="text-xs text-text-muted">
                  {status.fixturesLast24h} fixtures updated in last 24h
                </div>
              </div>
            )}

            {/* Result message */}
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    'px-4 py-2 text-sm flex items-start gap-2',
                    lastResult.success
                      ? 'bg-accent-success/10 text-accent-success'
                      : 'bg-accent-danger/10 text-accent-danger'
                  )}
                >
                  {lastResult.success ? (
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="line-clamp-2">{lastResult.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sync button */}
            <div className="p-4 border-t border-terminal-border">
              <button
                onClick={handleSync}
                disabled={syncing}
                className={cn(
                  'w-full py-2 px-4 rounded-lg font-medium text-sm transition-all',
                  'bg-accent-primary hover:bg-accent-primary/90 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
                {syncing ? 'Syncing...' : 'Sync All Leagues'}
              </button>
              <p className="text-xs text-text-muted mt-2 text-center">
                Updates fixtures from Football API
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

