// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
import router from '@/core/router';

/**
 * Gets query param value
 *
 * @param {string} param - param name
 * @returns {String|undefined}
 */
export const getQueryParam = param => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
};

/**
 * Sets query param value
 *
 * @param {string} param - param name
 * @param {string} value - param value
 */
export const setQueryParam = (param, value) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set(param, value);

    router.replace(`${window.location.pathname}?${searchParams.toString()}`, false);
};
