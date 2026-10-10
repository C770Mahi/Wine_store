import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#15803d',
          dark: '#166534',
          soft: '#e8f7ee'
        },
        ink: '#111827',
        muted: '#6b7280',
        surface: '#f8fafc',
        accent: '#facc15'
      },
      boxShadow: {
        card: '0 16px 40px rgba(15, 23, 42, 0.08)'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
};

export default config;
