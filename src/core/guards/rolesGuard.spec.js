// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2022 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/core/apiRequest/apiRequest');
jest.mock('../../core/utils');

import * as authService from '../../services/authService';
import { log } from '../../core/utils';
import { getRolesGuard } from './rolesGuard';
import config from '@/config';

let next;
let router;

describe('roleGuard', () => {
    beforeEach(() => {
        log.error = jest.fn();
        next = jest.fn();
        router = {
            redirect: jest.fn()
        };
    });
    it('renders the route handler for matching roles', async () => {
        authService.getUser = jest.fn().mockResolvedValue({ roles: [authService.ROLE_SCORING_PROJECT_MANAGER] });

        await getRolesGuard([authService.ROLE_SCORING_PROJECT_MANAGER])(next, router);

        expect(log.error).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();

        authService.getUser = jest.fn().mockResolvedValue({ roles: [authService.ROLE_LTI_USER] });

        await getRolesGuard([authService.ROLE_SCORING_PROJECT_MANAGER, authService.ROLE_LTI_USER])(next, router);

        expect(log.error).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it('redirect workflow user to the error page, since the user has no manager rights', async () => {
        authService.getUser = jest.fn().mockResolvedValue({ roles: [authService.ROLE_WORKFLOW_USER] });

        await getRolesGuard([authService.ROLE_SCORING_PROJECT_MANAGER])(next, router);

        expect(log.error).toHaveBeenCalled();
        expect(router.redirect).toHaveBeenCalledWith(config.routes.error);
    });

    it('handles not logged in user', async () => {
        authService.getUser = jest.fn().mockRejectedValue('Token not available and cannot be refreshed');

        await getRolesGuard([authService.ROLE_NOT_LOGGED_IN])(next, router);

        expect(log.error).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
});
