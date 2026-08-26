import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#070b19',
        surface: '#0f172a',
        'surface-card': '#131d38',
        'surface-border': '#1e293b',
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          glow: 'rgba(59, 130, 246, 0.35)',
        },
        positif: {
          DEFAULT: '#10b981',
          glow: 'rgba(16, 185, 129, 0.35)',
          bg: 'rgba(16, 185, 129, 0.12)',
        },
        netral: {
          DEFAULT: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.35)',
          bg: 'rgba(56, 189, 248, 0.12)',
        },
        negatif: {
          DEFAULT: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.35)',
          bg: 'rgba(244, 63, 94, 0.12)',
        },
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(59, 130, 246, 0.4)',
        'glow-positif': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-netral': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
        'glow-negatif': '0 0 25px -5px rgba(244, 63, 94, 0.4)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
