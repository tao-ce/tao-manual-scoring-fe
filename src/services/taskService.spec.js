// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/core/apiRequest/apiRequest', () => ({
    __esModule: true,
    default: jest.fn(),
    getEndpointUrl: jest.fn()
}));

import * as taskService from './taskService';
import apiRequest from '@/core/apiRequest/apiRequest';

const taskResponse = {
    id: '01FCR9ZB8N0YXH4W794YRA5B8Y',
    status: 'scored',
    note: 'my note',
    bookmarked: true,
    highlights: [],
    outcomeDeclarations: [
        {
            taskScoreId: 'taskScoreId',
            outcomeDeclarationId: 'outcomeDeclarationId',
            qtiIdentifier: 'GRAMMAR',
            interpretation: null,
            longInterpretation: null,
            minimumValue: 0,
            maximumValue: 5,
            value: 2
        }
    ],
    test: {
        title: 'Test 2'
    },
    item: {
        title: 'ms'
    },
    ltiItemPreviewerLink: {
        url:
            'https://sds-tao-1.docker.localhost/ltiOutcomeUi/ItemResultPreviewer/launch?resultId=https%3A%2F%2Fsds-tao-1.docker.localhost%2Fontologies%2Ftao.rdf%23i61129769cf0778fd81ba7d21d72532&itemRef=item-1',
        parameters: {
            lti_message_type: 'basic-lti-launch-request',
            lti_version: 'LTI-1p0',
            oauth_callback: 'about:blank',
            oauth_consumer_key: 'key',
            oauth_nonce: '15c34087-1c3e-4c91-b8b5-2d1a371c5c6c',
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: 1628839665,
            oauth_version: '1.0',
            resource_link_id: '9c768af2-ce7b-4084-bd36-53a52f919003',
            roles: 'Instructor',
            user_id: '01FCR9RACXXWDNV5XZD3MZ5C86',
            oauth_signature: 'JA2cGvljsxxtOohja9bnQNFWbXE='
        }
    }
};

describe('Task service', () => {
    it('getTasksByDelivery', async () => {
        apiRequest.mockResolvedValue({ id: 1 });

        const result = await taskService.getTasksByDelivery({
            deliveryId: 1,
            itemId: 1,
            status: 1,
            bookmarked: false,
            limit: 1,
            offset: 1
        });

        expect(result).toStrictEqual({ id: 1 });
    });

    it('bookmarkTask', async () => {
        apiRequest.mockResolvedValue({ id: 42, bookmarked: true });

        const result = await taskService.bookmarkTask(42, true);

        expect(result).toStrictEqual({ id: 42, bookmarked: true });
    });

    it('reassignTasks', async () => {
        apiRequest.mockResolvedValue({ id: 42 });

        const result = await taskService.reassignTasks(42, 3, [1, 2, 3]);

        expect(result).toStrictEqual({ id: 42 });
    });

    it('getTasks', async () => {
        apiRequest.mockResolvedValue([{ id: 42 }]);

        const result = await taskService.getTasks(42);
        expect(result).toStrictEqual([{ id: 42 }]);
    });

    it('getTask', async () => {
        apiRequest.mockResolvedValue({ id: 42 });

        const result = await taskService.getTask(42);
        expect(result).toStrictEqual({ id: 42 });
    });

    it('updateTask', async () => {
        apiRequest.mockResolvedValue({ id: 42 });

        const result = await taskService.updateTask(42, {});
        expect(result).toStrictEqual({ id: 42 });
    });

    it('submitDeliveryTasks', async () => {
        apiRequest.mockResolvedValue({ id: 42 });

        const result = await taskService.submitDeliveryTasks(42, 'taskType');
        expect(result).toStrictEqual({ id: 42 });
    });

    it('complainItemScorerPair', async () => {
        apiRequest.mockResolvedValue({ id: 42 });

        const result = await taskService.complainItemScorerPair(42, 'Pay attention to this scorer');
        expect(result).toStrictEqual({ id: 42 });
    });

    it('getServerTaskData', async () => {
        const result = await taskService.getServerTaskData(taskResponse);
        expect(result).toStrictEqual({
            outcomeDeclarations: [
                {
                    taskScoreId: 'taskScoreId',
                    outcomeDeclarationId: 'outcomeDeclarationId',
                    qtiIdentifier: 'GRAMMAR',
                    interpretation: null,
                    longInterpretation: null,
                    minimumValue: 0,
                    maximumValue: 5,
                    value: 2
                }
            ],
            note: 'my note',
            bookmarked: true,
            highlights: []
        });
    });

    it('formatTaskData', async () => {
        const result = await taskService.formatTaskData(taskResponse);
        expect(result).toStrictEqual({
            id: '01FCR9ZB8N0YXH4W794YRA5B8Y',
            status: 'scored',
            note: 'my note',
            bookmarked: true,
            highlights: [],
            outcomeDeclarations: [
                {
                    taskScoreId: 'taskScoreId',
                    outcomeDeclarationId: 'outcomeDeclarationId',
                    qtiIdentifier: 'GRAMMAR',
                    value: 2
                }
            ],
            test: {
                title: 'Test 2'
            },
            item: {
                title: 'ms'
            },
            ltiItemPreviewerLink: {
                url:
                    'https://sds-tao-1.docker.localhost/ltiOutcomeUi/ItemResultPreviewer/launch?resultId=https%3A%2F%2Fsds-tao-1.docker.localhost%2Fontologies%2Ftao.rdf%23i61129769cf0778fd81ba7d21d72532&itemRef=item-1',
                parameters: {
                    lti_message_type: 'basic-lti-launch-request',
                    lti_version: 'LTI-1p0',
                    oauth_callback: 'about:blank',
                    oauth_consumer_key: 'key',
                    oauth_nonce: '15c34087-1c3e-4c91-b8b5-2d1a371c5c6c',
                    oauth_signature_method: 'HMAC-SHA1',
                    oauth_timestamp: 1628839665,
                    oauth_version: '1.0',
                    resource_link_id: '9c768af2-ce7b-4084-bd36-53a52f919003',
                    roles: 'Instructor',
                    user_id: '01FCR9RACXXWDNV5XZD3MZ5C86',
                    oauth_signature: 'JA2cGvljsxxtOohja9bnQNFWbXE='
                }
            }
        });
    });
});
