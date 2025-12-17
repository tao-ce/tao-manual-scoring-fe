// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { __ } from '@oat-sa-private/ui-core';
import { ERROR_CODES } from '@/constants/error-codes';

const errorsMap = {
    get [ERROR_CODES.LONG_USERNAME]() {
        return __('Long username');
    },
    get [ERROR_CODES.SHORT_USERNAME]() {
        return __('Short username');
    },
    get [ERROR_CODES.FORBIDDEN_CHAR_IN_USERNAME]() {
        return __('Forbidden character in username');
    },
    get [ERROR_CODES.EMPTY_PASSWORD]() {
        return __('Empty password');
    },
    get [ERROR_CODES.SHORT_PASSWORD]() {
        return __('Short password');
    },
    get [ERROR_CODES.LONG_PASSWORD]() {
        return __('Long password');
    },
    get [ERROR_CODES.EMPTY_ROLE]() {
        return __('Empty role');
    },
    get [ERROR_CODES.ALREADY_ASSIGNED]() {
        return __('Already assigned');
    },
    get [ERROR_CODES.NOT_FOUND]() {
        return __('Not found');
    },
    get [ERROR_CODES.EMPTY_ASSIGNMENT_CRITERION]() {
        return __('Empty assignment criterion');
    },
    get [ERROR_CODES.SYSTEM_USER_CONFLICT]() {
        return __('System user conflict');
    },
    get [ERROR_CODES.IRRELEVANT_ROLE]() {
        return __('The role does not exist in the selected scoring strategy');
    },
    get [ERROR_CODES.INVALID_OUTCOME_DECLARATIONS]() {
        return __('Invalid outcome declarations');
    }
};

/**
 * Returns error string for respective error code
 *
 * @param {string} errorCode
 *
 * @returns {string}
 */
export const getErrorMsgFromCode = errorCode => errorsMap[errorCode];

/**
 *  Returns text message for the errors map
 *
 * @param {Object.<string, Array<ERROR_CODES>>} errors - errors field from response with the following format:
 *  { key1: [value1], key2: [value1, value2] }
 * @returns {string} in format 'key1 - value1; key2 - value1, value2'
 */
export const getErrorMessage = errors =>
    Object.keys(errors).reduce((acc, k) => {
        const prev = acc ? `${acc};` : '';
        return `${prev} ${k} - ${errors[k].map(getErrorMsgFromCode).join(',')}`;
    }, '');
