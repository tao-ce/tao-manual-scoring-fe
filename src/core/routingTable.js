// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019-2021 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import config from '@/config';
import { getRolesGuard } from './guards/rolesGuard';
import {
    ROLE_WORKFLOW_USER,
    ROLE_LTI_USER
} from '../services/authService';

/**
 * @callback Controller
 * @returns {Promise}
 */

/**
 * @typedef Route
 * @property {string} path Abstract path that match to url
 * @property {Controller} controller
 * @property {import('./guards/rolesGuard').Guard} guard
 */

/**
 * @var Route[]
 */
const routeTable = [
    {
        path: config.routes.launch,
        controller: () => import(`../controller/launch/launch`)
    },

    // Task
    {
        path: config.routes.task,
        guard: getRolesGuard([ROLE_WORKFLOW_USER, ROLE_LTI_USER]),
        controller: () => import('@/controller/taskpage/taskpage')
    },
    {
        path: config.routes.ltiError,
        controller: () => import('@/controller/ltiError/lti-error')
    },
    {
        path: config.routes.ltiSubmitted,
        controller: () => import('@/controller/ltiSubmitted/lti-submitted')
    },
    // Default (error)
    {
        path: '(.*)',
        controller: () => import('@/controller/error/error')
    }
];

export default routeTable;
