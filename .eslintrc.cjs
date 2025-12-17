// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

module.exports = {
    extends: ['@oat-sa/eslint-config-tao/svelte', 'prettier'],
    parser: '@babel/eslint-parser',
    rules: {
        'no-import-assign': 0
    }
};
