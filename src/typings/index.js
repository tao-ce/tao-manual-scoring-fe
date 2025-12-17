// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * Item of the delivery
 * @typedef DeliveryItem
 * @property {ItemCategory[]} [category]
 * @property {string} id
 * @property {OutcomeDeclaration[]} [outcomeDeclarations]
 * @property {string} title
 */

/**
 * @typedef WorkProgressData
 * @property {number} numTasksScored
 * @property {number} numTasksSubmitted
 * @property {number} numTasksUnscored
 */

/**
 * Delivery details
 * @typedef Delivery
 * @property {string} id
 * @property {DeliveryItem[]} items
 * @property {number} numItemAttempts
 * @property {null | string} scoringProjectId
 * @property {null | string} scoringProjectName
 * @property {string} taoDeliveryId
 * @property {string} taoTestId
 * @property {string} testQtiIdentifier
 * @property {string} testTitle
 * @property {number} [receivedTime]
 * @property {{review?: WorkProgressData, scoring?:WorkProgressData}} [workProgress]
 */

/**
 * Item categories
 * @typedef ItemCategory
 * @property {string} label
 * @property {number} unassigned
 */

/**
 * Outcome declaration
 * @typedef OutcomeDeclaration
 * @property {string} id
 * @property {null|string} interpretation
 * @property {null|string} longInterpretation
 * @property {number} normalMaximum
 * @property {number} normalMinimum
 */

/**
 * @typedef ScoringProject
 * @property { 'test_taker_group_based' | 'item_category_based' } assignmentStrategy
 * @property {number | null} endDate
 * @property {string} id
 * @property {string} name
 * @property {number} numTasksScored
 * @property {number} numTasksSubmitted
 * @property {number} numTasksUnscored
 * @property {number | null} startDate
 */

export {};
