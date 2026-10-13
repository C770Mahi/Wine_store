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
          DEFAULT: '#0f8ea2',
          dark: '#166072',
          soft: '#e7f8fb'
        },
        ink: '#111827',
        muted: '#6b7280',
        surface: '#f8fafc',
        accent: '#ff8a2b'
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
