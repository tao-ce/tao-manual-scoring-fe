// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import env from '@/config/env';

let tenants = [];

try {
    tenants = JSON.parse(env('TENANTS'));
    /* eslint-disable no-empty */
} catch (e) {}

export default {
    tenants,
    baseUrls: {
        api: env('API_URL'),
        authServer: env('AUTH_SERVER_URL')
    },
    routes: {
        createScoringProject: '/scoringprojects/create',
        delivery: '/delivery/:id',
        editScoringProject: '/scoringproject/:id/edit',
        error: '/error',
        home: '/',
        launch: '/launch',
        login: '/login',
        ltiError: '/ltiError',
        ltiSubmitted: '/submitted',
        monitoringDetails: '/monitoringdetails/:scoringProjectId/:userId',
        reassignTasks: '/reassign/:scoringProjectId/:userId/:deliveryId/:enrollmentId/:criterion',
        scoringProject: '/scoringproject/:id',
        scoringProjects: '/scoringprojects',
        task: '/task/:deliveryId/:taskId'
    },
    endpoints: {
        aiScoringSuggestion: '/api/v1/ai/suggestion/:id',
        clients: '/v1/client/labels/ms', // Auth Server's endpoint
        complainScores: '/api/v1/scoring-violations',
        deliveriesLTI: '/api/v1/deliveries-lti',
        deliveryExecutionScoring: '/api/v1/delivery-execution-scoring/:id',
        enrollment: '/api/v1/enrollments/:id',
        exchangeToken: '/api/v1/auth/token/exchange',
        importUsers: '/api/v1/import/csv/users',
        login: '/v1/oauth2/tokens', // Auth Server's endpoint
        ltiRefreshToken: env('REFRESH_TOKEN_URI'), // Detoured to envoy
        monitoringDetails: '/api/v1/monitoring/scoring-projects/:scoringProjectId/assignees/:userId',
        refreshToken: '/v1/oauth2/tokens', // Auth Server's endpoint
        reassignTasks: '/api/v1/reassignment/reassign-tasks',
        scoringProject: '/api/v1/scoring-projects/:id',
        scoringProjectMonitoring: '/api/v1/monitoring/scoring-projects/:id/assignees',
        scoringProjects: '/api/v1/scoring-projects',
        submitDelivery: '/api/v1/deliveries/:id/tasks/submit',
        submitDeliveryExecutionScoring: '/api/v1/delivery-execution-scoring',
        submitLTITasks: '/api/v1/tasks-lti-submit',
        task: '/api/v1/tasks/:id',
        tasks: '/api/v1/tasks',
        tenantConfiguration: '/api/v1/tenant-configuration',
        user: '/api/v1/users/:id',
        users: '/api/v1/users'
    }
};
