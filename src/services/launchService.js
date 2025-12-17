// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024-2025 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { __ } from '@oat-sa-private/ui-core';
import * as authService from './authService';
import { compile } from 'path-to-regexp';
import { locale, DEFAULT_LOCALE_ID } from '@/core/utils';
import router from '@/core/router';
import { log } from '../core/utils/logger';
import config from '../config';
import * as ltiService from './ltiService';

/**
 * Set application language
 *
 * @param {string|undefined} language
 * @returns {Promise}
 */
const setLanguage = language =>
    locale
        .setCode(language || DEFAULT_LOCALE_ID)
        .then(langCode => {
            locale.setLangAttribute(langCode);
        })
        .catch(log.warn);

/**
 * @typedef LTIError
 * @property {string} title
 * @property {string} description
 */

/**
 * @typedef LTIErrorResponse
 * @property {Object} [data]
 * @property {string} [data.ltiResourceLink]
 * @property {string} [data.language]
 * @property {Object} error
 * @property {string} error.code
 * @property {string} [error.log]
 * @property {boolean} error.recoverable
 */

/**
 * @param {Object} params
 * @param {string} params.code
 * @param {Object} params.error_data
 * @returns {LTIError|null}
 */
const getErrorMessage = ({ code: errorCode, error_data: logData }) => {
    let title = __('Scoring not available.');
    let description = __('Sorry, we cannot find the responses to score. Please contact your system administrator.');
    switch (errorCode) {
        case 'invalid_response_selection':
            return {
                title: __('Scoring not available.'),
                description: __(
                    'Sorry, we cannot find the responses to score. Please contact your system administrator.'
                )
            };
        case 'invalid_response_assignment':
            return {
                title: __('Scoring not available.'),
                description: __('There are no responses to score yet. Please wait and try again.')
            };
        case 'invalid_role':
            return {
                title: __('Grading not available.'),
                description: __('Please contact your administrator.')
            };
        case 'invalid_identity':
            return {
                title: __('Scoring not available.'),
                description: __('Please contact your system administrator.')
            };
        case 'delivery_execution_id_not_found':
            if ('ids' in logData) {
                title = __('No responses were found.');
                description = __(
                    'Delivery executions with following ids cannot be found: <br><strong>%s</strong><br>Please contact your system administrator.',
                    logData.ids.join(', ')
                );
            }
            return {
                title,
                description
            };
        case 'invalid_delivery_execution_id':
            if ('ids' in logData) {
                title = __('No responses were found.');
                description = __(
                    'Delivery executions with following ids are invalid: <br><strong>%s</strong><br>Please contact your system administrator.',
                    logData.ids.join(', ')
                );
            }
            return {
                title,
                description
            };
        case 'invalid_delivery_id':
            if ('ids' in logData) {
                title = __('No responses were found.');
                description = __(
                    'Deliveries with following ids are invalid: <br><strong>%s</strong><br>Please contact your system administrator.',
                    logData.ids.join(', '));
            }
            return {
                title,
                description
            };
        case 'invalid_test_taker_id':
            if ('ids' in logData) {
                title = __('Scoring is not available right now, because no responses were found.');
                description = __(
                    'This may happen if a student has just submitted the test. Please try again later. If the problem persists, please contact your system administrator. Test takers ids which were not found: <br><strong>%s</strong>',
                    logData.ids.join(', ')
                );
            }
            return {
                title,
                description
            };
        case 'too_many_tasks':
            title = __('Too many tasks to score.');
            if ('deliveryExecutionIds' in logData) {
                description = __(
                    'Delivery execution ids: <strong>%s</strong><br>Number of scoring tasks: <strong>%s</strong><br>Allowed maximum number of tasks: <strong>%s</strong><br>Please contact your system administrator.',
                    logData.deliveryExecutionIds.join(', '),
                    logData.numberOfTasks,
                    logData.allowedMaximumNumberOfTasks
                );
            } else if ('deliveryIds' in logData && 'testTakerIds' in logData) {
                description = __(
                    'Delivery ids: <strong>%s</strong><br>Test taker ids: <strong>%s</strong><br>Number of scoring tasks: <strong>%s</strong><br>Allowed maximum number of tasks: <strong>%s</strong><br>Please contact your system administrator.',
                    logData.deliveryIds.join(', '),
                    logData.testTakerIds.join(', '),
                    logData.numberOfTasks,
                    logData.allowedMaximumNumberOfTasks
                );
            }
            return {
                title,
                description
            };
        case 'delivery_and_test_taker_id_not_found':
            if ('ids' in logData && 'testTakerIds' in logData) {
                title = __('No responses were found.');
                description = __(
                    'Deliveries and test takers with following ids cannot be found.<br>Deliveries: <strong>%s</strong>, <br>Test takers: <strong>%s</strong>. <br>Please contact your system administrator.',
                    logData.ids.join(', '),
                    logData.testTakerIds.join(', ')
                );
            }
            return {
                title,
                description
            };
        case 'empty_delivery_ids_and_test_takers':
            return {
                title: __('Delivery ID(s) and Test Taker ID(s) are empty or not defined.'),
                description: __('Please contact your system administrator.')
            };
        case 'empty_delivery_ids':
            return {
                title: __('Delivery ID(s) is empty or not defined.'),
                description: __('Please contact your system administrator.')
            };
        case 'empty_test_takers_ids':
            return {
                title: __('Test Taker ID(s) is empty or not defined.'),
                description: __('Please contact your system administrator.')
            };
        case 'reviewer_is_scorer':
            return {
                title: __('Review failed: The reviewer cannot be the same user as the original scorer.'),
                description: __('Please assign a different reviewer to ensure an independent review of the score.')
            };
        case 'invalid_scoring_category':
            return {
                title: __('Invalid Scoring Category'),
                description: __('Please check the scoringCategory value. It must be valid and cannot be empty.')
            };
        case 'invalid_custom_claim_argument':
            return {
                title: __('Invalid custom claim.'),
                description: __(
                    'Invalid parameter, claim requires [%s] must not be empty and, type [%s].',
                    logData.field,
                    logData.type
                )
            };
        case 'custom_claim_argument_required':
            return {
                title: __('Required custom claim.'),
                description: __(
                    'Missing parameter, claim requires [%s] parameter to be present.',
                    logData.field
                )
            };
    }
    return null;
};

