/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0a0612',
        'bg-deep': '#050309',
        'neon-cyan': '#00f5ff',
        'neon-magenta': '#ff00e5',
        'neon-yellow': '#fff200',
        'neon-green': '#00ff88',
        'neon-red': '#ff003c',
        'neon-purple': '#b026ff',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 245, 255, 0.6), 0 0 40px rgba(0, 245, 255, 0.3)',
        'glow-magenta': '0 0 20px rgba(255, 0, 229, 0.6), 0 0 40px rgba(255, 0, 229, 0.3)',
        'glow-yellow': '0 0 20px rgba(255, 242, 0, 0.6), 0 0 40px rgba(255, 242, 0, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.3)',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
