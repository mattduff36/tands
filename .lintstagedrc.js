module.exports = {
  // Light formatting and TypeScript checking
  "*.{js,jsx,ts,tsx}": ["prettier --write"],

  // Run Prettier on other files
  "*.{json,md,yml,yaml}": ["prettier --write"],

  // TypeScript checking on TS/TSX files - catches build errors early
  "*.{ts,tsx}": [() => "tsc --noEmit"],
};
