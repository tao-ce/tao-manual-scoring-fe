// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 *
 * Finds whether search term is included in the string
 *
 * @param {string|null} string - String in which search term should be searched
 * @param {string} term - Search term
 *
 * @returns {boolean}
 */
export const isTermInString = (string, term) => {
    if (string === null) {
        return false;
    }

    return string.toLowerCase().includes(term.toLowerCase().trim());
};
