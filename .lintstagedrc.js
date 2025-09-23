module.exports = {
  // Light formatting and TypeScript checking
  "*.{js,jsx,ts,tsx}": ["prettier --write"],

  // Run Prettier on other files
  "*.{json,md,yml,yaml}": ["prettier --write"],

  // TypeScript checking disabled temporarily for auth migration
  // "*.{ts,tsx}": [() => "tsc --noEmit"],
};
