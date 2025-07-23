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

async function setupServiceAccount() {
  console.log('🔧 TSB Bouncy Castle - Google Service Account Setup\n');
  
  const method = await question('How would you like to provide the service account credentials?\n1. Upload JSON file path\n2. Paste JSON content directly\n3. Enter individual fields\nChoose (1-3): ');

  let serviceAccountData = {};

  switch (method.trim()) {
    case '1':
      serviceAccountData = await handleJSONFile();
      break;
    case '2':
      serviceAccountData = await handleJSONContent();
      break;
    case '3':
      serviceAccountData = await handleIndividualFields();
      break;
    default:
      console.log('Invalid option selected.');
      rl.close();
      return;
  }

  if (serviceAccountData) {
    await updateEnvironmentFile(serviceAccountData);
    console.log('\n✅ Service account credentials configured successfully!');
    console.log('📝 Updated .env.local with service account details');
    console.log('\n🔒 Security reminder:');
    console.log('- Never commit .env.local to version control');
    console.log('- Keep your service account JSON file secure');
    console.log('- Share your calendar with the service account email');
  }

  rl.close();
}

async function handleJSONFile() {
  const filePath = await question('\nEnter the path to your service account JSON file: ');
  
  try {
    const absolutePath = path.resolve(filePath.trim());
    if (!fs.existsSync(absolutePath)) {
      console.log('❌ File not found:', absolutePath);
      return null;
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    const serviceAccount = JSON.parse(fileContent);
    
    console.log('✅ Service account JSON file loaded successfully');
    console.log('📧 Service account email:', serviceAccount.client_email);
    
    return serviceAccount;
  } catch (error) {
    console.log('❌ Error reading JSON file:', error.message);
    return null;
  }
}

async function handleJSONContent() {
  console.log('\nPaste your service account JSON content (press Enter twice when done):');
  
  let jsonContent = '';
  let emptyLineCount = 0;
  
  const jsonRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    jsonRl.on('line', (line) => {
      if (line.trim() === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
          jsonRl.close();
          try {
            const serviceAccount = JSON.parse(jsonContent);
            console.log('✅ Service account JSON parsed successfully');
            console.log('📧 Service account email:', serviceAccount.client_email);
            resolve(serviceAccount);
          } catch (error) {
            console.log('❌ Error parsing JSON:', error.message);
            resolve(null);
          }
        }
      } else {
        jsonContent += line + '\n';
        emptyLineCount = 0;
      }
    });
  });
}

async function handleIndividualFields() {
  console.log('\nEnter the individual service account fields:');
  
  const projectId = await question('Project ID: ');
  const clientEmail = await question('Client Email (service account email): ');
  const privateKey = await question('Private Key (paste the entire key including BEGIN/END lines): ');
  const clientId = await question('Client ID: ');

  if (!projectId || !clientEmail || !privateKey || !clientId) {
    console.log('❌ All fields are required');
    return null;
  }

  return {
    type: 'service_account',
    project_id: projectId.trim(),
    client_email: clientEmail.trim(),
    private_key: privateKey.trim(),
    client_id: clientId.trim()
  };
}

async function updateEnvironmentFile(serviceAccount) {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Copy from template
    const templatePath = path.join(process.cwd(), '.env.local.example');
    if (fs.existsSync(templatePath)) {
      envContent = fs.readFileSync(templatePath, 'utf8');
    }
  }

  // Update service account related variables
  const updates = {
    'GOOGLE_SERVICE_ACCOUNT_EMAIL': serviceAccount.client_email,
    'GOOGLE_PRIVATE_KEY': `"${serviceAccount.private_key}"`,
    'GOOGLE_PROJECT_ID': serviceAccount.project_id
  };

  // Apply updates
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  // Write updated content
  fs.writeFileSync(envPath, envContent);
  
  // Also create a base64 encoded version for production use
  const serviceAccountBase64 = Buffer.from(JSON.stringify(serviceAccount)).toString('base64');
  const base64Regex = /^GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=.*$/m;
  if (base64Regex.test(envContent)) {
    envContent = envContent.replace(base64Regex, `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=${serviceAccountBase64}`);
  } else {
    envContent += `\nGOOGLE_SERVICE_ACCOUNT_KEY_BASE64=${serviceAccountBase64}`;
  }
  
  fs.writeFileSync(envPath, envContent);
}

// Run setup if called directly
if (require.main === module) {
  setupServiceAccount().catch(console.error);
}

module.exports = { setupServiceAccount };