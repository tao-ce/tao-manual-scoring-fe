// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/core/router');
jest.mock('@/core/utils/logger', () => ({
    log: { error: jest.fn() }
}));
jest.mock('@/config/env', () => variableName => {
    const environmentConfig = {
        API_URL: 'http://example.com'
    };

    return environmentConfig[variableName];
});
jest.mock('@/config', () => ({
    routes: {
        ltiError: '/ltiError'
    }
}));
jest.mock(
    '@/routes/task/[deliveryId]/[taskId]/+page.svelte',
    () =>
        function ({ props }) {
            this.$on = jest.fn();
            this.$destroy = jest.fn();
            this.$$props = props;
        }
);

jest.mock('path-to-regexp', () => ({
    match: () => () => ({
        params: {
            taskId: 'taskId1',
            deliveryId: 'deliveryId1'
        }
    })
}));

jest.mock('@/core/apiRequest/apiRequest');

jest.mock('@/services/authService', () => ({
    ROLE_LTI_USER: 'ROLE_LTI_USER',
    getUser: jest.fn(() => ({
        roles: []
    }))
}));

jest.mock('@/services/ltiService', () => ({
    getConfig() {
        return null;
    }
}));

import taskpageControllerFactory from './taskpage';
import config from '@/config';
import authService from '@/services/authService';

describe('Tasks controller', () => {
    test('controller is a factory', () => {
        expect(typeof taskpageControllerFactory).toBe('function');
        expect(taskpageControllerFactory()).not.toBe(taskpageControllerFactory());
    });

    test('it destroys component', async () => {
        const taskpageController = taskpageControllerFactory();
        await taskpageController.start();

        expect(taskpageController.component.$$props).toEqual({ deliveryId: 'deliveryId1', taskId: 'taskId1' });
        taskpageController.destroy();

        expect(taskpageController.component.$destroy).toHaveBeenCalled();
    });

    test('it redirect LTI user to error page if LTI parameters are not available in session storage', async () => {
        authService.getUser.mockImplementation(() => ({
            roles: [authService.ROLE_LTI_USER]
        }));
        const taskpageController = taskpageControllerFactory();

        await taskpageController.start();
        expect(taskpageController.router.replace).toHaveBeenCalledWith(config.routes.ltiError);
    });
});
