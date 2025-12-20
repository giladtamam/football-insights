import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Bookmark, Target } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAppStore } from '../lib/store'
import { AlertsPanel } from './AlertsPanel'
import { SavedScreens } from './SavedScreens'
import { SelectionTracker } from './SelectionTracker'

type V2Tab = 'alerts' | 'screens' | 'tracker'

const V2_TABS: { id: V2Tab; label: string; icon: typeof Bell }[] = [
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'screens', label: 'Screens', icon: Bookmark },
  { id: 'tracker', label: 'Tracker', icon: Target },
]

export function V2Panel() {
  const { showV2Panel, setShowV2Panel } = useAppStore()

  if (!showV2Panel) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end"
        onClick={() => setShowV2Panel(null)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md h-full bg-terminal-bg border-l border-terminal-border flex flex-col shadow-2xl"
        >
          {/* Header with tabs */}
          <div className="border-b border-terminal-border">
            <div className="p-3 flex items-center justify-between">
              <h2 className="text-sm font-bold font-display">V2 Features</h2>
              <button
                onClick={() => setShowV2Panel(null)}
                className="p-1.5 rounded hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex px-3 pb-2 gap-1">
              {V2_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setShowV2Panel(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    showV2Panel === tab.id
                      ? "bg-accent-primary text-white"
                      : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showV2Panel === 'alerts' && <AlertsPanel />}
            {showV2Panel === 'screens' && <SavedScreens />}
            {showV2Panel === 'tracker' && <SelectionTracker />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

