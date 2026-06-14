/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        nightsky: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        neon: {
          cyan: '#22d3ee',
          'cyan-dark': '#06b6d4',
          'cyan-light': '#67e8f9',
          orange: '#f97316',
          'orange-dark': '#ea580c',
          'orange-light': '#fb923c',
          green: '#10b981',
          'green-dark': '#059669',
          'green-light': '#34d399',
          red: '#ef4444',
          'red-dark': '#dc2626',
          'red-light': '#f87171',
          pink: '#ec4899',
          'pink-dark': '#db2777',
          'pink-light': '#f472b6',
          yellow: '#eab308',
          'yellow-dark': '#ca8a04',
          'yellow-light': '#facc15',
        },
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'neon-glow': 'neonGlow 3s ease-in-out infinite',
        'title-glow': 'titleGlow 2.5s ease-in-out infinite',
        'heart-beat': 'heartBeat 1.2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'breathe': 'breathe 2s ease-in-out infinite',
        'scanline': 'scanline 6s linear infinite',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)',
        'neon-cyan-lg': '0 0 30px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.3)',
        'neon-orange': '0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(249, 115, 22, 0.2)',
        'neon-green': '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)',
        'neon-red': '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid':
          'linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
