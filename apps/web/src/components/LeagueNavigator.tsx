import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@apollo/client'
import { 
  ChevronRight, 
  Star, 
  Search,
  Globe,
  Trophy,
  Clock,
  Radio,
  Sparkles,
} from 'lucide-react'
import { GET_COUNTRIES } from '../graphql/queries'
import { useAppStore, TOP_LEAGUES } from '../lib/store'
import { cn } from '../lib/utils'

interface Country {
  id: number
  name: string
  code: string | null
  flag: string | null
  leagues: Array<{
    id: number
    name: string
    type: string
    logo: string | null
  }>
}

type QuickFilter = 'top' | 'favorites' | 'live' | 'soon'

export function LeagueNavigator() {
  const { data, loading } = useQuery(GET_COUNTRIES)
  const { 
    selectedLeagueId, 
    setSelectedLeague, 
    favoriteLeagueIds,
    toggleFavoriteLeague,
  } = useAppStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCountries, setExpandedCountries] = useState<Set<number>>(new Set())
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('top')

  const countries: Country[] = data?.countries || []

  const toggleCountry = (countryId: number) => {
    setExpandedCountries(prev => {
      const next = new Set(prev)
      if (next.has(countryId)) {
        next.delete(countryId)
      } else {
        next.add(countryId)
      }
      return next
    })
  }

  const filteredContent = useMemo(() => {
    if (searchQuery) {
      // Search across all leagues
      const results: { country: Country; leagues: Country['leagues'] }[] = []
      countries.forEach(country => {
        const matchingLeagues = country.leagues.filter(
          league => league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   country.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        if (matchingLeagues.length > 0) {
          results.push({ country, leagues: matchingLeagues })
        }
      })
      return results
    }
    return null
  }, [countries, searchQuery])

  const quickFilters: { id: QuickFilter; label: string; icon: typeof Trophy }[] = [
    { id: 'top', label: 'Top', icon: Trophy },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'soon', label: 'Soon', icon: Clock },
  ]

  return (
    <div className="h-full flex flex-col bg-terminal-surface/50">
      {/* Header */}
      <div className="p-3 border-b border-terminal-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-1 p-2 border-b border-terminal-border">
        {quickFilters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all",
              activeFilter === filter.id
                ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30"
                : "text-text-secondary hover:text-text-primary hover:bg-terminal-elevated"
            )}
          >
            <filter.icon className="w-3 h-3" />
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-terminal-elevated/50 rounded animate-pulse" />
            ))}
          </div>
        ) : searchQuery && filteredContent ? (
          // Search results
          <div className="p-2 space-y-1">
            {filteredContent.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                No leagues found
              </div>
            ) : (
              filteredContent.map(({ country, leagues }) => (
                <div key={country.id}>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs text-text-muted">
                    {country.flag && <span className="text-sm">{country.flag}</span>}
                    <span>{country.name}</span>
                  </div>
                  {leagues.map(league => (
                    <LeagueItem
                      key={league.id}
                      league={league}
                      isSelected={selectedLeagueId === league.id}
                      isFavorite={favoriteLeagueIds.includes(league.id)}
                      onSelect={() => setSelectedLeague(league.id)}
                      onToggleFavorite={() => toggleFavoriteLeague(league.id)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        ) : activeFilter === 'top' ? (
          // Top Leagues
          <div className="p-2">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-text-muted uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Top Leagues</span>
            </div>
            <div className="space-y-0.5 mt-1">
              {TOP_LEAGUES.map(league => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group",
                    selectedLeagueId === league.id
                      ? "bg-accent-primary/20 text-text-primary"
                      : "hover:bg-terminal-elevated text-text-secondary hover:text-text-primary"
                  )}
                >
                  <span className="text-base">{league.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{league.name}</div>
                    <div className="text-[10px] text-text-muted">{league.country}</div>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavoriteLeague(league.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        toggleFavoriteLeague(league.id)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Star className={cn(
                      "w-4 h-4",
                      favoriteLeagueIds.includes(league.id)
                        ? "fill-accent-warning text-accent-warning"
                        : "text-text-muted hover:text-accent-warning"
                    )} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : activeFilter === 'favorites' ? (
          // Favorites
          <div className="p-2">
            {favoriteLeagueIds.length === 0 ? (
              <div className="p-4 text-center">
                <Star className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No favorites yet</p>
                <p className="text-xs text-text-muted mt-1">
                  Star leagues to add them here
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {TOP_LEAGUES.filter(l => favoriteLeagueIds.includes(l.id)).map(league => (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeague(league.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group",
                      selectedLeagueId === league.id
                        ? "bg-accent-primary/20 text-text-primary"
                        : "hover:bg-terminal-elevated text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <span className="text-base">{league.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{league.name}</div>
                    </div>
                    <Star className="w-4 h-4 fill-accent-warning text-accent-warning" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // All Countries (default/other filters)
          <div className="p-2 space-y-0.5">
            {countries.map(country => (
              <CountryItem
                key={country.id}
                country={country}
                isExpanded={expandedCountries.has(country.id)}
                onToggle={() => toggleCountry(country.id)}
                selectedLeagueId={selectedLeagueId}
                favoriteLeagueIds={favoriteLeagueIds}
                onSelectLeague={setSelectedLeague}
                onToggleFavorite={toggleFavoriteLeague}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface CountryItemProps {
  country: Country
  isExpanded: boolean
  onToggle: () => void
  selectedLeagueId: number | null
  favoriteLeagueIds: number[]
  onSelectLeague: (id: number) => void
  onToggleFavorite: (id: number) => void
}

function CountryItem({ 
  country, 
  isExpanded, 
  onToggle,
  selectedLeagueId,
  favoriteLeagueIds,
  onSelectLeague,
  onToggleFavorite,
}: CountryItemProps) {
  const hasSelectedLeague = country.leagues.some(l => l.id === selectedLeagueId)

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all",
          hasSelectedLeague 
            ? "bg-accent-primary/10 text-text-primary"
            : "hover:bg-terminal-elevated text-text-secondary hover:text-text-primary"
        )}
      >
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform",
          isExpanded && "rotate-90"
        )} />
        {country.flag ? (
          <span className="text-sm">{country.flag}</span>
        ) : (
          <Globe className="w-4 h-4 text-text-muted" />
        )}
        <span className="text-sm flex-1 truncate">{country.name}</span>
        <span className="text-[10px] text-text-muted">
          {country.leagues.length}
        </span>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-4 border-l border-terminal-border pl-2"
          >
            {country.leagues.map(league => (
              <LeagueItem
                key={league.id}
                league={league}
                isSelected={selectedLeagueId === league.id}
                isFavorite={favoriteLeagueIds.includes(league.id)}
                onSelect={() => onSelectLeague(league.id)}
                onToggleFavorite={() => onToggleFavorite(league.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface LeagueItemProps {
  league: Country['leagues'][0]
  isSelected: boolean
  isFavorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}

function LeagueItem({ league, isSelected, isFavorite, onSelect, onToggleFavorite }: LeagueItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all group",
        isSelected
          ? "bg-accent-primary/20 text-text-primary"
          : "hover:bg-terminal-elevated/50 text-text-secondary hover:text-text-primary"
      )}
    >
      {league.logo ? (
        <img src={league.logo} alt="" className="w-4 h-4 object-contain" />
      ) : (
        <Trophy className="w-4 h-4 text-text-muted" />
      )}
      <span className="text-xs flex-1 truncate">{league.name}</span>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation()
            onToggleFavorite()
          }
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
      >
        <Star className={cn(
          "w-3.5 h-3.5",
          isFavorite
            ? "fill-accent-warning text-accent-warning"
            : "text-text-muted hover:text-accent-warning"
        )} />
      </span>
    </button>
  )
}

