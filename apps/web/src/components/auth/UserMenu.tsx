import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../../lib/auth-store'
import { cn } from '../../lib/utils'

interface UserMenuProps {
  onOpenProfile?: () => void
}

export function UserMenu({ onOpenProfile }: UserMenuProps) {
  const { user, logout, setShowAuthModal } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAuthModal(true, 'login')}
          className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => setShowAuthModal(true, 'signup')}
          className="px-3 py-1.5 text-sm font-medium bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg transition-colors"
        >
          Sign Up
        </button>
      </div>
    )
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
          'hover:bg-terminal-elevated',
          isOpen && 'bg-terminal-elevated'
        )}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || user.email}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium truncate max-w-[120px]">
            {user.name || user.email.split('@')[0]}
          </div>
          <div className="text-[10px] text-text-muted truncate max-w-[120px]">
            {user.email}
          </div>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-text-muted transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-terminal-bg border border-terminal-border rounded-lg shadow-xl overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-terminal-border bg-terminal-elevated/50">
              <div className="text-sm font-medium truncate">
                {user.name || 'User'}
              </div>
              <div className="text-xs text-text-muted truncate">
                {user.email}
              </div>
              <div className="mt-1 flex items-center gap-1">
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded',
                  user.authProvider === 'google'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-accent-primary/20 text-accent-primary'
                )}>
                  {user.authProvider === 'google' ? 'Google' : 'Email'}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false)
                  onOpenProfile?.()
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-terminal-elevated hover:text-text-primary transition-colors"
              >
                <User className="w-4 h-4" />
                Profile Settings
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Could open settings modal
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-terminal-elevated hover:text-text-primary transition-colors"
              >
                <Settings className="w-4 h-4" />
                Preferences
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-terminal-border py-1">
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-accent-danger hover:bg-accent-danger/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

