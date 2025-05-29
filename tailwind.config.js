module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'ochi-gradient': 'linear-gradient(to bottom right, #6bc0ba, #0b7479)',
      },
    },
  },
  plugins: [],
}