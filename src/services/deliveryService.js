// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2022 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
import request, { getEndpointUrl } from '@/core/apiRequest/apiRequest';

/**
 * @typedef {import('../typings/index.js').Delivery} Delivery
 */

/**
 * Returns deliveries's details of LTI
 * @param {Object} params
 * @param {string} params.currentTask
 * @returns {Promise<{data: [Delivery]}>}
 */
export const getDeliveriesLTI = params => request(getEndpointUrl('deliveriesLTI', {}, params ));