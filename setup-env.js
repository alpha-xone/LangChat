#!/usr/bin/env node

/**
 * Environment Setup Script for LangChat App
 * This script helps you create the necessary .env file for your LangChat app.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 LangChat Environment Setup');
console.log('=====================================\n');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

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

// Copy from .env.example if it doesn't exist
if (!fs.existsSync(envExamplePath)) {
  console.log('❌ .env.example file not found');
  process.exit(1);
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
console.log('   The .env file is already in .gitignore');

console.log('\n🎯 After setting up your .env file, restart your development server.');
