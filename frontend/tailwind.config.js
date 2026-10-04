/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E44332',
          hover: '#C53B2C',
          active: '#B03022',
          light: '#FDF3F2',
          border: '#FADCD8',
        },
        cream: {
          DEFAULT: '#FAF8F5',
          50: '#FCFBF9',
          100: '#FAF8F5',
          200: '#F5F1EB',
          300: '#EDE6DD',
        },
        todoist: {
          bg: '#FAF8F5',
          surface: '#FFFFFF',
          dark: '#1E1F21',
          text: '#1E1F21',
          subtext: '#555555',
          muted: '#808080',
          border: '#EEEEEE',
          borderStrong: '#E0E0E0',
          hover: '#F3F3F3',
        },
        priority: {
          p1: '#D1453B',
          p2: '#EB8909',
          p3: '#246FE0',
          p4: '#808080',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 20px 50px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'modal': '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
        'dropdown': '0 10px 30px -5px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
