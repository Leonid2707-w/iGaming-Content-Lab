/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        icl: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          dark: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          'surface-alt': 'rgb(var(--color-surface-alt) / <alpha-value>)',
          'surface-2': 'rgb(var(--color-surface-alt) / <alpha-value>)',
          panel: 'rgb(var(--color-surface) / <alpha-value>)',
          card: 'rgb(var(--color-card) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          primary: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-muted) / <alpha-value>)',
          subtle: 'rgb(var(--color-subtle) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
          'accent-soft': 'rgb(var(--color-accent-soft) / <alpha-value>)',
          neon: 'rgb(var(--color-accent) / <alpha-value>)',
          'neon-blue': 'rgb(var(--color-accent) / <alpha-value>)',
          gold: 'rgb(var(--color-accent) / <alpha-value>)',
          'gold-light': 'rgb(var(--color-accent-hover) / <alpha-value>)',
          navy: 'rgb(var(--color-surface-alt) / <alpha-value>)',
          success: 'rgb(var(--color-success) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shadow-card)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        glow: '0 16px 40px -20px rgb(var(--color-accent) / 0.45)',
        'glow-neon': '0 16px 40px -20px rgb(var(--color-accent) / 0.45)',
        'glow-gold': '0 16px 40px -20px rgb(var(--color-accent) / 0.35)',
      },
      backgroundImage: {
        'mesh-dark':
          'radial-gradient(at 20% 20%, rgb(var(--color-accent) / 0.1) 0px, transparent 50%), radial-gradient(at 80% 10%, rgb(var(--color-accent) / 0.05) 0px, transparent 50%)',
        'gradient-accent':
          'linear-gradient(135deg, rgb(var(--color-accent)) 0%, rgb(var(--color-accent-hover)) 100%)',
        'gradient-gold':
          'linear-gradient(135deg, rgb(var(--color-accent)) 0%, rgb(var(--color-accent-hover)) 100%)',
        'gradient-text':
          'linear-gradient(135deg, rgb(var(--color-accent)) 0%, #2563eb 100%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.6s ease-out both',
        float: 'float 8s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
