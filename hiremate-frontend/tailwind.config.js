/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        mindskills: {
          shell: "#3b2b8e",      // Deep outer purple shell
          sidebar: "#32247b",    // Dark indigo sidebar
          darkPanel: "#2a1c6e",  // Extra dark violet container
          canvas: "#f4f2fd",     // Light lavender content canvas
          card: "#ffffff",       // Crisp white cards
          primary: "#5b48bd",    // Royal Violet / Primary Purple
          primaryHover: "#4a39a8",
          headerBg: "#5341be",   // Table header purple
          mint: "#10b981",       // Vibrant green pill / badge
          mintHover: "#059669",
          orange: "#f97316",     // Bright orange pill / badge
          orangeHover: "#ea580c",
          cyan: "#06b6d4",       // Electric cyan pill / badge
          cyanHover: "#0891b2",
          violet: "#8b5cf6",     // Light violet accent
          muted: "#94a3b8",      // Muted text
          textDark: "#1e1b4b",   // Deep indigo text
        },
        "surface-dim": "rgba(10, 14, 26, 0.65)",
        "on-primary-fixed": "#3d0020",
        "error": "#ef4444",
        "primary": "#5b48bd",
        "secondary": "#10b981",
        "tertiary": "#f97316",
        "background": "#3b2b8e",
        "surface": "#ffffff",
        obsidian: {
          DEFAULT: '#0B0F17',
          light: '#111827',
          dark: '#070A0F',
          card: '#131B2B'
        },
        brand: {
          primary: '#5b48bd',
          accent: '#10b981',
          purple: '#8b5cf6'
        },
        botanical: {
          forest: '#2D3A31',
          sage: '#4E6545',
          terracotta: '#B35D46',
          stone: '#D4CEBE',
          cream: '#FAF9F5',
          clay: '#C7AC9F',
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "Source Sans 3", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        serif: ["Plus Jakarta Sans", "Georgia", "serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        headline: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        body: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        label: ["Plus Jakarta Sans", "sans-serif"]
      },
      boxShadow: {
        'mindskills': '0 10px 30px -5px rgba(59, 43, 142, 0.08)',
        'mindskills-lg': '0 20px 40px -10px rgba(59, 43, 142, 0.15)',
        'mindskills-pill': '0 4px 14px 0 rgba(59, 43, 142, 0.12)',
        'soft': '0 4px 6px -1px rgba(59, 43, 142, 0.05)',
        'soft-md': '0 10px 15px -3px rgba(59, 43, 142, 0.08)',
        'soft-lg': '0 20px 40px -10px rgba(59, 43, 142, 0.12)',
      },
    },
  },
  plugins: [],
}

