// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const path = require('path');
const { defaults } = require('jest-config');

module.exports = {
    verbose: true,
    transform: {
        '^.+\\.js$': ['babel-jest', { configFile: path.join(__dirname, 'babel.jest.config.cjs') }],
        '^.+\\.svelte$': ['@oat-sa/jest-transform-svelte', { compilerOptions: { dev: false }, noStyles: true }]
    },
    transformIgnorePatterns: ['node_modules/(?!@oat-sa)'],
    moduleNameMapper: {
        '@/(.*)$': '<rootDir>/src/$1',
        '^core/(.*)$': '<rootDir>/node_modules/@oat-sa/tao-core-sdk/src/core/$1',
        '^util/(.*)$': '<rootDir>/node_modules/@oat-sa/tao-core-sdk/src/util/$1',
        '^lib/(.*)$': '<rootDir>/node_modules/@oat-sa/tao-core-libs/src/$1',
        '.+\\.(css)$': 'jest-transform-css'
    },
    collectCoverageFrom: ['!<rootDir>/**/index.js', '<rootDir>/src/**/*.{js,svelte}'],
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'svelte'],
    testMatch: ['**/*.spec.js'],
    testPathIgnorePatterns: ['node_modules'],
    coverageReporters: ['json', 'text', 'html'],
    coveragePathIgnorePatterns: ['/node_modules/', '\\.stor(y|ies)\\.svelte$'],
    setupFilesAfterEnv: ['./jest.setup.js', 'jest-extended'],
    resolver: path.join(__dirname, 'jest.resolver.cjs')
};
