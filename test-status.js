#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 LangChat Project Status Check\n');

// Quick status checks
const checks = [
  {
    name: 'Node.js version',
    command: 'node --version',
    shouldSucceed: true
  },
  {
    name: 'TypeScript installed',
    command: 'npx tsc --version',
    shouldSucceed: true
  },
  {
    name: 'TypeScript compilation',
    command: 'npx tsc --noEmit --skipLibCheck',
    shouldSucceed: true
  },
  {
    name: 'ESLint configuration',
    command: 'npx eslint --version',
    shouldSucceed: true
  },
  {
    name: 'ESLint check',
    command: 'npx eslint "src/**/*.{ts,tsx}" --max-warnings=0',
    shouldSucceed: true
  }
];

let passed = 0;
let total = checks.length;

checks.forEach((check, index) => {
  process.stdout.write(`${index + 1}. ${check.name}... `);

  try {
    const result = execSync(check.command, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000
    });

    if (check.shouldSucceed) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ UNEXPECTED SUCCESS');
    }
  } catch (error) {
    if (check.shouldSucceed) {
      console.log('❌ FAILED');
      console.log(`   Error: ${error.message.split('\n')[0]}`);
    } else {
      console.log('✅ PASSED (Expected failure)');
      passed++;
    }
  }
});

console.log(`\n📊 Results: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log('🎉 All checks passed! Project is ready for development.');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the issues above.');
  process.exit(1);
}
