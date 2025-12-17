// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
jest.mock('../services/analyticsService');
jest.mock('module');

import router from './router';
const loginControllerFactory = () => ({
    prepare: jest.fn(),
    start: jest.fn(),
    destroy: jest.fn(),
    clean: jest.fn(),
    mountCookiePolicyWrapper: jest.fn(),
    destroyAdditionalComponents: jest.fn()
});
const loginRoute = {
    path: '/login',
    controller: jest.fn().mockResolvedValue({ default: loginControllerFactory })
};
const guardedRoute = {
    path: '/scoringprojects',
    guard: jest.fn().mockResolvedValue({}),
    controller: jest.fn().mockResolvedValue({})
};
const errorRoute = {
    path: '(.*)',
    controller: jest.fn().mockResolvedValue({})
};

const routingTable = [loginRoute, guardedRoute, errorRoute];

describe('router', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'history', {
            writable: true,
            value: {
                state: {},
                pushState: jest.fn()
            }
        });
        Object.defineProperty(window, 'location', {
            writable: true,
            value: {
                ancestorOrigins: {},
                href: 'https://sds-fe-terre.docker.localhost/login',
                origin: 'https://sds-fe-terre.docker.localhost',
                protocol: 'https:',
                host: 'sds-fe-terre.docker.localhost',
                hostname: 'sds-fe-terre.docker.localhost',
                port: '',
                pathname: '/login',
                search: '',
                hash: ''
            }
        });
        router.start(routingTable);
    });

    afterEach(() => {
        router.stop();
    });
    it('router redirects', () => {
        /* eslint-disable no-undefined */
        router.redirect('/login');
        expect(window.history.pushState).toHaveBeenCalledWith(
            { url: '/login' },
            undefined,
            'https://sds-fe-terre.docker.localhost/login'
        );

        router.redirect('/scoringprojects');
        expect(window.history.pushState).toHaveBeenCalledWith(
            { url: '/scoringprojects' },
            undefined,
            'https://sds-fe-terre.docker.localhost/scoringprojects'
        );
        /* eslint-enable no-undefined */
        expect(guardedRoute.guard).toBeCalled();
    });

    it('router starts controller', () => {
        const controller = {
            prepare: jest.fn(),
            start: jest.fn(),
            mountCookiePolicyWrapper: jest.fn()
        };
        const params = { param1: '1', param2: '2' };

        router.startController(controller, params);
        expect(controller.start).toBeCalledWith(params);
        expect(controller.mountCookiePolicyWrapper).toBeCalled();
    });
});
