import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#15130F',
        surface: '#221D16',
        accent: '#C2793B',
        'accent-dim': '#A86530',
        'text-primary': '#F2EDE4',
        'text-secondary': '#8A8377',
        success: '#7A9B76',
        danger: '#C2503B',
      },
      fontFamily: {
        condensed: ['Barlow Condensed', 'Arial Narrow', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        pill: '100px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(242,237,228,0.06)',
        'glass-accent': '0 4px 24px rgba(194,121,59,0.18), 0 0 0 1px rgba(194,121,59,0.22), inset 0 1px 0 rgba(194,121,59,0.1)',
        copper: '0 4px 16px rgba(194,121,59,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
