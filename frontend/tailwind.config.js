/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}", // Pages Router のパス
    "./components/**/*.{js,ts,jsx,tsx}", // (components フォルダも対象にする場合)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
