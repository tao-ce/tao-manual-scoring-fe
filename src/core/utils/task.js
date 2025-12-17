// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { storage } from '@/core/utils/storage';

/**
 * Task data types:
 *
 * - INITIAL: Initial data received from the server on page load
 * - CURRENT: All the locally saved changed on top of the initial data
 */
export const TASK_DATA_TYPE = {
    INITIAL: 'initial',
    CURRENT: 'current'
};

/**
 *  Returns name of the item in the local storage for the specified task id and storage type
 *
 * @param {number} taskId
 * @param {string} taskDataType
 * @returns {string|void}
 */
const getStorageItemName = (taskId, taskDataType) => {
    if (taskDataType === TASK_DATA_TYPE.INITIAL) {
        return `InitialTaskData:${taskId}`;
    }

    if (taskDataType === TASK_DATA_TYPE.CURRENT) {
        return `CurrentTaskData:${taskId}`;
    }
};

/**
 * Saves task data for the specified task in the local storage
 *
 * @param {number} taskId
 * @param {string} taskDataType
 * @param {object} data
 *
 * @returns {Promise<void>}
 */
export const saveLocalTaskData = (taskId, taskDataType, data) =>
    storage.then(store => store.setItem(getStorageItemName(taskId, taskDataType), data));

/**
 * Returns saved task data for the specified task
 *
 * @param {number} taskId
 * @param {string} taskDataType
 * @returns {Promise<Object>}
 */
export const getLocalTaskData = (taskId, taskDataType) =>
    storage.then(store => store.getItem(getStorageItemName(taskId, taskDataType)));

/**
 * Removes task data for the specified task from the local storage
 *
 * @param {number} taskId
 * @returns {Promise<void>}
 */
export const removeLocalTaskData = taskId =>
    storage.then(store => {
        store.removeItem(getStorageItemName(taskId, TASK_DATA_TYPE.INITIAL));
        store.removeItem(getStorageItemName(taskId, TASK_DATA_TYPE.CURRENT));
    });
