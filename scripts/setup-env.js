#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🔧 TSB Bouncy Castle Admin - Environment Setup\n');
  
  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('Please provide the following Google Cloud Console credentials:\n');
  
  // Collect Google OAuth credentials
  const googleClientId = await question('Google OAuth Client ID: ');
  const googleClientSecret = await question('Google OAuth Client Secret: ');
  
  console.log('\nService Account credentials:');
  const serviceAccountEmail = await question('Service Account Email: ');
  const projectId = await question('Google Cloud Project ID: ');
  
  console.log('\nPrivate Key (paste the entire key including BEGIN/END lines):');
  const privateKey = await question('Private Key: ');
  
  // Generate NextAuth secret
  const crypto = require('crypto');
  const nextAuthSecret = crypto.randomBytes(32).toString('base64');
  
  console.log('\nOptional settings (press Enter for defaults):');
  const primaryCalendarId = await question('Primary Calendar ID (default: tsbouncycastlehire@gmail.com): ') || 'tsbouncycastlehire@gmail.com';
  const adminEmails = await question('Admin Emails (default: tsbouncycastlehire@gmail.com,matt.mpdee@gmail.com): ') || 'tsbouncycastlehire@gmail.com,matt.mpdee@gmail.com';
  const databaseUrl = await question('Database URL (optional): ') || '';
  
  console.log('\nEmail SMTP Configuration (for automated agreement emails):');
  const emailSmtpUser = await question('Email SMTP User (Gmail address): ') || '';
  const emailSmtpPass = await question('Email SMTP Password (App Password): ') || '';
  const emailFromName = await question('Email From Name (default: Taylors & Smiths Bouncy Castles): ') || 'Taylors & Smiths Bouncy Castles';
  const emailEnabled = await question('Enable Email Service? (y/N): ') || 'n';
  
  // Create .env.local content
  const envContent = `# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${nextAuthSecret}

# Google Calendar Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=${serviceAccountEmail}
GOOGLE_PRIVATE_KEY="${privateKey}"
GOOGLE_PROJECT_ID=${projectId}

# Admin Configuration
ADMIN_EMAILS=${adminEmails}
PRIMARY_CALENDAR_ID=${primaryCalendarId}

# Database Configuration
${databaseUrl ? `DATABASE_URL=${databaseUrl}` : '# DATABASE_URL=your_database_connection_string_here'}

# Email SMTP Configuration
EMAIL_ENABLED=${emailEnabled.toLowerCase() === 'y' || emailEnabled.toLowerCase() === 'yes' ? 'true' : 'false'}
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=${emailSmtpUser}
EMAIL_SMTP_PASS=${emailSmtpPass}
EMAIL_FROM_NAME=${emailFromName}
EMAIL_FROM_ADDRESS=${emailSmtpUser}
EMAIL_DEBUG=true
EMAIL_TRACKING_PIXEL_ENABLED=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AGREEMENT_BASE_URL=http://localhost:3000/hire-agreement

# Environment
NODE_ENV=development
`;

  // Write .env.local file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment setup complete!');
  console.log('📁 Created .env.local with your credentials');
  console.log('🔒 Make sure .env.local is in your .gitignore (it should be)');
  console.log('\nNext steps:');
  console.log('1. Install required dependencies: npm install');
  console.log('2. Follow the Google Cloud setup guide in docs/google-cloud-setup.md');
  console.log('3. Run the development server: npm run dev\n');
  
  rl.close();
}

// Run setup if called directly
if (require.main === module) {
  setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment };