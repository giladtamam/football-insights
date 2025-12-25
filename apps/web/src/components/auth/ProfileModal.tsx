import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Camera,
} from 'lucide-react'
import { useAuthStore } from '../../lib/auth-store'
import { UPDATE_PROFILE, CHANGE_PASSWORD } from '../../graphql/auth'
import { cn } from '../../lib/utils'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  
  // Profile form state
  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [updateProfile, { loading: profileLoading }] = useMutation(UPDATE_PROFILE)
  const [changePassword, { loading: passwordLoading }] = useMutation(CHANGE_PASSWORD)

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const { data } = await updateProfile({
        variables: { name: name || null, avatar: avatar || null },
      })
      if (data?.updateProfile) {
        setUser(data.updateProfile)
        setSuccess('Profile updated successfully!')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const { data } = await changePassword({
        variables: { currentPassword, newPassword },
      })
      if (data?.changePassword) {
        setSuccess('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    }
  }

  if (!isOpen || !user) return null

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg mx-4 bg-terminal-bg border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-terminal-border">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-lg hover:bg-terminal-elevated transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
            <h2 className="text-xl font-bold">Profile Settings</h2>
            <p className="text-sm text-text-muted mt-1">
              Manage your account and preferences
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-terminal-border">
            <button
              onClick={() => {
                setActiveTab('profile')
                setError(null)
                setSuccess(null)
              }}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === 'profile'
                  ? 'text-accent-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Profile
              {activeTab === 'profile' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                />
              )}
            </button>
            {user.authProvider === 'email' && (
              <button
                onClick={() => {
                  setActiveTab('security')
                  setError(null)
                  setSuccess(null)
                }}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                  activeTab === 'security'
                    ? 'text-accent-primary'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                Security
                {activeTab === 'security' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
                  />
                )}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/20"
                >
                  <AlertCircle className="w-5 h-5 text-accent-danger flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-accent-danger">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent-success/10 border border-accent-success/20"
                >
                  <Check className="w-5 h-5 text-accent-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-accent-success">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatar || user.avatar ? (
                      <img
                        src={avatar || user.avatar || ''}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-accent-primary flex items-center justify-center text-white text-2xl font-medium">
                        {initials}
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 p-1.5 bg-terminal-elevated border border-terminal-border rounded-full hover:bg-terminal-muted transition-colors"
                    >
                      <Camera className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1.5">Avatar URL</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                    />
                  </div>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-terminal-muted border border-terminal-border rounded-lg text-sm text-text-muted cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className={cn(
                    'w-full py-2.5 rounded-lg font-medium text-sm transition-all',
                    'bg-accent-primary hover:bg-accent-primary/90 text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className={cn(
                    'w-full py-2.5 rounded-lg font-medium text-sm transition-all',
                    'bg-accent-primary hover:bg-accent-primary/90 text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Change Password
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}



