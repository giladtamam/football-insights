import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useLazyQuery } from '@apollo/client'
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
  MapPin,
  Calendar,
  Clock,
  Heart,
  Search,
  FileText,
} from 'lucide-react'
import { useAuthStore } from '../../lib/auth-store'
import { UPDATE_PROFILE, CHANGE_PASSWORD, SEARCH_TEAMS } from '../../graphql/auth'
import { cn } from '../../lib/utils'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TeamResult {
  id: number
  name: string
  logo: string | null
  country: {
    name: string
    flag: string | null
  }
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
]

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile')
  
  // Profile form state
  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [location, setLocation] = useState(user?.location || '')
  const [birthDate, setBirthDate] = useState(
    user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
  )
  const [timezone, setTimezone] = useState(user?.timezone || '')
  const [favoriteTeamId, setFavoriteTeamId] = useState<number | null>(user?.favoriteTeamId || null)
  const [favoriteTeam, setFavoriteTeam] = useState(user?.favoriteTeam || null)
  
  // Team search state
  const [teamSearch, setTeamSearch] = useState('')
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)
  const teamSearchRef = useRef<HTMLDivElement>(null)
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [updateProfile, { loading: profileLoading }] = useMutation(UPDATE_PROFILE)
  const [changePassword, { loading: passwordLoading }] = useMutation(CHANGE_PASSWORD)
  const [searchTeams, { data: teamsData, loading: teamsLoading }] = useLazyQuery(SEARCH_TEAMS)

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setAvatar(user.avatar || '')
      setBio(user.bio || '')
      setLocation(user.location || '')
      setBirthDate(user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '')
      setTimezone(user.timezone || '')
      setFavoriteTeamId(user.favoriteTeamId || null)
      setFavoriteTeam(user.favoriteTeam || null)
    }
  }, [user])

  // Handle team search
  useEffect(() => {
    if (teamSearch.length >= 2) {
      searchTeams({ variables: { search: teamSearch, limit: 10 } })
      setShowTeamDropdown(true)
    } else {
      setShowTeamDropdown(false)
    }
  }, [teamSearch, searchTeams])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (teamSearchRef.current && !teamSearchRef.current.contains(event.target as Node)) {
        setShowTeamDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const { data } = await updateProfile({
        variables: {
          name: name || null,
          avatar: avatar || null,
          bio: bio || null,
          location: location || null,
          birthDate: birthDate ? new Date(birthDate).toISOString() : null,
          timezone: timezone || null,
          favoriteTeamId: favoriteTeamId,
        },
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

  const selectTeam = (team: TeamResult) => {
    setFavoriteTeamId(team.id)
    setFavoriteTeam({ id: team.id, name: team.name, logo: team.logo })
    setTeamSearch('')
    setShowTeamDropdown(false)
  }

  const clearFavoriteTeam = () => {
    setFavoriteTeamId(null)
    setFavoriteTeam(null)
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

  const teams: TeamResult[] = teamsData?.teams || []

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-full flex items-center justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-terminal-bg border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
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
            <button
              onClick={() => {
                setActiveTab('preferences')
                setError(null)
                setSuccess(null)
              }}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === 'preferences'
                  ? 'text-accent-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Preferences
              {activeTab === 'preferences' && (
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
          <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
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

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatar || user.avatar ? (
                      <img
                        src={avatar || user.avatar || ''}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-terminal-border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-primary to-accent-purple flex items-center justify-center text-white text-2xl font-medium">
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

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bio</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={200}
                      className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all resize-none"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">{bio.length}/200 characters</p>
                </div>

                {/* Location & Birth Date Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Birth Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                      />
                    </div>
                  </div>
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

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Favorite Team */}
                <div ref={teamSearchRef}>
                  <label className="block text-sm font-medium mb-1.5">Favorite Team</label>
                  
                  {favoriteTeam ? (
                    <div className="flex items-center gap-3 p-3 bg-terminal-elevated border border-terminal-border rounded-lg">
                      {favoriteTeam.logo && (
                        <img src={favoriteTeam.logo} alt={favoriteTeam.name} className="w-10 h-10 object-contain" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{favoriteTeam.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearFavoriteTeam}
                        className="p-1.5 text-text-muted hover:text-accent-danger transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        placeholder="Search for a team..."
                        className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                      />
                      
                      {/* Dropdown */}
                      {showTeamDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-terminal-bg border border-terminal-border rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                          {teamsLoading ? (
                            <div className="p-4 text-center text-text-muted">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            </div>
                          ) : teams.length > 0 ? (
                            teams.map((team) => (
                              <button
                                key={team.id}
                                type="button"
                                onClick={() => selectTeam(team)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-terminal-elevated transition-colors text-left"
                              >
                                {team.logo && (
                                  <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                                )}
                                <div>
                                  <p className="font-medium">{team.name}</p>
                                  <p className="text-xs text-text-muted">
                                    {team.country?.flag} {team.country?.name}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-text-muted text-sm">
                              No teams found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Your favorite team will be highlighted in match listings
                  </p>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Timezone</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select timezone</option>
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Match times will be shown in your timezone</p>
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
                      Save Preferences
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Security Tab */}
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
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
