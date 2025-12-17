// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import config from '@/config';
import { log } from '@/core/utils';
import * as authService from '../../services/authService';
import { AuthError } from '@/errors';

/**
 * Guards determine whether a given path will be handled by the route controller or not
 * @callback Guard
 * @param {Function} next The callback that must be called to execute the route controller
 * @param {typeof import('../router.js').default} router
 * @returns {Promise}
 */

/**
 *
 * @param {Array<string>} allowedRoles
 * @returns {Guard}
 */
export const getRolesGuard = (allowedRoles) => {
    const roleGuard = async (next, router) => {
        try {
            const user = await authService.getUser();

            const isAllowed = user.roles.some(value => allowedRoles.includes(value));

            if (isAllowed) {
                return next();
            }

            throw new AuthError('User is not allowed to access this page');
        } catch (error) {
            if (allowedRoles.includes(authService.ROLE_NOT_LOGGED_IN)) {
                return next();
            }
            log.error(error);
            router.redirect(config.routes.error);
        }
    };

    return roleGuard;
}
