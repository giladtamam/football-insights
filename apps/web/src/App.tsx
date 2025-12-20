import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from './lib/store'
import { Header } from './components/Header'
import { LeagueNavigator } from './components/LeagueNavigator'
import { MatchList } from './components/MatchList'
import { MatchCenter } from './components/MatchCenter'
import { CommandPalette } from './components/CommandPalette'
import { V2Panel } from './components/V2Panel'
import { 
  DisclaimerModal, 
  ResponsibleGamblingModal, 
  SessionWarningToast 
} from './components/ResponsibleGambling'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const { 
    hasSeenDisclaimer, 
    startSession,
    leftPanelCollapsed,
    rightPanelCollapsed,
    selectedFixtureId,
    showMatchCenter,
  } = useAppStore()

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  // Start session tracking
  useEffect(() => {
    if (hasSeenDisclaimer) {
      startSession()
    }
  }, [hasSeenDisclaimer, startSession])

  // Show match center when fixture is selected
  const shouldShowMatchCenter = showMatchCenter && selectedFixtureId && !rightPanelCollapsed

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Responsible Gambling Disclaimer Modal */}
      <DisclaimerModal />

      {/* Command Palette */}
      <CommandPalette />

      {/* Responsible Gambling Modal */}
      <ResponsibleGamblingModal />

      {/* V2 Features Panel */}
      <V2Panel />

      {/* Session Warning Toast */}
      <SessionWarningToast />

      {/* Header */}
      <Header />

      {/* Main Content - Three Panel Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - League Navigator */}
        <AnimatePresence mode="wait">
          {!leftPanelCollapsed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full border-r border-terminal-border flex-shrink-0 overflow-hidden hidden md:block"
            >
              <LeagueNavigator />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center Panel - Match List */}
        <section className="flex-1 min-w-0 h-full overflow-hidden border-r border-terminal-border">
          <MatchList />
        </section>

        {/* Right Panel - Match Center */}
        <AnimatePresence mode="wait">
          {shouldShowMatchCenter && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 480, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex-shrink-0 overflow-hidden hidden lg:block"
            >
              <MatchCenter />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Match Center Overlay */}
        <AnimatePresence>
          {shouldShowMatchCenter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-terminal-bg lg:hidden"
            >
              <MatchCenter />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
