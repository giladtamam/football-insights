/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bloomberg-inspired dark theme
        terminal: {
          bg: '#0d1117',
          surface: '#161b22',
          elevated: '#21262d',
          border: '#30363d',
          muted: '#484f58',
        },
        accent: {
          primary: '#58a6ff',
          success: '#3fb950',
          warning: '#d29922',
          danger: '#f85149',
          purple: '#a371f7',
          cyan: '#39c5cf',
          orange: '#f0883e',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          muted: '#6e7681',
        }
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(88, 166, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(88, 166, 255, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
    },
  },
  plugins: [],
}

