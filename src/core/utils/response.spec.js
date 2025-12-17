// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { getErrorMessage } from './response';
import { ERROR_CODES } from '../../constants/error-codes';
describe('hetErrorMessage', () => {
    it('should retrun formatted string with multiple errors for multiple users', () => {
        expect(
            getErrorMessage({
                'user 4': [ERROR_CODES.FORBIDDEN_CHAR_IN_USERNAME, ERROR_CODES.SHORT_PASSWORD],
                user_5: [ERROR_CODES.EMPTY_PASSWORD]
            })
        ).toBe(' user 4 - Forbidden character in username,Short password; user_5 - Empty password');
    });
    it('should return emprty string for empty object', () => {
        expect(getErrorMessage({})).toBe('');
    });
});
