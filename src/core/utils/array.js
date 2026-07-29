// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License


/**
 * @param {*} value 
 * @returns {Array} - original array or empty array if original value is not an array
 */
export function toArray(value) {
    return Array.isArray(value) ? value : [];
}
