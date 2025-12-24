import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: number
  email: string
  name: string | null
  avatar: string | null
  authProvider: string
}

interface AuthState {
  // State
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  showAuthModal: boolean
  authModalMode: 'login' | 'signup'

  // Actions
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  login: (user: AuthUser, token: string) => void
  logout: () => void
  setIsLoading: (loading: boolean) => void
  setShowAuthModal: (show: boolean, mode?: 'login' | 'signup') => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      showAuthModal: false,
      authModalMode: 'login',

      // Actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      
      login: (user, token) => {
        set({ user, token, showAuthModal: false })
      },

      logout: () => {
        set({ user: null, token: null })
      },

      setIsLoading: (isLoading) => set({ isLoading }),
      
      setShowAuthModal: (show, mode) => set({ 
        showAuthModal: show,
        ...(mode && { authModalMode: mode })
      }),
    }),
    {
      name: 'football-insights-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)

// Helper to get auth header
export function getAuthHeader(): Record<string, string> {
  const token = useAuthStore.getState().token
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}


