#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 LangChat Testing Setup Validator\n');

// Test configuration
const tests = [
  {
    name: 'Root Package Dependencies',
    command: 'npm list --depth=0',
    cwd: process.cwd(),
    expectedPatterns: ['@supabase/supabase-js', '@langchain/langgraph-sdk', 'zustand']
  },
  {
    name: 'TypeScript Configuration',
    command: 'npx tsc --noEmit',
    cwd: process.cwd(),
    expectedPatterns: []
  },
  {
    name: 'ESLint Configuration',
    command: 'npx eslint --print-config src/index.tsx',
    cwd: process.cwd(),
    expectedPatterns: ['rules']
  },
  {
    name: 'Jest Configuration',
    command: 'npx jest --showConfig',
    cwd: process.cwd(),
    expectedPatterns: ['react-native']
  }
];

// File structure validation
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

let passedTests = 0;
let totalTests = tests.length + requiredFiles.length;

console.log('📁 Checking file structure...');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
    passedTests++;
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

console.log('\n🔧 Running configuration tests...');
tests.forEach(test => {
  console.log(`\n🧪 ${test.name}`);
  try {
    const result = execSync(test.command, {
      cwd: test.cwd,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    if (test.expectedPatterns.length === 0) {
      console.log('✅ PASSED');
      passedTests++;
    } else {
      const allPatternsFound = test.expectedPatterns.every(pattern =>
        result.includes(pattern)
      );

      if (allPatternsFound) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED - Missing expected patterns');
        console.log('Expected patterns:', test.expectedPatterns);
      }
    }
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Error:', error.message);
  }
});

console.log('\n📊 Test Summary');
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! Your LangChat setup is ready for development.');
} else {
  console.log('\n⚠️  Some tests failed. Please check the output above and fix the issues.');
}

console.log('\n🚀 Next steps:');
console.log('1. Run: npm test');
console.log('2. Run: npm run typecheck');
console.log('3. Run: npm run lint');
console.log('4. Start example app: cd example && npm start');
