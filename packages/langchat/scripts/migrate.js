#!/usr/bin/env node

/**
 * Migration Helper for LangChat
 * This script helps migrate existing LangChat apps to use the new package structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 LangChat Migration Helper');
console.log('============================\n');

const migrations = [
  {
    description: 'Update imports in app/_layout.tsx',
    file: 'app/_layout.tsx',
    updates: [
      {
        from: "import { AppThemeProvider } from '@/contexts/AppThemeContext';",
        to: "import { AppThemeProvider, AuthProvider, createDefaultSupabaseClient } from '@/packages/langchat/src';"
      },
      {
        from: "import { AuthProvider } from '@/contexts/SupabaseAuthContext';",
        to: "// Moved to package import above"
      }
    ]
  },
  {
    description: 'Update imports in chat pages',
    patterns: [
      {
        from: "import ProtectedRoute from '@/components/ProtectedRoute';",
        to: "import { ProtectedRoute } from '@/packages/langchat/src';"
      },
      {
        from: "import { useAppTheme } from '@/contexts/AppThemeContext';",
        to: "import { useAppTheme } from '@/packages/langchat/src';"
      },
      {
        from: "import { useAuth } from '@/contexts/SupabaseAuthContext';",
        to: "import { useAuth } from '@/packages/langchat/src';"
      },
      {
        from: "import { ChatProvider } from '@/contexts/ChatContext';",
        to: "import { ChatProvider } from '@/packages/langchat/src';"
      }
    ]
  }
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Apply pattern replacements
  migrations.forEach(migration => {
    if (migration.patterns) {
      migration.patterns.forEach(pattern => {
        if (content.includes(pattern.from)) {
          content = content.replace(pattern.from, pattern.to);
          modified = true;
          console.log(`✅ Updated import in ${filePath}`);
        }
      });
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Scanning for files to migrate...\n');

  const filesToCheck = [
    'app/_layout.tsx',
    'app/chat.tsx',
    'app/profile.tsx',
    'app/index.tsx'
  ];

  let totalUpdated = 0;

  filesToCheck.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (processFile(fullPath)) {
      totalUpdated++;
    }
  });

  console.log(`\n✅ Migration complete! Updated ${totalUpdated} files.`);

  if (totalUpdated > 0) {
    console.log('\n🔧 Next steps:');
    console.log('1. Remove old component files if no longer needed:');
    console.log('   - components/ProtectedRoute.tsx');
    console.log('   - components/SignInScreen.tsx');
    console.log('   - components/UserProfileScreen.tsx');
    console.log('   - components/ConfigurationError.tsx');
    console.log('   - contexts/AppThemeContext.tsx');
    console.log('   - contexts/SupabaseAuthContext.tsx');
    console.log('   - contexts/ChatContext.tsx');
    console.log('   - lib/supabase.ts');
    console.log('   - lib/oauth-*.ts');
    console.log('');
    console.log('2. Test your app to ensure everything works correctly');
    console.log('3. Update your package.json dependencies if needed');
  }

  console.log('\n📖 For complete migration guide, see the package README.md');
}

main().catch(console.error);
