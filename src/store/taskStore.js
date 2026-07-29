// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { writable } from 'svelte/store';
import config from '@/config';
import router from '@/core/router';
import { __ } from '@oat-sa-private/ui-core';
import { compile } from 'path-to-regexp';
import { TASK_DATA_TYPE, saveLocalTaskData, getLocalTaskData, removeLocalTaskData } from '@/core/utils/task';
import { TASK_STATUS, TASK_TYPE } from '../constants/task';
import { log } from '@/core/utils';
import { isEqual, getNotNullableValues } from '@/core/utils/object';
import { toArray } from '@/core/utils/array';
import * as taskService from '../services/taskService';
import * as ltiService from '../services/ltiService';
import { getUser } from '@/services/authService';
import { NotFoundError } from '@/errors/NotFoundError.js';
import { ERROR_MESSAGES } from '@/constants/error-messages.js';
import { ERROR_CODES } from '@/constants/error-codes.js';

/**
 * @typedef {Object} ScoringServerMetadata
 * // TODO: define the type correctly
 * @property {Object} deliveryExecutionScoring
 * @property {?string} nextTaskDeliveryId
 * @property {?string} nextTaskId
 * @property {number} nrOfTasks
 * // TODO: define the items type correctly
 * @property {Array} orderedItems
 * @property {number} position
 * @property {?string} prevTaskDeliveryId
 * @property {?string} prevTaskId
 * @property {number} totalScored
 */

/**
 * @typedef {Object} ScoringClientMetadata
 * @property {number} numberOfTasks
 * @property {number} position
 * @property {number} totalScored
 * @property {boolean} interrupted
 * @property {?Object} prevTask
 * @property {?string} prevTask.id
 * @property {?string} prevTask.deliveryId
 * @property {?Object} nextTask
 * @property {?string} nextTask.id
 * @property {?string} nextTask.deliveryId
 * @property {string} taskType
 * // TODO: define the items type correctly
 * @property {Array<Object>} previousScores
 * // TODO: define the type correctly
 * @property {Object} deliveryExecutionScoring
 */

const getInitialState = () => ({
    isLoading: true,
    isProjectInactive: false,
    interrupted: false,
    task: null,
    meta: null,
    ltiConfig: {},
    redirectTask: null,
    adminReviewList: [],
    adminReviewListActiveTab: 'admin', // 'admin' | 'previous-scorer-<id>'
    isUsersOwnTabSelected: true,
    suspiciousDelivery: {}
});

const { subscribe, update, set } = writable(getInitialState());

/**
 * @param {string} userId
 * @param {Array<{userId: string}>} [scoringData=[]]
 * @returns {Object}
 */
const getScoringDataFromUser = (userId, scoringData = []) => scoringData.find(data => data.userId === userId) || {};

/**
 * Helper function to map a linked task and enrich its outcomeDeclarations.
 * @param {Object} lt - The linked task object.
 * @param {Object} data - The main task data containing outcomeDeclarations.
 * @param {Object} ltScoring
 * @returns {Object} The mapped linked task with enriched outcomeDeclarations.
 */
function mapLinkedTask(lt, data, ltScoring) {
    const scoringData = getScoringDataFromUser(lt.enrollment?.userName, ltScoring);

    lt.outcomeDeclarations.forEach(od => {
        const parentDeclaration = data.outcomeDeclarations.find(
            decl => decl.outcomeDeclarationId === od.outcomeDeclarationId
        );
        if (parentDeclaration) {
            od.interpretation = parentDeclaration.interpretation;
            od.longInterpretation = parentDeclaration.longInterpretation;
            od.minimumValue = parentDeclaration.minimumValue;
            od.maximumValue = parentDeclaration.maximumValue;
            od.scoringScale = parentDeclaration.scoringScale;
        }
    });
    return {
        id: lt.id,
        note: lt.note,
        fullname:
            lt.enrollment?.firstName && lt.enrollment?.lastName
                ? `${lt.enrollment.firstName} ${lt.enrollment.lastName}`
                : lt.enrollment?.userName,
        username: lt.enrollment?.userName,
        scores: lt.outcomeDeclarations,
        scoringViolation: lt.scoringViolation,
        deliveryExecutionScoring: { ...scoringData },
        isAppeal: lt.isAppeal || false,
        highlights: lt.highlights || [],
        bookmarked: lt.bookmarked || false,
        type: lt.type
    };
}

async function fetchTaskWithRetry(taskId, locale) {
    let lastError = void 0;

    for (let currentAttempt = 1; currentAttempt <= TASK_LOAD_RETRY.MAX_ATTEMPTS; currentAttempt++) {
        try {
            return await taskService.getTask(taskId, locale);
        } catch (error) {
            if (!(error instanceof NotFoundError)) {
                throw error;
            }

            lastError = error;
            await new Promise(resolve => setTimeout(resolve, TASK_LOAD_RETRY.BASE_DELAY_MS));
        }
    }

    if (lastError) {
        throw lastError;
    }
}

