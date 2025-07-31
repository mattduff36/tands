/**
 * Simple security testing utilities for development
 * Note: Use proper penetration testing tools in production
 */

interface SecurityTestResult {
  test: string;
  passed: boolean;
  details?: string;
}

/**
 * Test rate limiting functionality
 */
export async function testRateLimit(endpoint: string, limit: number = 10): Promise<SecurityTestResult> {
  try {
    const results = [];
    
    // Make rapid requests to test rate limiting
    for (let i = 0; i < limit + 5; i++) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      
      results.push({
        request: i + 1,
        status: response.status,
        rateLimited: response.status === 429,
      });
    }
    
    const rateLimitedRequests = results.filter(r => r.rateLimited);
    const passed = rateLimitedRequests.length > 0;
    
    return {
      test: 'Rate Limiting',
      passed,
      details: `${rateLimitedRequests.length}/${results.length} requests were rate limited`,
    };
  } catch (error) {
    return {
      test: 'Rate Limiting',
      passed: false,
      details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Test CSRF protection
 */
export async function testCSRFProtection(endpoint: string): Promise<SecurityTestResult> {
  try {
    // Test request without proper origin header
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://malicious-site.com',
      },
      body: JSON.stringify({ test: true }),
    });
    
    const passed = response.status === 403;
    
    return {
      test: 'CSRF Protection',
      passed,
      details: `Request with malicious origin returned status ${response.status}`,
    };
  } catch (error) {
    return {
      test: 'CSRF Protection',
      passed: false,
      details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Test input validation
 */
export async function testInputValidation(endpoint: string): Promise<SecurityTestResult> {
  const maliciousPayloads = [
    { name: '<script>alert("xss")</script>', email: 'test@test.com', message: 'test' },
    { name: 'test', email: 'invalid-email', message: 'test' },
    { name: 'test', email: 'test@test.com', message: 'x'.repeat(10000) }, // Very long message
    { name: '', email: 'test@test.com', message: 'test' }, // Empty required field
  ];
  
  try {
    const results = [];
    
    for (const payload of maliciousPayloads) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      results.push({
        payload: JSON.stringify(payload).substring(0, 50) + '...',
        status: response.status,
        rejected: response.status === 400,
      });
    }
    
    const rejectedPayloads = results.filter(r => r.rejected);
    const passed = rejectedPayloads.length === maliciousPayloads.length;
    
    return {
      test: 'Input Validation',
      passed,
      details: `${rejectedPayloads.length}/${results.length} malicious payloads were rejected`,
    };
  } catch (error) {
    return {
      test: 'Input Validation',
      passed: false,
      details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Test security headers
 */
export async function testSecurityHeaders(endpoint: string): Promise<SecurityTestResult> {
  try {
    const response = await fetch(endpoint);
    
    const expectedHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy',
      'Referrer-Policy',
    ];
    
    const presentHeaders = expectedHeaders.filter(header => 
      response.headers.get(header) !== null
    );
    
    const passed = presentHeaders.length >= expectedHeaders.length * 0.8; // At least 80% of headers
    
    return {
      test: 'Security Headers',
      passed,
      details: `${presentHeaders.length}/${expectedHeaders.length} security headers present: ${presentHeaders.join(', ')}`,
    };
  } catch (error) {
    return {
      test: 'Security Headers',
      passed: false,
      details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Test error message sanitization
 */
export async function testErrorSanitization(endpoint: string): Promise<SecurityTestResult> {
  try {
    // Send malformed request to trigger error
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });
    
    const errorData = await response.json();
    const errorMessage = errorData.error || errorData.message || '';
    
    // Check if error message contains sensitive information
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /database/i,
      /localhost/i,
      /127\.0\.0\.1/,
      /c:\\/i,
      /\/home\//i,
    ];
    
    const containsSensitive = sensitivePatterns.some(pattern => 
      pattern.test(errorMessage)
    );
    
    const passed = !containsSensitive;
    
    return {
      test: 'Error Sanitization',
      passed,
      details: passed 
        ? 'Error messages appear to be properly sanitized'
        : `Error message may contain sensitive information: ${errorMessage.substring(0, 100)}`,
    };
  } catch (error) {
    return {
      test: 'Error Sanitization',
      passed: false,
      details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Run all security tests
 */
export async function runSecurityTests(baseUrl: string = 'http://localhost:3000'): Promise<SecurityTestResult[]> {
  const endpoints = {
    contact: `${baseUrl}/api/contact`,
    booking: `${baseUrl}/api/booking`,
    adminFleet: `${baseUrl}/api/admin/fleet`,
  };
  
  const results: SecurityTestResult[] = [];
  
  console.log('🔒 Running security tests...\n');
  
  // Test each endpoint
  for (const [name, endpoint] of Object.entries(endpoints)) {
    console.log(`Testing ${name} endpoint: ${endpoint}`);
    
    try {
      const tests = await Promise.all([
        testSecurityHeaders(endpoint),
        testInputValidation(endpoint),
        testErrorSanitization(endpoint),
        // Note: Rate limiting and CSRF tests might affect other tests, so run carefully
      ]);
      
      results.push(...tests);
    } catch (error) {
      results.push({
        test: `${name} endpoint`,
        passed: false,
        details: `Failed to test endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
  
  return results;
}

/**
 * Display security test results
 */
export function displaySecurityTestResults(results: SecurityTestResult[]): void {
  console.log('\n🔒 Security Test Results:\n');
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    console.log();
    
    if (result.passed) passed++;
    else failed++;
  });
  
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some security tests failed. Please review and fix the issues.');
  } else {
    console.log('\n🎉 All security tests passed!');
  }
}