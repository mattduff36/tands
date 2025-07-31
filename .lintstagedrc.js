module.exports = {
  // Run ESLint on TypeScript and JavaScript files
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // Run Prettier on other files
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
  
  // Run type checking on TypeScript files
  '*.{ts,tsx}': [
    () => 'tsc --noEmit',
  ],
  
  // Run tests related to changed files
  '*.{ts,tsx}': [
    'npm run test:run --passWithNoTests',
  ],
};