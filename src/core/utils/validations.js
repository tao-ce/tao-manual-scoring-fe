// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { ASSIGNMENT_STRATEGIES } from '@/constants/scoring-project';
import { __ } from '@oat-sa-private/ui-core';

/**
 * Validates in items categories is valid for given assignment strategy
 * @param {Array} itemCategories
 * @param {String} assignmentStrategy
 * @returns {Boolean}
 */
export const isAssignmentStrategyValidForDelivery = (itemCategories, assignmentStrategy) => {
    const hasItemCategories = itemCategories && itemCategories.length !== 0;
    const isTestTakerStrategyValid = !hasItemCategories && assignmentStrategy === ASSIGNMENT_STRATEGIES.TEST_TAKER;
    const isItemCategoryStrategyValid = hasItemCategories && assignmentStrategy === ASSIGNMENT_STRATEGIES.ITEM_CATEGORY;

    return Boolean(isTestTakerStrategyValid || isItemCategoryStrategyValid);
};

/**
 * Provides a warning message for specific assignment strategy
 * @param {String} assignmentStrategy
 * @returns {String}
 */
export const getWarningMessage = assignmentStrategy => {
    switch (assignmentStrategy) {
        case ASSIGNMENT_STRATEGIES.TEST_TAKER:
            return __('The delivery seems to be configured for an "item group" project assignment strategy');
        case ASSIGNMENT_STRATEGIES.ITEM_CATEGORY:
            return __('The delivery seems to be configured for a "test taker group" project assignment strategy');
        default:
            return '';
    }
};
