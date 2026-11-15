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
          navy: '#14213D',
          royal: '#2563EB',
          'royal-hover': '#1D4ED8',
          'royal-light': '#EFF6FF',
          orange: '#F59E0B',
          'orange-hover': '#D97706',
          'orange-light': '#FEF3C7',
          bg: '#F7F8FC',
          dark: '#111827',
          muted: '#6B7280',
          lightMuted: '#9CA3AF',
          border: '#E5E7EB',
          success: '#16A34A',
          error: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(20, 33, 61, 0.05), 0 1px 2px 0 rgba(20, 33, 61, 0.03)',
        'card': '0 4px 6px -1px rgba(20, 33, 61, 0.06), 0 2px 4px -1px rgba(20, 33, 61, 0.04)',
        'card-hover': '0 10px 15px -3px rgba(20, 33, 61, 0.1), 0 4px 6px -2px rgba(20, 33, 61, 0.05)',
        'premium': '0 20px 25px -5px rgba(20, 33, 61, 0.08), 0 10px 10px -5px rgba(20, 33, 61, 0.04)',
      }
    },
  },
  plugins: [],
}
