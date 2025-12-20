import { useEffect, useCallback } from 'react'
import { useAppStore } from '../lib/store'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts() {
  const {
    setShowCommandPalette,
    setActiveTab,
    selectedFixtureId,
    setSelectedFixture,
    showMatchCenter,
    setShowMatchCenter,
  } = useAppStore()

  const shortcuts: ShortcutConfig[] = [
    // Global shortcuts
    {
      key: 'k',
      meta: true,
      handler: () => setShowCommandPalette(true),
      description: 'Open command palette',
    },
    {
      key: 'k',
      ctrl: true,
      handler: () => setShowCommandPalette(true),
      description: 'Open command palette',
    },
    {
      key: 'Escape',
      handler: () => {
        if (selectedFixtureId) {
          setSelectedFixture(null)
        }
      },
      description: 'Close match details',
    },
    // Tab navigation
    {
      key: '1',
      handler: () => setActiveTab('fixtures'),
      description: 'Go to Fixtures',
    },
    {
      key: '2',
      handler: () => setActiveTab('live'),
      description: 'Go to Live',
    },
    {
      key: '3',
      handler: () => setActiveTab('results'),
      description: 'Go to Results',
    },
    {
      key: '4',
      handler: () => setActiveTab('standings'),
      description: 'Go to Standings',
    },
    {
      key: '5',
      handler: () => setActiveTab('odds'),
      description: 'Go to Odds',
    },
    // Toggle match center
    {
      key: 'm',
      handler: () => setShowMatchCenter(!showMatchCenter),
      description: 'Toggle match center',
    },
  ]

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Only allow Escape in inputs
      if (event.key !== 'Escape') return
    }

    for (const shortcut of shortcuts) {
      const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      
      // For cmd/ctrl+k, either meta or ctrl can work
      if (shortcut.key === 'k' && (shortcut.meta || shortcut.ctrl)) {
        if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          shortcut.handler()
          return
        }
        continue
      }

      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        metaMatch &&
        ctrlMatch &&
        shiftMatch
      ) {
        event.preventDefault()
        shortcut.handler()
        return
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return shortcuts
}

// Hook to show keyboard shortcut hints
export function useShortcutHint(key: string, modifier?: 'cmd' | 'ctrl' | 'shift') {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  
  let hint = ''
  if (modifier === 'cmd') {
    hint = isMac ? '⌘' : 'Ctrl+'
  } else if (modifier === 'ctrl') {
    hint = 'Ctrl+'
  } else if (modifier === 'shift') {
    hint = '⇧'
  }
  
  return `${hint}${key.toUpperCase()}`
}

