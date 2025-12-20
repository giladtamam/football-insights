import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock,
  AlertTriangle,
  X,
  Shield,
  Bell,
  ExternalLink,
  Info,
  Pause,
  Timer,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../lib/store'
import { cn } from '../lib/utils'

// Session Timer displayed in header
export function SessionTimer() {
  const { sessionStartTime, sessionDurationWarningMinutes, updateSessionTime, totalSessionTime } = useAppStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!sessionStartTime) return
    
    const interval = setInterval(() => {
      const mins = Math.floor((Date.now() - sessionStartTime) / 60000)
      setElapsed(mins)
      updateSessionTime()
    }, 60000) // Update every minute
    
    // Initial update
    setElapsed(Math.floor((Date.now() - sessionStartTime) / 60000))
    
    return () => clearInterval(interval)
  }, [sessionStartTime, updateSessionTime])

  if (!sessionStartTime) return null

  const isWarning = elapsed >= sessionDurationWarningMinutes
  const hours = Math.floor(elapsed / 60)
  const minutes = elapsed % 60

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
      isWarning 
        ? "bg-accent-warning/20 text-accent-warning animate-pulse" 
        : "bg-terminal-elevated text-text-muted"
    )}>
      <Clock className="w-3.5 h-3.5" />
      <span className="font-mono">
        {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
      </span>
      {isWarning && <AlertTriangle className="w-3.5 h-3.5" />}
    </div>
  )
}

