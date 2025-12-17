// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2022 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const LTI_CONFIG_NAME = 'ltiConfig';
/**
 * Returns the LTI config stored at ltiLaunch launch by launch.js controller
 *
 * @returns {Object}
 */
export const getConfig = () => JSON.parse(window.sessionStorage.getItem(LTI_CONFIG_NAME));

/**
 * Remove the LTI config from session storage
 */
export const removeConfig = () => {
    window.sessionStorage.removeItem(LTI_CONFIG_NAME);
};

/**
 * Set LTI config
 *
 * @param {Object} ltiConfig
 */
export const setConfig = ltiConfig => {
    window.sessionStorage.setItem(LTI_CONFIG_NAME, JSON.stringify(ltiConfig));
};

/**
 * Remove lti config from storage
 */
 export const logoutLti = () => {
    removeConfig();
};

/**
 * Redirect to return url
 * @param {string | URL} returnUrl
 */
export const redirectToReturnUrl = returnUrl => {
    logoutLti();
    window.location.replace(returnUrl);
}
