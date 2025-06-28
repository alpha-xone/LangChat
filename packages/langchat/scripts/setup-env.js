#!/usr/bin/env node

/**
 * Environment Setup Script for LangChat App
 * This script helps you create the necessary .env file for your LangChat app.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 LangChat Environment Setup');
console.log('=====================================\n');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('📋 Current configuration:');

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      const maskedValue = value.length > 10 ?
        value.substring(0, 10) + '...' :
        value;
      console.log(`  ${key}=${maskedValue}`);
    }
  });

  console.log('\n🔧 If you need to update your configuration, edit the .env file directly.');
  process.exit(0);
}

// Create .env.example if it doesn't exist
if (!fs.existsSync(envExamplePath)) {
  console.log('📄 Creating .env.example file...');

  const exampleContent = `# LangChat Configuration
# Copy this file to .env and fill in your actual values

# Supabase Configuration
# Get these from https://supabase.com/dashboard → Settings → API
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# LangGraph Configuration (Optional)
# If you're using a custom LangGraph server
EXPO_PUBLIC_LANGGRAPH_API_URL=http://localhost:2024
EXPO_PUBLIC_LANGGRAPH_ASSISTANT_ID=agent
EXPO_PUBLIC_LANGGRAPH_API_KEY=your-api-key
`;

  fs.writeFileSync(envExamplePath, exampleContent);
  console.log('✅ .env.example file created!');
}

console.log('📄 Creating .env file from .env.example...');

const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
fs.writeFileSync(envPath, exampleContent);

console.log('✅ .env file created successfully!');
console.log('\n🔧 Next steps:');
console.log('1. Edit the .env file and add your actual configuration values');
console.log('2. For Supabase:');
console.log('   - Go to https://supabase.com/dashboard');
console.log('   - Create a new project or select existing one');
console.log('   - Go to Settings > API');
console.log('   - Copy the Project URL and anon/public key');
console.log('3. For LangGraph:');
console.log('   - Set up your LangGraph server');
console.log('   - Update the API URL and credentials');
console.log('\n⚠️  Important: Never commit the .env file to version control!');
console.log('   The .env file should be in .gitignore');

console.log('\n🎯 After setting up your .env file, restart your development server.');
