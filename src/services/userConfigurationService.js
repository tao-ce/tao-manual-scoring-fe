// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * @typedef UserConfig
 */

/**
 * @type {UserConfig}
 */
export const DEFAULT_USER_CONFIG = {
    isSuggestedScoringEnabled: true,
    isMarkAsSuspiciousForCheatingEnabled: false
};

/**
 * Set users config
 * @param {UserConfig} userConfiguration
 */
export const setConfig = userConfiguration => {
    const config = Object.assign({}, DEFAULT_USER_CONFIG, userConfiguration);
    window.localStorage.setItem('userConfiguration', JSON.stringify(config));
};

/**
 * Provides users config
 * @returns {UserConfig} userConfiguration
 */
export const getConfig = () => {
    const config = JSON.parse(window.localStorage.getItem('userConfiguration'));
    return Object.assign({}, DEFAULT_USER_CONFIG, config);
};
