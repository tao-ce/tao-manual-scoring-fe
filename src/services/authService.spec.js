// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2022 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('../core/apiRequest/apiRequest');
jest.mock('core/jwt/jwtToken', () => ({
    parseJwtPayload: jest.fn()
}));
jest.mock('core/jwt/jwtTokenRegistry', () => ({
    get() {
        return {
            getToken() {
                return Promise.resolve('token');
            },
            getRefreshToken() {
                return Promise.resolve('token');
            }
        };
    },
    register() {}
}));

import { parseJwtPayload } from 'core/jwt/jwtToken';
import { log } from '../core/utils';
import * as authService from './authService';

describe('authService', () => {
    it('user has manager role', async () => {
        parseJwtPayload.mockReturnValue({
            roles: [authService.ROLE_SCORING_PROJECT_MANAGER]
        });
        const user = await authService.getUser();

        expect(user).not.toBeNil();
        expect(user.roles).toEqual([authService.ROLE_SCORING_PROJECT_MANAGER]);
    });

    it('regular user', async () => {
        parseJwtPayload.mockReturnValue({
            roles: [authService.ROLE_WORKFLOW_USER]
        });
        const user = await authService.getUser();

        expect(user).not.toBeNil();
        expect(user.roles).toEqual([authService.ROLE_WORKFLOW_USER]);
    });

    it('superuser with manager and user roles', async () => {
        parseJwtPayload.mockReturnValue({
            roles: [authService.ROLE_SCORING_PROJECT_MANAGER, authService.ROLE_WORKFLOW_USER]
        });
        const user = await authService.getUser();

        expect(user).not.toBeNil();
        expect(user.roles).toEqual([authService.ROLE_SCORING_PROJECT_MANAGER, authService.ROLE_WORKFLOW_USER]);
    });

    it('not authorized user', async () => {
        log.error = jest.fn();
        parseJwtPayload.mockImplementation(() => {
            throw new Error('Token is not valid');
        });

        await expect(authService.getUser()).rejects.toThrow('Token is not valid');
    });
});
