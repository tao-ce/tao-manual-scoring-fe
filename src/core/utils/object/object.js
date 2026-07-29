// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * Gets deep property inside an object, if it exists.
 *
 * @param {Object} obj
 * @param {Array} properties
 *
 * @returns {any}
 */
export const getIn = (obj, properties = []) => {
    if (obj === null || typeof obj !== 'object') {
        return;
    }

    let buf = obj;
    for (const property of properties) {
        if (!buf[property]) {
            return void 0;
        }

        buf = buf[property];
    }

    return buf;
};

/**
 * Deeply compares two values
 *
 * @param {*} a - json-valid value
 * @param {*} b - json-valid value
 *
 * @returns {boolean}
 */
export const isEqual = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Converts array to key-value form (where the key is id).
 *
 * @param {Array<Object>} [data=[]] - data
 *
 * @returns {Object}
 */
export function keyById(data = []) {
    return data.reduce((res, o) => {
        res[o.id] = o;
        return res;
    }, {});
}

/**
 * Gets all the not nullable values of an object
 *
 * @param {Object} obj
 *
 * @returns {Object}
 */
export const getNotNullableValues = obj =>
    Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v != null) // removes null AND undefined
    );
