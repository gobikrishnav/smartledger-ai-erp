export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // STRICT BW PALETTE ONLY
        primary: { DEFAULT: '#000000', hover: '#222222' },
        secondary: { DEFAULT: '#ffffff', hover: '#f3f3f3' },
        muted: { DEFAULT: '#888888', light: '#bbbbbb', dark: '#555555' },
        border: { DEFAULT: '#d0d0d0', dark: '#888888' },
        surface: { DEFAULT: '#ffffff', muted: '#f9f9f9', hover: '#f3f3f3' },
      }
    }
  },
  plugins: []
}
