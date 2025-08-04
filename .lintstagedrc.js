module.exports = {
  // Light formatting only - no heavy linting or testing
  '*.{js,jsx,ts,tsx}': [
    'prettier --write',
  ],
  
  // Run Prettier on other files
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
};