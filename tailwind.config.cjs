/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#1A2B48',
        'brand-orange': '#FF8C00',
        'brand-ice': '#F8F9FA',
      },
      fontFamily: {
        title: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      }
    },
  },
  plugins: [],
}

