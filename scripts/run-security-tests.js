/**
 * Script to run security tests
 * Usage: node scripts/run-security-tests.js
 */

const { runSecurityTests, displaySecurityTestResults } = require('../src/lib/utils/security-test');

async function main() {
  try {
    console.log('🔒 Starting security tests...\n');
    
    // Run tests against local development server
    const results = await runSecurityTests('http://localhost:3000');
    
    // Display results
    displaySecurityTestResults(results);
    
    // Exit with appropriate code
    const failedTests = results.filter(r => !r.passed);
    process.exit(failedTests.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Security test runner failed:', error);
    process.exit(1);
  }
}

main();