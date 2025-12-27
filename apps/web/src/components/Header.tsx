import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PanelLeftClose, 
  PanelRightClose, 
  Search, 
  Bell, 
  Settings,
  Zap,
  TrendingUp,
  Shield,
  Target,
  Layers,
} from 'lucide-react'
import { useAppStore } from '../lib/store'
import { cn } from '../lib/utils'
import { SessionTimer } from './ResponsibleGambling'
import { UserMenu, ProfileModal } from './auth'
import { SyncButton } from './admin/SyncButton'
import { useAuthStore } from '../lib/auth-store'

export function Header() {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { user } = useAuthStore()
  const { 
    toggleLeftPanel, 
    toggleRightPanel, 
    leftPanelCollapsed, 
    rightPanelCollapsed,
    selectedFixtureId,
    setShowCommandPalette,
    setShowResponsibleGamblingModal,
    setShowV2Panel,
    showV2Panel,
  } = useAppStore()

  return (
    <header className="h-14 border-b border-terminal-border glass flex items-center px-4 gap-4 relative z-50">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLeftPanel}
          className="btn btn-ghost p-2 hidden md:flex"
          title={leftPanelCollapsed ? 'Show leagues' : 'Hide leagues'}
        >
          <PanelLeftClose className={cn(
            "w-5 h-5 transition-transform",
            leftPanelCollapsed && "rotate-180"
          )} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-purple flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5 text-terminal-bg" />
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold font-display text-gradient">
              Football Insights
            </h1>
            <p className="text-[10px] text-text-muted -mt-0.5">
              Research Terminal
            </p>
          </div>
        </div>
      </div>

      {/* Center section - Search (opens command palette) */}
      <div className="flex-1 max-w-xl mx-auto">
        <button
          onClick={() => setShowCommandPalette(true)}
          className="w-full relative"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <div className="input pl-10 pr-4 py-2 text-sm text-left text-text-muted cursor-pointer w-full">
              Search teams, leagues, matches...
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-text-muted">
              <kbd className="px-1.5 py-0.5 bg-terminal-elevated rounded">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-terminal-elevated rounded">K</kbd>
            </div>
          </div>
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Session Timer */}
        <div className="hidden sm:block">
          <SessionTimer />
        </div>

        {/* Quick stats */}
        <div className="hidden lg:flex items-center gap-4 px-4 border-x border-terminal-border">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
            <span className="text-xs text-text-secondary">Live</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-accent-warning" />
            <span className="text-xs text-text-secondary">Edges</span>
          </div>
        </div>

        {/* V2 Features */}
        <div className="hidden sm:flex items-center gap-1 border-r border-terminal-border pr-2 mr-1">
          <button 
            onClick={() => setShowV2Panel('alerts')}
            className={cn(
              "btn btn-ghost p-2 relative",
              showV2Panel === 'alerts' && "text-accent-primary"
            )}
            title="Alerts"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowV2Panel('screens')}
            className={cn(
              "btn btn-ghost p-2",
              showV2Panel === 'screens' && "text-accent-primary"
            )}
            title="Saved Screens"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowV2Panel('tracker')}
            className={cn(
              "btn btn-ghost p-2",
              showV2Panel === 'tracker' && "text-accent-primary"
            )}
            title="Selection Tracker"
          >
            <Target className="w-4 h-4" />
          </button>
        </div>

        {/* Responsible Gambling */}
        <button 
          onClick={() => setShowResponsibleGamblingModal(true)}
          className="btn btn-ghost p-2"
          title="Responsible Gambling"
        >
          <Shield className="w-5 h-5" />
        </button>

        {/* Data Sync (for logged in users) */}
        {user && <SyncButton />}

        {/* Settings */}
        <button className="btn btn-ghost p-2">
          <Settings className="w-5 h-5" />
        </button>

        {/* User Menu */}
        <div className="border-l border-terminal-border pl-2 ml-1">
          <UserMenu onOpenProfile={() => setShowProfileModal(true)} />
        </div>

        {/* Profile Modal */}
        <ProfileModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
        />

        {/* Right panel toggle */}
        {selectedFixtureId && (
          <button
            onClick={toggleRightPanel}
            className="btn btn-ghost p-2 hidden lg:flex"
            title={rightPanelCollapsed ? 'Show match details' : 'Hide match details'}
          >
            <PanelRightClose className={cn(
              "w-5 h-5 transition-transform",
              rightPanelCollapsed && "rotate-180"
            )} />
          </button>
        )}
      </div>
    </header>
  )
}
