module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['react', 'react-hooks', 'react-native'],
  env: {
    browser: false,
    es2021: true,
    'react-native/react-native': true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // React
    'react/prop-types': 'off',         // Not using PropTypes (would use TypeScript)
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/display-name': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Native specific
    'react-native/no-unused-styles': 'warn',
    'react-native/no-inline-styles': 'warn',  // Performance: inline styles bypass StyleSheet
    'react-native/no-color-literals': 'warn', // Should use theme.js colours

    // General
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'prefer-const': 'warn',
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/'],
};
