// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2022 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import request, { getEndpointUrl } from '@/core/apiRequest/apiRequest';
import { DELIVERY_TAB, PAGE_SIZE } from '../constants/delivery';
import { TASK_STATUS } from '../constants/task';
import { getConfig } from '@/services/ltiService';

/**
 * @typedef {import('../constants/task').TASK_TYPE} TASK_TYPE
 */

/**
 * @typedef TasksRequestParams
 * @property {string} deliveryId delivery identifier
 * @property {string} itemId item qti identifier
 * @property {string} type "scoring" or "review"
 * @property {string} status task statuses separated by ','
 * @property {boolean} [bookmarked] filter tasks by bookmarked field
 * @property {string} [selectedTaskId] if defined offset will be ignored and returned tasks will include selected
 * @property {string} [currentTask] define current task on main screen
 * @property {number} limit number of the tasks to return
 * @property {number} [offset] first task index
 */

/**
 * @typedef OutcomeDeclaration
 * @property {string} id
 * @property {string} interpretation
 * @property {string|null} longInterpretation
 * @property {number} minimumValue
 * @property {number} maximumValue
 * @property {number|null} value
 */

/**
 * @typedef Task
 * @property {string} id
 * @property {string|null} note
 * @property {boolean} bookmarked
 * @property {string} itemId
 * @property {string|null} testId
 * @property {OutcomeDeclaration[]} outcomeDeclarations
 * @property {Object} totalScore
 * @property {number} totalScore.value
 * @property {number} totalScore.maximumValue
 */

/**
 * @typedef TasksPagination
 * @property {number} limit
 * @property {number} offset
 * @property {number} numTotal
 */

/**
 * @typedef TasksResponse
 * @property {TasksPagination} _pagination
 * @property {Task[]} data
 * @property {Object} [_meta]
 */
/**
 * @param {Object} params
 * @param {string} params.deliveryId
 * @param {string} params.itemId
 * @param {TASK_TYPE} params.taskType
 * @param {string} params.activeTab
 * @param {number} [params.currentPage]
 * @param {string} [params.selectedTaskId]
 * @param {string} [params.currentTask]
 * @param {string} [params.isReadOnly]
 * @returns {TasksRequestParams}
 */
const getTasksParams = params => {
    const offset = params.currentPage ? (params.currentPage - 1) * PAGE_SIZE : 0;
    const isReadOnly = params.isReadOnly ?? false;
    const status = isReadOnly ? `${TASK_STATUS.SCORED},${TASK_STATUS.UNSCORED},${TASK_STATUS.SUBMITTED}`
        : `${TASK_STATUS.SCORED},${TASK_STATUS.UNSCORED}`;

    const resultParams = {
        deliveryId: params.deliveryId,
        itemId: params.itemId,
        taskId: params.taskId,
        scope: params.scope,
        type: params.taskType,
        limit: PAGE_SIZE,
        offset,
        status
    };

    if (params.currentTask) {
        resultParams.currentTask = params.currentTask;
    }

    if (params.selectedTaskId) {
        resultParams.selectedTaskId = params.selectedTaskId;
    }

    if (params.activeTab === DELIVERY_TAB.INCOMPLETE) {
        resultParams.status = TASK_STATUS.UNSCORED;
    }

    if (params.activeTab === DELIVERY_TAB.BOOKMARKED) {
        resultParams.bookmarked = true;
    }

    return resultParams;
};
/**
 * Get tasks for the specified delivery
 *
 * @param {Object} params
 * @param {string} params.deliveryId
 * @param {string} params.itemId
 * @param {TASK_TYPE} params.taskType
 * @param {string} params.activeTab
 * @param {number} [params.currentPage]
 * @param {string} [params.selectedTaskId]
 * @param {string} [params.currentTask]
 * @returns {Promise<TasksResponse>}
 */
export function getTasksByDelivery(params) {
    return request(
        getEndpointUrl(
            'tasks',
            {},
            {
                sortedBy: 'orderNumber',
                ...getTasksParams(params)
            }
        )
    );
}

/**
 * Set / unset bookmark on task
 *
 * @param {string} taskId - task identifier
 * @param {boolean} bookmarked - specifies if bookmark should be set
 *
 * @returns {Promise}
 */
export function bookmarkTask(taskId, bookmarked) {
    return request(getEndpointUrl('task', { id: taskId }), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookmarked })
    });
}

/**
 * @param {string} enrollmentIdToReassign
 * @param {string} deliveryId
 * @param {string[]} enrollmentIds
 * @returns {Promise<any>}
 */
export const reassignTasks = (enrollmentIdToReassign, deliveryId, enrollmentIds) =>
    request(getEndpointUrl('reassignTasks'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            deliveryId,
            enrollmentId: enrollmentIdToReassign,
            reassignmentContracts: enrollmentIds.map(enrollmentId => ({ enrollmentId }))
        })
    });

/**
 * Get tasks list
 *
 * @param {Object} params - parameters to filter the tasks
 * @returns {Promise}
 */
export const getTasks = params => request(getEndpointUrl('tasks', {}, { ...params }));

/**
 * Fetches task data
 *
 * @param {string} taskId - task identifier
 * @param {string} locale - locale of the item preview
 * @returns {Promise}
 */
export function getTask(taskId, locale) {
    return request(getEndpointUrl('task', { id: taskId }, { locale }));
}

/**
 * Update task data
 *
 * @param {string} taskId - task identifier
 * @param {object} data - task fields to update
 * @returns {Promise}
 */
