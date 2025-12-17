// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2022 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { writable } from 'svelte/store';
import config from '@/config';
import router from '@/core/router';
import { compile } from 'path-to-regexp';
import { TASK_DATA_TYPE, saveLocalTaskData, getLocalTaskData, removeLocalTaskData } from '@/core/utils/task';
import { TASK_STATUS, TASK_TYPE } from '../constants/task';
import { log } from '@/core/utils';
import { isEqual } from '@/core/utils/object';
import * as taskService from '../services/taskService';
import * as ltiService from '../services/ltiService';

const getInitialState = () => ({
    isLoading: true,
    isProjectInactive: false,
    task: null,
    meta: null,
    ltiConfig: {},
    redirectTask: null
});

const { subscribe, update, set } = writable(getInitialState());

export const taskStore = {
    subscribe,
    set,
    reset: () => update(getInitialState),
    setIsLoading: value => {
        update(store => {
            store.isLoading = value;
            return store;
        });
    },
    setBookmark: isChecked => {
        update(store => {
            store.task.bookmarked = isChecked;
            return store;
        });
    },
    toggleBookmark: () => {
        update(store => {
            store.task.bookmarked = !store.task.bookmarked;
            return store;
        });
    },
    updateScore: ({ index, score }) => {
        update(store => {
            store.task.outcomeDeclarations[index].value = score;

            return store;
        });
    },
    updateSuspicious: async (deliveryExecutionScoring) => {
        const { id, deliveryExecutionId, note, suspicious, suspiciousNote } = deliveryExecutionScoring;
        const data = { deliveryExecutionId, note, suspicious, suspiciousNote };

        try {
            if (!id) {
                const { id: idNew } = await taskService.submitDeliveryExecutionScoring(data);
                deliveryExecutionScoring.id = idNew;
            } else {
                delete data.deliveryExecutionId;
                await taskService.updateDeliveryExecutionScoring(id, data);
            }

            update(store => {
                store.meta.deliveryExecutionScoring = deliveryExecutionScoring;
                return store;
            });
        } catch (error) {
            update(store => {
                store.meta.deliveryExecutionScoring = deliveryExecutionScoring;
                return store;
            });
            return router.redirect(config.routes.error);
        }
    },
    loadTask: (taskId, locale) => {
        update(store => {
            store.isLoading = true;
            return store;
        });

        return taskService
            .getTask(taskId, locale)
            .then(({ redirectTask, data, _meta }) => {
                if (redirectTask) {
                    taskStore.updateRedirectTask(redirectTask);
                    return;
                }

                if (data.status === TASK_STATUS.SUBMITTED) {
                    router.redirect('/');
                    return;
                }

                const numberOfTasks = _meta.nrOfTasks;
                const position = _meta.position;
                const totalScored = _meta.totalScored;
                const prevTask = _meta.prevTaskId ? {
                    id: _meta.prevTaskId,
                    deliveryId: _meta.prevTaskDeliveryId
                } : null;
                const nextTask = _meta.nextTaskId ? {
                    id: _meta.nextTaskId,
                    deliveryId: _meta.nextTaskDeliveryId
                } : null;

                const linkedTasks = _meta.linkedTasks;
                const hasLinkedTasks = linkedTasks && linkedTasks.length;
                // TODO: change when we'll have task type on BE
                const taskType = hasLinkedTasks ? TASK_TYPE.REVIEW : TASK_TYPE.SCORING;

                const meta = {
                    numberOfTasks,
                    position,
                    totalScored,
                    prevTask,
                    nextTask,
                    taskType,
                    previousScores: [],
                    deliveryExecutionScoring: _meta.deliveryExecutionScoring
                };

                if (hasLinkedTasks) {
                    meta.previousScores = linkedTasks.map(lt => ({
                        id: lt.id,
                        note: lt.note,
                        fullname:
                            lt.enrollment?.firstName && lt.enrollment?.lastName
                                ? `${lt.enrollment.firstName} ${lt.enrollment.lastName}`
                                : lt.enrollment?.username,
                        username: lt.enrollment?.username,
                        scores: lt.outcomeDeclarations,
                        scoringViolation: lt.scoringViolation
                    }));
                }

                const serverTaskData = taskService.getServerTaskData(data);

                return Promise.all([
                    getLocalTaskData(taskId, TASK_DATA_TYPE.INITIAL),
                    getLocalTaskData(taskId, TASK_DATA_TYPE.CURRENT),
                    ltiService.getConfig()
                ]).then(responses => {
                    const [initialTaskData, currentTaskData, ltiConfig] = responses;

                    const taskData = {
                        note: '',
                        highlights: [],
                        outcomeDeclarations: [],
                        taskType
                    };

                    if (!initialTaskData) {
                        saveLocalTaskData(taskId, TASK_DATA_TYPE.INITIAL, serverTaskData);
                        Object.assign(taskData, data, serverTaskData);
                    } else if (isEqual(initialTaskData, serverTaskData)) {
                        Object.assign(taskData, data, currentTaskData);
                    } else {
                        saveLocalTaskData(taskId, TASK_DATA_TYPE.INITIAL, serverTaskData);
                        saveLocalTaskData(taskId, TASK_DATA_TYPE.CURRENT, serverTaskData);
                        Object.assign(taskData, data, serverTaskData);
                    }

                    // Normalize note
                    if (taskData.note === null) {
                        taskData.note = '';
                    }

                    update(store => {
                        store.isLoading = false;
                        store.task = taskData;
                        store.ltiConfig = ltiConfig;
                        store.meta = meta;

                        return store;
                    });
                });
            })
            .catch(error => {
                log.error(error);

                if (error.responseStatus === 409) {
                    return update(store => {
                        store.isProjectInactive = true;
                        return store;
                    });
                }

                return router.redirect(config.routes.error);
            });
    },
    loadNextTask: (taskId, taskData, nextTask = {}) => {
        const data = taskService.formatTaskData(taskData);

        update(store => {
            store.isLoading = true;
            store.redirectTask = null;
            return store;
        });

        return taskService
            .updateTask(taskId, {
                bookmarked: data.bookmarked,
                highlights: data.highlights,
                note: data.note,
                outcomeDeclarations: data.outcomeDeclarations
            })
            .then((response) => {
                removeLocalTaskData(taskId);

                if (response.redirectTask) {
                    taskStore.updateRedirectTask(response.redirectTask);
                    return;
                } else if (nextTask.id) {
                    router.redirect(
                        compile(config.routes.task)({
                            taskId: nextTask.id,
                            deliveryId: nextTask.deliveryId
                        })
                    );
                } else {
                    return taskService.getTask(taskId);
                }
            })
            .then(response => {
                if (!response) {
                    return;
                }

                // The component should show 100% progress.
                update(store => {
                    store.meta.numberOfTasks = response._meta.nrOfTasks;
                    store.meta.totalScored = response._meta.totalScored;
                    store.isLoading = false;
                    return store;
                });
            })
            .catch(error => {
                log.error(`Error: ${error.message}`);

                switch(error.responseStatus) {
                    case 409: {
                        update(store => {
                            store.isProjectInactive = true;
                            store.isLoading = false;
                            return store;
                        });
                        error.allowResubmit = false;
                        break;
                    }
                    case 400: {
                        update(store => {
                            store.isLoading = false;
                            return store;
                        });
                        error.allowResubmit = true;
                        break;
                    }
                }

                throw error;
            });
    },
    submitTasks: async (id, data) => {
        try {
            return await taskService.updateTask(id, data);
        } catch (error) {
            log.error(`Error: ${error.message}`);

            switch(error.responseStatus) {
                case 409: {
                    update(store => {
                        store.isProjectInactive = true;
                        store.isLoading = false;
                        return store;
                    });
                    error.allowResubmit = false;
                    break;
                }
                case 400: {
                    update(store => {
                        store.isLoading = false;
                        return store;
                    });
                    error.allowResubmit = true;
                    break;
                }
            }

            return Promise.reject(error);
        }
    },
    setInactiveProject: () => {
        update(store => {
            store.isProjectInactive = true;
            return store;
        });
    },
    /**
     * Check if there is a redirectTask, that means the Score must be redo
     * This triggers a modal to ask if user wants to redo the score
     * @param {Object} redirectTask
     * */
    updateRedirectTask: redirectTask => {
        if (redirectTask) {
            update(store => {
                store.redirectTask = redirectTask;
                return store;
            });
        }
    }
};
