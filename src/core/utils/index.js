// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

export { storage } from './storage';
export { locale, DEFAULT_LOCALE_ID } from './locale';
export { getErrorMessage, getErrorMsgFromCode } from './response';
export { getCompletionPercent } from './monitoring';
export { getQueryParam, setQueryParam } from './params';
export { isAssignmentStrategyValidForDelivery, getWarningMessage } from './validations';
export { log } from './logger.js';
export { isTermInString } from './search/search.js';
export { default as useRoute } from './route';
