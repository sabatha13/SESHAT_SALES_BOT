/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#050507',
        obsidian: '#0D0D0F',
        onyx: '#141416',
        charcoal: '#1C1C1F',
        ash: '#2A2A2E',
        mist: '#3D3D42',
        gold: {
          50:  '#FDF8EC',
          100: '#FAF0D0',
          200: '#F4DFA0',
          300: '#ECCF6E',
          400: '#E4BF42',
          500: '#D4AF37',
          600: '#B8962A',
          700: '#9A7B1E',
          800: '#7C6115',
          900: '#5E490E',
        },
        silver: {
          300: '#C8C8CC',
          400: '#ADADB3',
          500: '#8E8E95',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F4DFA0 50%, #D4AF37 100%)',
        'dark-gradient': 'linear-gradient(180deg, #050507 0%, #0D0D0F 100%)',
        'card-gradient': 'linear-gradient(145deg, #1C1C1F 0%, #141416 100%)',
        'glow-gold': 'radial-gradient(ellipse at center, rgba(212,175,55,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'gold-sm': '0 0 10px rgba(212,175,55,0.2)',
        'gold-md': '0 0 20px rgba(212,175,55,0.3)',
        'gold-lg': '0 0 40px rgba(212,175,55,0.25)',
        'gold-xl': '0 0 60px rgba(212,175,55,0.2)',
        'inner-gold': 'inset 0 0 30px rgba(212,175,55,0.05)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.8)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'pulse-gold': 'pulse-gold 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(212,175,55,0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(212,175,55,0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