/**
 * Maps server scoring metadata to client scoring metadata with safe defaults for all fields.
 * @param {ScoringServerMetadata} [metadata={}]
 * @returns {ScoringClientMetadata}
 */
function mapScoringMetadata(metadata = {}) {
    const ltiConfig = ltiService.getConfig();
    const isReadOnly = ltiConfig?.isReadOnly ?? false;
    const isAdminOrGroupManager = ltiConfig?.isAdministrative ?? false;

    // Normalize scalar metadata values with sensible defaults
    const numberOfTasks = metadata.nrOfTasks ?? 0;
    const position = metadata.position ?? 0;
    const interrupted = metadata.interrupted ?? false;

    // If is readOnly, we should take into account submitted + scored tasks,
    // because isReadOnly won't reopen the task by setting it to 'scored
    // If isReadOnly and user is admin or group manager, we should always consider 100% complete
    let totalScored = metadata.totalScored ?? 0;
    if (isReadOnly) {
        totalScored = isAdminOrGroupManager ? metadata.nrOfTasks : totalScored + (metadata.totalSubmitted ?? 0);
    }

    // Only construct prev/next tasks when their IDs exist
    const prevTask = metadata.prevTaskId
        ? {
              id: metadata.prevTaskId,
              deliveryId: metadata.prevTaskDeliveryId || null
          }
        : null;
    const nextTask = metadata.nextTaskId
        ? {
              id: metadata.nextTaskId,
              deliveryId: metadata.nextTaskDeliveryId || null
          }
        : null;

    // Normalize arrays and objects with consistent empty defaults
    const linkedTasks = toArray(metadata.linkedTasks);
    const linkedTasksDeliveryExecutionScoring = toArray(metadata.linkedTasksDeliveryExecutionScoring);
    const deliveryExecutionScoring = metadata.deliveryExecutionScoring ?? null;

    // Only consider tasks linked if array exists and has items
    const hasLinkedTasks = linkedTasks.length > 0;
    const taskType = hasLinkedTasks ? TASK_TYPE.REVIEW : TASK_TYPE.SCORING;

    const isAdministrative = metadata?.isAdministrative ?? false;

    const result = {
        numberOfTasks,
        position,
        totalScored,
        prevTask,
        nextTask,
        taskType,
        previousScores: [],
        deliveryExecutionScoring,
        hasLinkedTasks,
        linkedTasks,
        linkedTasksDeliveryExecutionScoring,
        isAdministrative,
        interrupted,
        isReadOnly
    };

    if (hasLinkedTasks) {
        result.previousScores = linkedTasks.map(lt => ({
            id: lt?.id || null,
            note: lt?.note || '',
            fullname:
                lt?.enrollment?.firstName && lt?.enrollment?.lastName
                    ? `${lt.enrollment.firstName} ${lt.enrollment.lastName}`
                    : lt?.enrollment?.userName || '',
            username: lt?.enrollment?.userName || '',
            scores: toArray(lt?.outcomeDeclarations),
            scoringViolation: lt?.scoringViolation || false,
            highlights: toArray(lt?.highlights)
        }));
    }

    return result;
}

/**
 * Helper function to build the admin review list.
 *
 * @param {String} taskId
 * @param {Array} outcomeDeclarations
 * @param {Array} previousScores
 * @param {boolean} isReadOnly
 * @param {boolean} isAdministrative
 * @returns {Array} list of admin review items
 */
