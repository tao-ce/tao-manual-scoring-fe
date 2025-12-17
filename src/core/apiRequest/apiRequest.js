// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { __ } from '@oat-sa-private/ui-core';
import jwtTokenRegistry from 'core/jwt/jwtTokenRegistry';
import { JWT_TOKEN_HANDLER_SERVICE_NAME } from '@/services/authService.js';
import config from '@/config';
import request from 'core/fetchRequest';
import router from '@/core/router';
import { compile } from 'path-to-regexp';
import { log } from '@/core/utils/logger';

export const getEndpointUrl = (endpointName, variables = {}, parameters = {}, baseUrl = null) => {
    // get endpoint
    let endpoint = config.endpoints[endpointName];

    // replace variables
    endpoint = compile(endpoint)(variables);

    try {
        baseUrl = baseUrl || config.baseUrls.api;
        let pathName = (new URL(baseUrl))?.pathname;
        if (pathName !== '' && pathName !== '/' && !endpoint.startsWith(pathName)
        ) {
            endpoint = `${pathName}${endpoint}`;
        }
    } catch {
        log.error('cannot parse base url %s', baseUrl);
    }

    const url = new URL(endpoint, baseUrl);

    // add query parameters
    Object.keys(parameters).forEach(parameterName => {
        if (parameters[parameterName] !== void 0) {
            url.searchParams.append(parameterName, parameters[parameterName]);
        }
    });

    return url.href;
};


export default (url, options) =>
    request(url, Object.assign({ timeout: 30000 }, options, { jwtTokenHandler: jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME) })).catch(error => {
        const response = error.response;
        if (
            (response && response.status === 401) ||
            error.message === 'Token not available and cannot be refreshed' ||
            error.message === 'Refresh token is not available'
        ) {
            /**
             * Redirect to login page if the user is not authenticated
             */
                // Is there any better way to detect token expiration?
            const historyState = {
                    backPath: window.location.pathname + window.location.search,
                    url: config.routes.login
                };

            router.replace(historyState);
        } else if (response && response.status === 404) {
            /**
             * Redirect to error page if url is not valid
             */
            router.redirect(config.routes.error);
        } else if (response) {
            /**
             * Read the error sent by the API and forward it
             */
            return response.json().then(res => {
                res.responseStatus = response.status;
                const translation = res.translation || (res.error && res.error.translation);
                if (translation) {
                    const { key, params } = translation;
                    const message = __(key, ...params);
                    if (res.error.translation) {
                        res.error.message = message;
                    } else {
                        res.message = message;
                    }
                }

                throw res;
            });
        } else {
            throw error;
        }
    });
