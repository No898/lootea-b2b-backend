module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'prettier'
    ],
    plugins: ['jest'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        // Základní pravidla
        'no-console': 'warn',
        'no-unused-vars': 'error',
        'no-undef': 'error',

        // Jest specifická pravidla
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',

        // Code style
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'warn',
        'prefer-arrow-callback': 'warn'
    },
    overrides: [
        {
            files: ['tests/**/*.js'],
            rules: {
                'no-console': 'off' // V testech je console.log OK
            }
        }
    ]
}; 