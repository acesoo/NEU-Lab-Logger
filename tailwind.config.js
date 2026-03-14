/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        neu: {
          green:      '#1a6b42',
          'green-dark': '#0a4a2e',
          'green-light': '#2ea864',
          'green-pale': '#e8f5ee',
          gold:       '#c9a227',
          'gold-light': '#f0c84a',
          'gold-pale': '#fdf8e8',
        }
      },
      boxShadow: {
        'neu': '0 4px 16px rgba(0,0,0,0.08)',
        'neu-lg': '0 12px 40px rgba(0,0,0,0.12)',
        'neu-xl': '0 24px 60px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
