// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

// eslint-disable-next-line es/no-classes
export class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.responseStatus = 404;
    }
}
