/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EAF1EA',
        sheet: '#F7FBF7',
        ink: '#12211B',
        muted: '#5A6F63',
        rule: '#C3D3C6',
        credit: '#1F5D45',
        debit: '#A33B2A',
      },
      fontFamily: {
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        ledger: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        sheet: '0 1px 0 rgba(18,33,27,0.06), 0 12px 28px -22px rgba(18,33,27,0.45)',
      },
    },
  },
  plugins: [],
};
