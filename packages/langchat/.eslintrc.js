module.exports = {
  extends: [
    'expo',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '*.js',
    '*.d.ts'
  ],
};