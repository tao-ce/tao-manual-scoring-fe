// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { toArray } from '@/core/utils/array';

describe('toArray', () => {
    test('returns same array instance when given an array', () => {
        const arr = [1, 2, 3];
        const res = toArray(arr);
        expect(res).toBe(arr);
    });

    test('returns empty array for undefined', () => {
        expect(toArray()).toEqual([]);
    });

    test('returns empty array for null', () => {
        expect(toArray(null)).toEqual([]);
    });

    test('returns empty array for non-array objects', () => {
        expect(toArray({ 0: 'a', length: 1 })).toEqual([]);
    });

    test('returns empty array for string', () => {
        expect(toArray('hello')).toEqual([]);
    });

    test('returns empty array for typed arrays', () => {
        const ta = new Int8Array([1, 2]);
        expect(toArray(ta)).toEqual([]);
    });
});
