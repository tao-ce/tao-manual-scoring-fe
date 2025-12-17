// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { isTermInString } from './search';

describe('isTermInString util', () => {
    it('works as expected with simple search term', () => {
        expect(isTermInString('English Test', 'english')).toBeTrue();
    });

    it('should return true if term is empty', () => {
        expect(isTermInString('English Test', '')).toBeTrue();
    });

    it('works as expected with white spaces before/after search term', () => {
        expect(isTermInString('English Test', ' english')).toBeTrue();
        expect(isTermInString('English Test', ' english  ')).toBeTrue();
    });

    it('works as expected with different cases', () => {
        expect(isTermInString('English Test', 'ENGLISH')).toBeTrue();
        expect(isTermInString('English Test', 'TeSt')).toBeTrue();
    });

    it('works as expected when search term is not found', () => {
        expect(isTermInString('English Test', 'maths')).toBeFalse();
    });

    it('works as expected when search term is null', () => {
        expect(isTermInString(null, 'math')).toBeFalse();
    });
});
