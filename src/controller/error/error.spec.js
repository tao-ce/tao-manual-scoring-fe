// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/config/env', () => variableName => {
    const environmentConfig = {
        API_URL: 'http://example.com'
    };

    return environmentConfig[variableName];
});
jest.mock(
    '@/routes/error/+page.svelte',
    () =>
        function() {
            this.$on = jest.fn();
            this.$destroy = jest.fn();
        }
);

import errorControllerFactory from './error';

describe('Error controller', () => {
    test('controller is a factory', () => {
        expect(typeof errorControllerFactory).toBe('function');
        expect(errorControllerFactory()).not.toBe(errorControllerFactory());
    });

    test('it destroys component', () => {
        const errorController = errorControllerFactory();
        errorController.setPageTitle = jest.fn();
        errorController.start();
        errorController.destroy();

        expect(errorController.component.$destroy).toHaveBeenCalled();
    });
});
