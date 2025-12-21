import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useGoogleLogin } from '@react-oauth/google'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { useAuthStore } from '../../lib/auth-store'
import { SIGN_UP, LOGIN, GOOGLE_AUTH } from '../../graphql/auth'
import { cn } from '../../lib/utils'

export function AuthModal() {
  const { showAuthModal, authModalMode, setShowAuthModal, login } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [signUp, { loading: signUpLoading }] = useMutation(SIGN_UP)
  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN)
  const [googleAuth, { loading: googleLoading }] = useMutation(GOOGLE_AUTH)

  const isLoading = signUpLoading || loginLoading || googleLoading

  const handleClose = () => {
    setShowAuthModal(false)
    setError(null)
    setEmail('')
    setPassword('')
    setName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (mode === 'signup') {
        const { data } = await signUp({
          variables: { email, password, name: name || undefined },
        })
        if (data?.signUp) {
          login(data.signUp.user, data.signUp.token)
        }
      } else {
        const { data } = await loginMutation({
          variables: { email, password },
        })
        if (data?.login) {
          login(data.login.user, data.login.token)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }
  }

  // Use Google Login hook with implicit flow
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null)
      try {
        // Get user info from Google using the access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const userInfo = await userInfoResponse.json()
        
        // For implicit flow, we'll create/login user with their Google info
        // The backend googleAuth expects an ID token, so we'll adapt
        const { data } = await googleAuth({
          variables: { idToken: tokenResponse.access_token },
        })
        if (data?.googleAuth) {
          login(data.googleAuth.user, data.googleAuth.token)
        }
      } catch (err: any) {
        setError(err.message || 'Google sign-in failed')
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed')
    },
    flow: 'implicit',
  })

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    let strength = 0
    if (pass.length >= 8) strength++
    if (/[A-Z]/.test(pass)) strength++
    if (/[a-z]/.test(pass)) strength++
    if (/[0-9]/.test(pass)) strength++
    if (/[^A-Za-z0-9]/.test(pass)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)

  if (!showAuthModal) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md mx-4 bg-terminal-bg border border-terminal-border rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-terminal-border">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 p-2 rounded-lg hover:bg-terminal-elevated transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
            <h2 className="text-xl font-bold">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {mode === 'login'
                ? 'Sign in to access your account'
                : 'Join Football Insights today'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Error Message */}
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
            </AnimatePresence>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={() => googleLogin()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-terminal-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-terminal-bg text-text-muted">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Name</label>
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
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-12 py-2.5 bg-terminal-elevated border border-terminal-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-terminal-muted rounded"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-text-muted" />
                    ) : (
                      <Eye className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator (only for signup) */}
                {mode === 'signup' && password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-colors',
                            passwordStrength >= level
                              ? passwordStrength <= 2
                                ? 'bg-accent-danger'
                                : passwordStrength <= 3
                                ? 'bg-accent-warning'
                                : 'bg-accent-success'
                              : 'bg-terminal-border'
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className={cn('flex items-center gap-0.5', password.length >= 8 ? 'text-accent-success' : 'text-text-muted')}>
                        {password.length >= 8 ? <Check className="w-3 h-3" /> : '○'} 8+ chars
                      </span>
                      <span className={cn('flex items-center gap-0.5', /[A-Z]/.test(password) ? 'text-accent-success' : 'text-text-muted')}>
                        {/[A-Z]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Uppercase
                      </span>
                      <span className={cn('flex items-center gap-0.5', /[a-z]/.test(password) ? 'text-accent-success' : 'text-text-muted')}>
                        {/[a-z]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Lowercase
                      </span>
                      <span className={cn('flex items-center gap-0.5', /[0-9]/.test(password) ? 'text-accent-success' : 'text-text-muted')}>
                        {/[0-9]/.test(password) ? <Check className="w-3 h-3" /> : '○'} Number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-2.5 rounded-lg font-medium text-sm transition-all',
                  'bg-accent-primary hover:bg-accent-primary/90 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : mode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Switch Mode */}
            <p className="text-center text-sm text-text-muted">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup')
                      setError(null)
                    }}
                    className="text-accent-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('login')
                      setError(null)
                    }}
                    className="text-accent-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