export function updateTask(taskId, data) {
    return request(getEndpointUrl('task', { id: taskId }), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

/**
 * Update deliveryExecurtionScoring data
 *
 * @param {object} data - task fields to update
 * @returns {Promise}
 */
export function submitDeliveryExecutionScoring(data) {
    return request(getEndpointUrl('submitDeliveryExecutionScoring'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

/**
 * Update deliveryExecurtionScoring data
 *
 * @param {string} id - deliveryExecurtionScoring identifier
 * @param {object} data - task fields to update
 * @returns {Promise}
 */
export function updateDeliveryExecutionScoring(id, data) {
    return request(getEndpointUrl('deliveryExecutionScoring', { id: id }), {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

/**
 * Submit all tasks of delivery
 *
 * @param {string} deliveryId - delivery identifier
 * @param {string} taskType - tasks type
 * @param {string} currentTask - current task id
 * @returns {Promise}
 */
export function submitDeliveryTasks(deliveryId, taskType, currentTask) {
    return request(getEndpointUrl('submitDelivery', { id: deliveryId }), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskType, currentTask })
    });
}

/**
 * Submit all tasks of LTI call
 *
 * @param {string} taskType - tasks type
 * @param {string} currentTask - current task id
 * @returns {Promise}
 */
 export function submitLTITasks(taskType, currentTask) {
    return request(getEndpointUrl('submitLTITasks'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskType, currentTask })
    });
}

/**
 * Add complaint about item attempt / scorer pair
 *
 * @param {string} taskId - task identifier
 * @param {string} description
 * @returns {Promise}
 */
export function complainItemScorerPair(taskId, description) {
    return request(getEndpointUrl('complainScores', {}), {
        method: 'POST',
        body: JSON.stringify({ taskId, description })
    });
}

/**
 * Adapter to transform task data from api response
 *
 * @param {Object} data
 * @returns {Object}
 */
export const getServerTaskData = data => ({
    outcomeDeclarations: data.outcomeDeclarations,
    note: data.note,
    bookmarked: data.bookmarked,
    highlights: data.highlights
});

/**
 * Filters entries inside outcomeDeclarations so that only permissible entries are sent back to api for patch
 *
 * @param {Object} data
 * @returns {Object}
 */
export const formatTaskData = data => {
    if (data.outcomeDeclarations) {
        const outcomeDeclarations = data.outcomeDeclarations.map(outcomeDeclaration => ({
            taskScoreId: outcomeDeclaration.taskScoreId,
            outcomeDeclarationId: outcomeDeclaration.outcomeDeclarationId,
            qtiIdentifier: outcomeDeclaration.qtiIdentifier,
            value: outcomeDeclaration.value,
        }));

        return Object.assign({}, data, { outcomeDeclarations });
    }

    return data;
};

/**
 *
 * Inject additional properties in task for frontend
 *
 * @param {Object} task
 * @param {Object} item
 * @param {Object[]} linkedTasks
 *
 * @returns {Object[]}
 */
export const transformTask = (task, item, linkedTasks) => {
    // TODO: When double blind strategy is implemented,
    // we need to show scoring violation only for scoring task,
    // right now we'll always have only one linked task
    const linkedTaskWithScoringViolation = linkedTasks.find(lt => lt.scoringViolation);
    let scoringViolation = null;

    if (linkedTaskWithScoringViolation) {
        const { firstName, lastName, username } = linkedTaskWithScoringViolation.enrollment;
        scoringViolation = {
            description: linkedTaskWithScoringViolation.scoringViolation.description,
            reportee: {
                firstName,
                lastName,
                username
            }
        };
    }

    const config = getConfig();
    // If admin or group manager is on read only review, the reviewer's score should the total score
    // If it wasn't reviewed yet, consider the scorer's score
    if (config.isReadOnly && config.isAdministrative) {
        const latestScore = linkedTasks.find(linkedTask => linkedTask.type === 'review') ??
            linkedTasks.find(linkedTask => linkedTask.type === 'scoring')
        task.totalScore = latestScore.totalScore;
    }

    return {
        ...task,
        scoringViolation,
        itemTitle: item.title,
        outcomeDeclarations: task.outcomeDeclarations.map(od => {
            if (linkedTasks) {
                return {
                    ...od,
                    previousValues: linkedTasks.map(
                        lt => (lt.outcomeDeclarations.find(lod => lod.outcomeDeclarationId === od.outcomeDeclarationId) || {}).value
                    )
                };
            }
            return od;
        })
    };
};


/**
 * Returns tasks grouped by item identifier
 *
 * @param {Object[]} tasks - list of tasks
 * @param {Object} item - item
 * @param {Object[]} allLinkedTasks - scores data of the previous users for all review tasks
 * @returns {Object}
 */
 export const getTasksByGroup = (tasks, item, allLinkedTasks) => {
    if (!item) {
        return {};
    }

    let taskGroup = tasks
        .filter(task => task.itemId === item.id || task.testId === item.id)
        .map(task => {
            const linkedTasks = allLinkedTasks ? allLinkedTasks[task.id] : [];

            return transformTask(task, item, linkedTasks);
        });

    if (taskGroup.length) {
        return {
            [item.id]: {
                deliveryId: item.deliveryId,
                title: item.title,
                outcomeDeclarations: item.outcomeDeclarations,
                tasks: taskGroup
            }
        };
    }

    return {};
};
