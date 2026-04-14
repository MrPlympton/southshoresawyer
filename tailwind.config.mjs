/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest:  { DEFAULT: '#1C2E1C', dark: '#111C11', light: '#2D4A2D' },
        bark:    { DEFAULT: '#3D2410', light: '#5C3820' },
        amber:   { DEFAULT: '#C8881A', light: '#E8A832', pale: '#F5DFA0' },
        sawdust: { DEFAULT: '#F7F0E4', dark: '#EDE0CC' },
        steel:   { DEFAULT: '#4A5568', light: '#718096' },
        cream:   '#FAF6EE',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Source Serif 4"', 'Georgia', 'serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