// Disclaimer Modal shown on first visit
export function DisclaimerModal() {
  const { hasSeenDisclaimer, acknowledgeDisclaimer, startSession } = useAppStore()

  if (hasSeenDisclaimer) return null

  const handleAccept = () => {
    acknowledgeDisclaimer()
    startSession()
  }

  return (
    <div className="fixed inset-0 z-50 bg-terminal-bg/95 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-terminal-surface border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center border-b border-terminal-border">
          <Shield className="w-12 h-12 text-accent-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Responsible Gambling</h2>
          <p className="text-sm text-text-secondary">
            This platform provides research tools for football analysis. Please gamble responsibly.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <Clock className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Session Tracking</div>
              <div className="text-text-muted">We'll track your session time and remind you to take breaks.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Bell className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Time Alerts</div>
              <div className="text-text-muted">You'll receive alerts after 60 minutes of activity.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <Info className="w-5 h-5 text-accent-success flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Research Tool Only</div>
              <div className="text-text-muted">This is an informational tool - no betting is conducted here.</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-terminal-elevated/50 border-t border-terminal-border">
          <div className="text-xs text-text-muted mb-4 text-center">
            By clicking "I Understand", you confirm you are of legal gambling age in your jurisdiction.
          </div>
          <button
            onClick={handleAccept}
            className="w-full btn btn-primary py-3"
          >
            I Understand - Start Session
          </button>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-text-muted">
            <a href="https://www.begambleaware.org/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary flex items-center gap-1">
              BeGambleAware <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://www.gamcare.org.uk/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary flex items-center gap-1">
              GamCare <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Full Responsible Gambling Modal
export function ResponsibleGamblingModal() {
  const { 
    showResponsibleGamblingModal, 
    setShowResponsibleGamblingModal,
    sessionStartTime,
    sessionDurationWarningMinutes,
    totalSessionTime,
  } = useAppStore()

  const [breakTaken, setBreakTaken] = useState(false)

  if (!showResponsibleGamblingModal) return null

  const elapsed = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0
  const hours = Math.floor(elapsed / 60)
  const minutes = elapsed % 60

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-terminal-bg/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setShowResponsibleGamblingModal(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-terminal-surface border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-terminal-border">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-accent-primary" />
              <h2 className="text-lg font-bold">Responsible Gambling</h2>
            </div>
            <button
              onClick={() => setShowResponsibleGamblingModal(false)}
              className="p-1 hover:bg-terminal-elevated rounded"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Session Stats */}
            <div className="stat-card p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Current Session</span>
                <Timer className="w-5 h-5 text-text-muted" />
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-4xl font-bold font-mono mb-1",
                  elapsed >= sessionDurationWarningMinutes ? "text-accent-warning" : "text-text-primary"
                )}>
                  {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                </div>
                <div className="text-xs text-text-muted">
                  {elapsed >= sessionDurationWarningMinutes 
                    ? "Consider taking a break" 
                    : `Warning at ${sessionDurationWarningMinutes} minutes`}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 h-2 bg-terminal-elevated rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all rounded-full",
                    elapsed >= sessionDurationWarningMinutes ? "bg-accent-warning" : "bg-accent-primary"
                  )}
                  style={{ width: `${Math.min((elapsed / sessionDurationWarningMinutes) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={() => setBreakTaken(true)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                  breakTaken 
                    ? "bg-accent-success/20 text-accent-success"
                    : "bg-terminal-elevated hover:bg-terminal-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <Pause className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Take a Break</div>
                    <div className="text-xs text-text-muted">Step away for a few minutes</div>
                  </div>
                </div>
                {breakTaken && <span className="text-xs">✓ Acknowledged</span>}
              </button>

              <a
                href="https://www.begambleaware.org/gambling-problems"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3 bg-terminal-elevated hover:bg-terminal-muted rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-accent-warning" />
                  <div>
                    <div className="font-medium">Need Help?</div>
                    <div className="text-xs text-text-muted">Talk to someone about gambling</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-text-muted" />
              </a>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Support Resources</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href="https://www.begambleaware.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-terminal-elevated hover:bg-terminal-muted rounded-lg flex items-center gap-2 transition-colors"
                >
                  BeGambleAware <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a
                  href="https://www.gamcare.org.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-terminal-elevated hover:bg-terminal-muted rounded-lg flex items-center gap-2 transition-colors"
                >
                  GamCare <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a
                  href="https://www.gamblingtherapy.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-terminal-elevated hover:bg-terminal-muted rounded-lg flex items-center gap-2 transition-colors"
                >
                  Gambling Therapy <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a
                  href="https://www.gamblersanonymous.org.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-terminal-elevated hover:bg-terminal-muted rounded-lg flex items-center gap-2 transition-colors"
                >
                  Gamblers Anonymous <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 bg-accent-primary/10 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-accent-primary flex-shrink-0" />
              <div className="text-xs text-text-secondary">
                <p className="mb-2">
                  <strong>Remember:</strong> This platform is for research and information only. 
                  No betting is conducted through this tool.
                </p>
                <p>
                  If you feel gambling is affecting your life, please seek help from the resources above.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-terminal-border">
            <button
              onClick={() => setShowResponsibleGamblingModal(false)}
              className="w-full btn btn-primary"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Session Warning Toast
export function SessionWarningToast() {
  const { sessionStartTime, sessionDurationWarningMinutes, setShowResponsibleGamblingModal } = useAppStore()
  const [showWarning, setShowWarning] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!sessionStartTime || dismissed) return
    
    const checkTime = () => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000)
      if (elapsed >= sessionDurationWarningMinutes && !showWarning) {
        setShowWarning(true)
      }
    }
    
    const interval = setInterval(checkTime, 30000) // Check every 30 seconds
    checkTime() // Initial check
    
    return () => clearInterval(interval)
  }, [sessionStartTime, sessionDurationWarningMinutes, dismissed, showWarning])

  if (!showWarning || dismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm bg-accent-warning/20 border border-accent-warning/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <Clock className="w-6 h-6 text-accent-warning flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-accent-warning mb-1">Time Reminder</h4>
          <p className="text-sm text-text-secondary mb-3">
            You've been researching for over {sessionDurationWarningMinutes} minutes. Consider taking a break.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDismissed(true)
                setShowWarning(false)
              }}
              className="px-3 py-1.5 text-xs bg-terminal-elevated hover:bg-terminal-muted rounded transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                setShowResponsibleGamblingModal(true)
                setDismissed(true)
                setShowWarning(false)
              }}
              className="px-3 py-1.5 text-xs bg-accent-warning text-terminal-bg rounded font-medium hover:bg-accent-warning/90 transition-colors"
            >
              Take a Break
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/10 rounded"
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>
      </div>
    </motion.div>
  )
}

