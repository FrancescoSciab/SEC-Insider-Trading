module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'commonjs',
  },
  rules: {
    // Catch real bugs
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next' }],
    'no-console': 'warn',           // Use logger, not console.log
    'no-process-exit': 'warn',
    'handle-callback-err': 'error',

    // Code style
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'warn',
    'curly': 'error',

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
  },
  ignorePatterns: ['node_modules/', 'coverage/'],
};
