// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2022 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/core/apiRequest/apiRequest', () => ({
    __esModule: true,
    default: jest.fn(),
    getEndpointUrl: jest.fn()
}));

import * as deliveryService from './deliveryService';
import apiRequest from '@/core/apiRequest/apiRequest';

describe('Delivery service', () => {
    /**
     * @typedef {import('../typings/index.js').Delivery} Delivery
     * @type Delivery
     */
    const fakeDelivery = {
        id: 1,
        items: [],
        numItemAttempts: 1,
        scoringProjectId: 2,
        scoringProjectName: 'scoringProjectName',
        taoDeliveryId: 'taoDeliveryId',
        taoTestId: 'taoTestId',
        testQtiIdentifier: 'testQtiIdentifier',
        testTitle: 'testTitle'
    };

    it('getDeliveriesLTI', async () => {
        apiRequest.mockResolvedValue({ data: [fakeDelivery] });

        const result = await deliveryService.getDeliveriesLTI();

        expect(result).toStrictEqual({ data: [fakeDelivery] });
    })
});
