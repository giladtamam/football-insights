import { useCallback } from 'react'

interface ExportableData {
  headers: string[]
  rows: (string | number | null)[][]
  filename: string
}

export function useExport() {
  // Export to CSV
  const exportToCSV = useCallback(({ headers, rows, filename }: ExportableData) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const value = cell?.toString() ?? ''
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  // Copy to clipboard as formatted table
  const copyToClipboard = useCallback(async ({ headers, rows, filename }: ExportableData) => {
    const textContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => cell?.toString() ?? '').join('\t'))
    ].join('\n')

    try {
      await navigator.clipboard.writeText(textContent)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }, [])

  // Export fixture data
  const exportFixtures = useCallback((fixtures: any[], filename = 'fixtures') => {
    const headers = [
      'Date',
      'Time', 
      'Home Team',
      'Away Team',
      'Home Goals',
      'Away Goals',
      'Home xG',
      'Away xG',
      'Status',
      'League',
    ]

    const rows = fixtures.map(f => [
      new Date(f.date).toLocaleDateString(),
      new Date(f.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      f.homeTeam?.name || '',
      f.awayTeam?.name || '',
      f.goalsHome,
      f.goalsAway,
      f.xgHome?.toFixed(2) || '',
      f.xgAway?.toFixed(2) || '',
      f.statusShort || f.status || '',
      f.season?.league?.name || '',
    ])

    return { headers, rows, filename }
  }, [])

  // Export standings data
  const exportStandings = useCallback((standings: any[], leagueName: string) => {
    const headers = [
      'Rank',
      'Team',
      'Played',
      'Won',
      'Drawn',
      'Lost',
      'GF',
      'GA',
      'GD',
      'Points',
      'Form',
    ]

    const rows = standings.map(s => [
      s.rank,
      s.team?.name || '',
      s.played,
      s.won,
      s.drawn,
      s.lost,
      s.goalsFor,
      s.goalsAgainst,
      s.goalsDiff,
      s.points,
      s.form || '',
    ])

    return { headers, rows, filename: `${leagueName.toLowerCase().replace(/\s+/g, '-')}-standings` }
  }, [])

  // Export odds data
  const exportOdds = useCallback((oddsData: any[], filename = 'odds') => {
    const headers = [
      'Match',
      'Home Odds',
      'Draw Odds',
      'Away Odds',
      'Home Prob %',
      'Draw Prob %',
      'Away Prob %',
      'Overround %',
    ]

    const rows = oddsData.map(o => [
      `${o.homeTeam} vs ${o.awayTeam}`,
      o.consensus?.home?.toFixed(2) || '',
      o.consensus?.draw?.toFixed(2) || '',
      o.consensus?.away?.toFixed(2) || '',
      o.impliedProbabilities?.home ? (o.impliedProbabilities.home * 100).toFixed(1) : '',
      o.impliedProbabilities?.draw ? (o.impliedProbabilities.draw * 100).toFixed(1) : '',
      o.impliedProbabilities?.away ? (o.impliedProbabilities.away * 100).toFixed(1) : '',
      o.overround ? (o.overround * 100).toFixed(1) : '',
    ])

    return { headers, rows, filename }
  }, [])

  // Export match analysis
  const exportMatchAnalysis = useCallback((fixture: any) => {
    const headers = ['Metric', 'Home', 'Away']
    const rows = [
      ['Team', fixture.homeTeam?.name || '', fixture.awayTeam?.name || ''],
      ['Goals', fixture.goalsHome?.toString() || '', fixture.goalsAway?.toString() || ''],
      ['xG', fixture.xgHome?.toFixed(2) || '', fixture.xgAway?.toFixed(2) || ''],
    ]

    return { 
      headers, 
      rows, 
      filename: `${fixture.homeTeam?.name || 'home'}-vs-${fixture.awayTeam?.name || 'away'}-analysis` 
    }
  }, [])

  return {
    exportToCSV,
    copyToClipboard,
    exportFixtures,
    exportStandings,
    exportOdds,
    exportMatchAnalysis,
  }
}