async function buildAdminReviewList({
    taskId,
    outcomeDeclarations,
    previousScores,
    isReadOnly = false,
    isAdministrative = false,
    scorersToReview = null
}) {
    // outcomeDeclarations may be passed as the whole task object (containing
    // an `outcomeDeclarations` property) or directly as an array. Normalize
    // to always have an array of declarations in `outcomeDecls`.
    const outcomeDecls = Array.isArray(outcomeDeclarations)
        ? outcomeDeclarations
        : outcomeDeclarations?.outcomeDeclarations || [];
    let badge = null;
    const isAppeal = previousScores?.some(declaration => declaration.isAppeal);
    // Prefer explicit previousScores (linked tasks) when available. If not,
    // fall back to using `scorersToReview` provided by the LTI launch to
    // construct the reviewer tabs.
    const list = previousScores?.length
        ? previousScores.map(declaration => {
              if (declaration?.isAppeal) {
                  badge = { text: __('Appeal'), color: 'warning' };
              } else if (isAppeal) {
                  badge = { text: __('Standard'), color: 'neutral' };
              }

              return {
                  key: declaration?.id,
                  isAdmin: false,
                  isAppeal: declaration?.isAppeal,
                  badge,
                  label: declaration.fullname,
                  note: declaration?.note || '',
                  highlights: declaration.highlights,
                  bookmarked: declaration.bookmarked,
                  outcomeDeclarations: declaration?.scores,
                  deliveryExecutionScoring: declaration?.deliveryExecutionScoring,
                  ...(declaration?.deliveryExecutionScoring?.suspicious ||
                  declaration?.deliveryExecutionScoring?.notEnoughBasisForAssessment
                      ? { icon: { name: 'lightning-16', warning: false } }
                      : {})
              };
          })
        : Array.isArray(scorersToReview) && scorersToReview.length > 0
        ? scorersToReview.map(scorer => ({
              key: scorer.userId || scorer.key || scorer,
              isAdmin: false,
              isAppeal: false,
              badge: null,
              label: scorer.userId || scorer.label || scorer,
              highlights: [],
              bookmarked: false,
              outcomeDeclarations: [],
              deliveryExecutionScoring: {}
          }))
        : [];

    let user;
    let adminLabel = __('My final score');
    if (isAppeal) {
        try {
            user = await getUser();
            adminLabel = __('My appeal score (%s)', user?.userData?.login);
        } catch (error) {
            adminLabel = __('My appeal score');
            log.error(error);
        }
    }

    // Decide whether to include the admin ("My final score") tab. In some
    // LTI launches (e.g. administrative read-only with 1 or 2 scorers to
    // review) the admin tab should not be exposed.
    const includeAdmin = !(
        isAdministrative &&
        isReadOnly &&
        Array.isArray(scorersToReview) &&
        scorersToReview.length > 0
    );

    if (includeAdmin) {
        list.push({
            key: taskId,
            isAdmin: true,
            isAppeal,
            label: adminLabel,
            highlights: [],
            outcomeDeclarations: outcomeDecls,
            bookmarked: false
        });
    }

    // Ensure consistent ordering: show review tabs before scoring tabs
    // (fallback to empty string when type is missing).
    list.sort((a, b) => (b.type || '').localeCompare(a.type || ''));

    return list;
}

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
    setAsInterrupted: (isInterruptedByUnknownReasons = false) => {
        update(store => {
            store.interrupted = true;
            store.interruptedErrorMessage = isInterruptedByUnknownReasons
                ? ERROR_MESSAGES.INTERRUPTED_BY_UNKNOWN_REASONS
                : ERROR_MESSAGES.INTERRUPTED_BY_ADMIN;
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
    updateScore: ({ score, outcomeDeclarationId }) => {
        update(store => {
            const foundIndex = store.task.outcomeDeclarations.findIndex(
                od => od.outcomeDeclarationId === outcomeDeclarationId
            );
            if (foundIndex === -1) {
                throw new Error(`Cannot find ${outcomeDeclarationId} in task outcomeDeclarations`);
            }
            store.task.outcomeDeclarations[foundIndex].value = score;

            return store;
        });
    },
    updateNote: note => {
        update(store => {
            store.task.note = note;
            return store;
        });
    },
    saveDeliveryExecutionScoring: async deliveryExecutionScoring => {
        const {
            id,
            deliveryExecutionId,
            note,
            suspicious,
            suspiciousNote,
            notEnoughBasisForAssessment,
            notEnoughBasisForAssessmentNote
        } = deliveryExecutionScoring;
        const data = getNotNullableValues({
            deliveryExecutionId,
            note,
            suspicious,
            suspiciousNote,
            notEnoughBasisForAssessment,
            notEnoughBasisForAssessmentNote
        });

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
    storeDeliveryExecutionScoring: deliveryExecutionScoring => {
        update(store => {
            store.meta.deliveryExecutionScoring = deliveryExecutionScoring;
            return store;
        });
    },
    loadTask: async (taskId, locale) => {
        update(store => {
            store.isLoading = true;
            return store;
        });

        try {
            const { redirectTask, data, _meta } = await taskService.getTask(taskId, locale);

            if (redirectTask) {
                taskStore.updateRedirectTask(redirectTask);
                return;
            }

            const ltiConfig = ltiService.getConfig();

            if (!ltiConfig?.isReadOnly && data.status === TASK_STATUS.SUBMITTED) {
                router.redirect('/');
                return;
            }

            const meta = mapScoringMetadata(_meta);

            const linkedTasks = meta.linkedTasks;
            const hasLinkedTasks = meta.hasLinkedTasks;
            const taskType = meta.taskType;
            const linkedTasksDeliveryExecutionScoring = meta.linkedTasksDeliveryExecutionScoring;

            const serverTaskData = taskService.getServerTaskData(data);

            const [initialTaskData, currentTaskData] = await Promise.all([
                getLocalTaskData(taskId, TASK_DATA_TYPE.INITIAL),
                getLocalTaskData(taskId, TASK_DATA_TYPE.CURRENT)
            ]);

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

            // prepare review data, if scorersToReview exists
            if ((ltiConfig?.isReview || ltiConfig?.isReadOnly) && ltiConfig?.scorersToReview) {
                // add previous scores to outcomeDeclarations to show in admin review list
                let newPreviousScores = [];
                if (hasLinkedTasks) {
                    newPreviousScores = linkedTasks.map(lt =>
                        mapLinkedTask(lt, data, linkedTasksDeliveryExecutionScoring)
                    );
                }
                // create review list
                const adminReviewList = await buildAdminReviewList({
                    taskId: taskId,
                    outcomeDeclarations: taskData,
                    previousScores: newPreviousScores,
                    isReadOnly: ltiConfig?.isReadOnly,
                    isAdministrative: ltiConfig?.isAdministrative,
                    scorersToReview: ltiConfig?.scorersToReview
                });
                // update suspicious delivery if exists
                const suspiciousData = {
                    suspicious: false,
                    notEnoughBasisForAssessment: false
                };
                for (const score of linkedTasksDeliveryExecutionScoring) {
                    suspiciousData.suspicious = score?.suspicious || suspiciousData.suspicious;
                    suspiciousData.notEnoughBasisForAssessment =
                        score?.notEnoughBasisForAssessment || suspiciousData.notEnoughBasisForAssessment;
                }
                const defaultTabKey =
                    adminReviewList.find(entry => entry.isAdmin)?.key ?? adminReviewList[0]?.key ?? 'admin';

                update(store => {
                    store.adminReviewList = adminReviewList;
                    store.adminReviewListActiveTab = defaultTabKey;
                    store.suspiciousDelivery = suspiciousData;
                    return store;
                });
            } else {
                update(store => {
                    store.adminReviewList = [];
                    store.adminReviewListActiveTab = 'admin';
                    store.suspiciousDelivery = null;
                    return store;
                });
            }
        } catch (error) {
            log.error(error);

            if (error.responseStatus === 409) {
                return update(store => {
                    store.isProjectInactive = true;
                    return store;
                });
            }

            return router.redirect(config.routes.error);
        }
    },
    loadNextTask: (taskId, taskData, nextTask = {}) => {
        const data = taskService.formatTaskData(taskData);
        const ltiConfig = ltiService.getConfig();

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
                outcomeDeclarations: data.outcomeDeclarations,
                isReadOnly: ltiConfig?.isReadOnly ?? false
            })
            .then(response => {
                removeLocalTaskData(taskId);

                if (response.redirectTask) {
                    taskStore.updateRedirectTask(response.redirectTask);
                    update(store => {
                        store.isLoading = false;
                        return store;
                    });

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
                    store.meta.interrupted = response._meta.interrupted ?? false;
                    store.isLoading = false;
                    return store;
                });
            })
            .catch(error => {
                log.error(`Error: ${error.message}`);

                switch (error.responseStatus) {
                    case 409: {
                        error?.interrupted || error.error?.message === ERROR_CODES.NULL_SESSION_TOKEN_ID
                            ? update(store => {
                                  store.interrupted = true;
                                  store.isLoading = false;
                                  return store;
                              })
                            : update(store => {
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
            const response = await taskService.updateTask(id, data);
            update(state => {
                if (state.task?.id !== id) {
                    log.debug(
                        '[taskStore#submitTasks] The updated task does not match the current task in the store. Skipping state update.'
                    );
                    return state;
                }
                return {
                    ...state,
                    task: {
                        ...state.task,
                        highlights: data.highlights
                    },
                    meta: mapScoringMetadata(response._meta)
                };
            });
            return response;
        } catch (error) {
            log.error(`Error: ${error.message}`);

            switch (error.responseStatus) {
                case 409: {
                    error?.interrupted
                        ? update(store => {
                              store.interrupted = true;
                              store.isLoading = false;

                              return store;
                          })
                        : update(store => {
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
    },
    /**
     * Update the active tab in the admin review list
     * @param {String} key
     */
    updateAdminReviewListActiveTab: key => {
        update(store => {
            store.adminReviewListActiveTab = key;
            store.isUsersOwnTabSelected = key === store.task?.id;
            return store;
        });
    },

    persistHighlights: (taskId, highlights) =>
        taskService.updateTask(taskId, { highlights }).then(() => {
            update(store => {
                store.task.highlights = highlights;
                return store;
            });
        })
};