/**
 * @param {boolean} isRecoverable
 * @param {string} [errorLog]
 * @returns {string}
 */
export const getErrorLog = (isRecoverable, errorLog = '') => {
    const isRecoverablePrefix = isRecoverable ? '[RECOVERABLE]' : '[IRRECOVERABLE]';
    return `${isRecoverablePrefix} ${errorLog}`;
};

/**
 *
 * @param {string} ltiResourceLink
 * @param {LTIError} [errorMessage]
 * @param {boolean} [recoverable]
 * @param {string} [errorLog]
 * @returns {string}
 */
export const compileLtiReturnUrl = (ltiResourceLink, errorMessage, recoverable, errorLog) => {
    const resultUrl = new URL(ltiResourceLink);
    const errorMessageString = errorMessage ? `${errorMessage.title}${errorMessage.description}` : '';
    resultUrl.searchParams.append('lti_errormsg', errorMessageString);
    resultUrl.searchParams.append('lti_errorlog', getErrorLog(recoverable, errorLog));
    return resultUrl.toString();
};

/**
 * Get launch error messages
 * @param {LTIErrorResponse} response
 * @returns {LTIError|null}
 */
const getInternalError = response => {
    log.error(getErrorLog(response.error.recoverable, response.error.log));
    return getErrorMessage(response.error);
};

/**
 *
 * @param {LTIErrorResponse} response server error
 * @returns {LTIError|void|string} redirects or returns props for internal error page
 */
const validateServerError = response => {
    const internalError = getInternalError(response);
    if (!internalError) {
        return router.redirect(config.routes.ltiError);
    }
    return internalError;
};

/**
 * Exchange session token to access token
 *
 * @param {string} sessionToken
 * @returns {Promise<LTIError|undefined> | undefined}
 */
export const validateSessionToken = async (sessionToken) => {
    if (typeof sessionToken !== 'string') {
        router.redirect(config.routes.ltiError);
        return;
    }

    try {
        const { _meta } = await authService.exchangeToken(sessionToken);

        if (typeof _meta !== 'object') {
            return;
        }

        const {
            internalDeliveryId,
            taskId,
            ltiResourceLink,
            ltiResourceLabel,
            language,
            breadcrumbs,
            testTakerName,
            hideNoteBox
        } = _meta;

        await setLanguage(language);
        ltiService.setConfig({ ltiResourceLink, ltiResourceLabel, breadcrumbs, testTakerName, hideNoteBox });

        if (internalDeliveryId && taskId) {
            router.replace(
                compile(config.routes.task)({
                    deliveryId: internalDeliveryId,
                    taskId
                })
            );
        } else {
            router.replace(config.routes.ltiError);
        }
    } catch (err) {
        if (typeof err === 'object' && err.errorCode === 400 && err.response) {
            return err.response
                .json()
                .then(response => {
                    const language = response.data && response.data.language;
                    if (language) {
                        return setLanguage(language).then(() => validateServerError(response));
                    }

                    return validateServerError(response);
                })
                .catch(error => {
                    log.error(`Parse response: ${error}`);
                    router.redirect(config.routes.ltiError);
                });
        } else if (err?.error && err.responseStatus === 400) {
            return setLanguage(err?.data?.language ?? '').then(() => validateServerError(err));
        } else {
            log.error(`Token exchange ${err}`);
            router.redirect(config.routes.ltiError);
        }
    }
};
