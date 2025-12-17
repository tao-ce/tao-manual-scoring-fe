// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2022 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
import config from '@/config';
import { match } from 'path-to-regexp';

/**
 * @typedef {Object} RouteObject
 * @property {string} fullPath
 * @property {string} name
 * @property {Object.<string, any>} params
 */

/**
 * Builds route object from window.location.pathname and routes in config
 * @returns {RouteObject}
 */
export default function useRoute() {
    return {
        get fullPath() {
            return window.location.pathname;
        },
        get name() {
            let lastMatchedRouteName = null;
            for (let routeName in config.routes) {
                if (match(config.routes[routeName])(this.fullPath)) {
                    lastMatchedRouteName = routeName;
                }
            }
            return lastMatchedRouteName;
        },
        get params() {
            return match(config.routes[this.name])(this.fullPath).params;
        }
    }
}