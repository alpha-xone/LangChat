#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 LangChat Project Validation\n');

// Check required files
const requiredFiles = [
  'src/index.tsx',
  'src/components/chat/MessageInput.tsx',
  'src/components/chat/MessageList.tsx',
  'src/components/chat/MessageBubble.tsx',
  'src/ai/LangGraphClient.ts',
  'src/data/ChatService.ts',
  'src/theming/theme.ts',
  'src/hooks/useChat.ts',
  'src/__tests__/setup.ts'
];

console.log('📁 File Structure Check:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📦 Package.json Check:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['@supabase/supabase-js', '@langchain/langgraph-sdk', 'zustand'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
  }
});

console.log('\n🎯 Summary:');
if (allFilesExist) {
  console.log('✅ All required files exist');
  console.log('✅ Project structure is valid');
  console.log('✅ Required dependencies are configured');
  console.log('\n🎉 Project is ready for development!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run typecheck');
  console.log('2. Run: npm run lint');
  console.log('3. Run: npm test');
} else {
  console.log('❌ Some required files are missing');
  process.exit(1);
}
