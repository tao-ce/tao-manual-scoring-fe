// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2024 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import request, { getEndpointUrl } from '@/core/apiRequest/apiRequest';
import { parseJwtPayload } from 'core/jwt/jwtToken';
import jwtTokenHandlerFactory from 'core/jwt/jwtTokenHandler';
import jwtTokenRegistry from 'core/jwt/jwtTokenRegistry';
import * as userConfigurationService from './userConfigurationService';

import { JWT_TOKEN_HANDLER_SERVICE_NAME } from '@/constants/jwtToken.js';

export const ROLE_SCORING_PROJECT_MANAGER = 'ROLE_SPM';
export const ROLE_WORKFLOW_USER = 'ROLE_WORKFLOW_USER';
export const ROLE_LTI_USER = 'ROLE_LTI_USER';
export const ROLE_NOT_LOGGED_IN = 'ROLE_NOT_LOGGED_IN';


/**
 * @typedef User
 * @property {boolean} isManager
 * @property {boolean} isUser
 * @property {string[]} roles
 */

/**
 * Registers clientId for jwtTokenHandler that is used in refresh token request
 * @param {string} userId
 * @returns {Function} jwtTokenHandler
 */
export const registerJwtTokenHandler = (userId) => {
    const refreshTokenId = `refreshToken_ms_${userId}`;

    const jwtTokenHandler = jwtTokenHandlerFactory({
        serviceName: JWT_TOKEN_HANDLER_SERVICE_NAME,
        refreshTokenUrl: getEndpointUrl('ltiRefreshToken'),
        useCredentials: true,
        usePerTokenTTL: true,
        refreshTokenParameters: { refreshTokenId }
    });

    jwtTokenRegistry.register(jwtTokenHandler);

    return jwtTokenHandler;
}

let _userPromise = null;
let _authReadyResolve;
const _authReadyPromise = new Promise(resolve => {
    _authReadyResolve = resolve;
});

export const setAuthReady = () => {
    _authReadyResolve();
};

async function getToken() {
    await _authReadyPromise;

    let jwtTokenRegistryService = jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME);

    if (!jwtTokenRegistryService) {
        const userId = window.sessionStorage.getItem('user');

        jwtTokenRegistryService = registerJwtTokenHandler(userId);
    }

    const token = await jwtTokenRegistryService.getToken();
    const jwtObject = parseJwtPayload(token);

    return {
        isManager: jwtObject.roles.indexOf(ROLE_SCORING_PROJECT_MANAGER) !== -1,
        isUser: jwtObject.roles.indexOf(ROLE_WORKFLOW_USER) !== -1,
        roles: jwtObject.roles,
        sub: jwtObject.sub,
        name: jwtObject.name,
        email: jwtObject.email,
        userData: jwtObject.user,
        tenantId: jwtObject.tenant_id
    };
}

export const getUser = () => {
    if (!_userPromise) {
        _userPromise = getToken();
    }
    return _userPromise;
};

/**
 * Returns the tenant ID from the stored access token
 * @async
 * @returns {string|null}
 */
const getTenantId = async () => {
    const token = await jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME).getToken();
    return parseJwtPayload(token).tenant_id || null;
}

/**
 * Exchange LTI session token to access token
 * @async
 * @param {string} sessionToken
 * @returns {object}
 */
export const exchangeToken = async (sessionToken) => {
    const tenantId = await getTenantId();

    const res = await request(getEndpointUrl('exchangeToken'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionToken,
            tenantId
        })
    });

    const userConfiguration = await request(getEndpointUrl('tenantConfiguration'));

    userConfigurationService.setConfig(userConfiguration);

    setAuthReady();

    return res;
}