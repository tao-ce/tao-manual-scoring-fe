// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 *  Returns total number of tasks for the item
 *
 * @param {Object} item
 * @returns {int}
 */
export const getTotal = item => item.numTasksUnscored + item.numTasksScored + item.numTasksSubmitted;

/**
 *  Returns completion rate for the item
 *
 * @param {Object} item
 * @returns {float}
 */
const getCompletion = item => {
    const total = getTotal(item);
    return total ? (item.numTasksScored + item.numTasksSubmitted) / total : 0;
};

/**
 *  Returns completion percentage for the item
 *
 * @param {Object} item
 * @returns {int}
 */
export const getCompletionPercent = item => Math.round(getCompletion(item) * 100);
