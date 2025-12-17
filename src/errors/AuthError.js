// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

// eslint-disable-next-line es/no-classes
export class AuthError extends Error {
    constructor(message = 'User is not logged in') {
        super(message);
        this.name = 'AuthError';
    }
}
