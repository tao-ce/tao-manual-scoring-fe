// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2022 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { __ } from '@oat-sa-private/ui-core';
import { storage } from './storage';

export const DEFAULT_LOCALE_ID = 'en-US';

export const locale = {
    supportedCodes: [
        'ar-SA',
        'cs-CZ',
        'da-DK',
        'de-DE',
        'en-US',
        'es-ES',
        'fi-FI',
        'fr-FR',
        'gl-ES',
        'hu-HU',
        'is-IS',
        'it-IT',
        'ja-JP',
        'lt-LT',
        'nb-NO',
        'nl-NL',
        'nn-NO',
        'pl-PL',
        'pt-BR',
        'pt-PT',
        'ro-RO',
        'sk-SK',
        'sv-SE',
        'val-ES',
    ],

    isLangSupported(lang) {
        return this.supportedCodes.indexOf(lang) !== -1;
    },

    /**
     * Returns the code Order of loading the right language:
     * 1. From localstorage (if its a returning user and he has a set language in localstorage)
     * 2. Browser language form `navigator.language
     * 3. Default language which is English
     *
     * @returns {Promise<string>}
     */
    getStoredCode() {
        return storage
            .then(store => store.getItem('lang'))
            .then(langCode => {
                const localeId = langCode || navigator.language;

                return this.isLangSupported(localeId) ? localeId : DEFAULT_LOCALE_ID;
            });
    },

    /**
     * Set the application locale.
     *
     * @param {String} langCode - unified language key.
     *
     * @returns {Promise} - rejected if code is not supported, resolved otherwise.
     */
    setApplicationLocale(langCode) {
        if (!this.isLangSupported(langCode)) {
            return Promise.reject(new Error('The language is not supported'));
        }

        return __.setLocale(langCode);
    },

    /**
     * Sets the lang attribute on html tag
     *
     * @param {String} langCode - unified language key.
     */
    setLangAttribute(langCode) {
        document.documentElement.setAttribute('lang', langCode);
    },

    /**
     * Store the code and import locale.
     *
     * @param {string} langCode - unified language id (eg en-US)
     *
     * @returns {Promise<Error>|Promise<string>} - returns rejected promise if language is not supported,
     *      resolved promise with lang code otherwise
     */
    setCode(langCode) {
        return Promise.all([
            storage,
            this.setApplicationLocale(langCode) // If it fails the whole Promise.all fails
        ])
            .then(([store]) => store.setItem('lang', langCode))
            .then(() => langCode);
    }
};
