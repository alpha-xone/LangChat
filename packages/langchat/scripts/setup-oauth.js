#!/usr/bin/env node

/**
 * OAuth Setup Helper for LangChat
 * This script helps you configure OAuth providers (Google, Apple, X/Twitter)
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 LangChat OAuth Setup Helper');
console.log('===============================\n');

const oauthProviders = [
  {
    name: 'Google',
    key: 'EXPO_PUBLIC_GOOGLE_CLIENT_ID',
    description: 'Google OAuth Client ID from Google Cloud Console',
    setupUrl: 'https://console.cloud.google.com',
    optional: true
  },
  {
    name: 'Apple',
    key: 'EXPO_PUBLIC_APPLE_CLIENT_ID',
    description: 'Apple Services ID from Apple Developer Console',
    setupUrl: 'https://developer.apple.com',
    optional: true
  },
  {
    name: 'Twitter/X',
    key: 'EXPO_PUBLIC_TWITTER_API_KEY',
    description: 'Twitter API Key from Twitter Developer Portal',
    setupUrl: 'https://developer.twitter.com',
    optional: true
  }
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('This script will help you configure OAuth providers for your LangChat app.\n');
  console.log('⚠️  Prerequisites:');
  console.log('1. Supabase project with OAuth providers enabled');
  console.log('2. OAuth apps configured with each provider');
  console.log('3. Redirect URLs configured in provider consoles\n');

  const envPath = path.join(process.cwd(), '.env');
  const answers = {};

  // Ask about each OAuth provider
  for (const provider of oauthProviders) {
    console.log(`\n📱 ${provider.name} OAuth Setup`);
    console.log(`   Setup URL: ${provider.setupUrl}`);

    const wantToSetup = await askQuestion(`Do you want to configure ${provider.name} OAuth? (y/n): `);

    if (wantToSetup.toLowerCase() === 'y' || wantToSetup.toLowerCase() === 'yes') {
      const value = await askQuestion(`Enter your ${provider.description}:\n  > `);
      if (value) {
        answers[provider.key] = value;
      }
    }
  }

  // Ask for custom redirect URL
  console.log('\n🔗 OAuth Redirect Configuration');
  const customRedirect = await askQuestion('Enter custom OAuth redirect URL (or press Enter for default):\n  Default: langchat://auth/callback\n  > ');

  if (customRedirect) {
    answers['EXPO_PUBLIC_AUTH_REDIRECT_URL'] = customRedirect;
  }

  // Read existing .env file or create new one
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('\n✅ Found existing .env file, updating...');
  } else {
    console.log('\n📝 Creating new .env file...');
    // Copy from .env.example if it exists
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    }
  }

  // Update or add new environment variables
  const envLines = envContent.split('\n');

  // Add OAuth section header if not exists
  if (!envContent.includes('# OAuth Configuration')) {
    envLines.push('');
    envLines.push('# OAuth Configuration (Optional)');
  }

  Object.entries(answers).forEach(([key, value]) => {
    if (value) {
      const existingLineIndex = envLines.findIndex(line => line.startsWith(`${key}=`));
      const newLine = `${key}=${value}`;

      if (existingLineIndex >= 0) {
        envLines[existingLineIndex] = newLine;
      } else {
        // Add after the OAuth header
        const oauthIndex = envLines.findIndex(line => line.includes('# OAuth Configuration'));
        if (oauthIndex >= 0) {
          envLines.splice(oauthIndex + 1, 0, newLine);
        } else {
          envLines.push(newLine);
        }
      }
    }
  });

  // Write updated .env file
  fs.writeFileSync(envPath, envLines.join('\n'));

  console.log('\n✅ OAuth configuration updated successfully!');

  if (Object.keys(answers).length > 0) {
    console.log('\n📋 OAuth settings configured:');
    Object.entries(answers).forEach(([key, value]) => {
      if (value) {
        const maskedValue = value.length > 10 ?
          value.substring(0, 10) + '...' :
          value;
        console.log(`  ${key}=${maskedValue}`);
      }
    });
  }

  console.log('\n🔧 Next steps:');
  console.log('1. Configure OAuth providers in Supabase Dashboard:');
  console.log('   - Go to Authentication > Providers');
  console.log('   - Enable and configure each OAuth provider');
  console.log('   - Set redirect URLs to: https://your-project.supabase.co/auth/v1/callback');
  console.log('');
  console.log('2. Update your OAuth provider consoles:');
  console.log('   - Add redirect URI: langchat://auth/callback');
  console.log('   - Add your app bundle ID/package name');
  console.log('   - Configure authorized domains');
  console.log('');
  console.log('3. Test OAuth flows:');
  console.log('   - Build and test on real devices');
  console.log('   - Verify OAuth buttons appear in sign-in screen');
  console.log('   - Test complete authentication flow');
  console.log('');
  console.log('📖 For detailed setup instructions, see:');
  console.log('   - LangChat documentation');
  console.log('   - Supabase Auth documentation');
  console.log('   - Provider-specific setup guides');

  rl.close();
}

main().catch(console.error);
