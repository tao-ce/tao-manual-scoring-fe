// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { NotFoundError } from './NotFoundError';

describe('NotFoundError', () => {
    it('should be an instance of Error', () => {
        const error = new NotFoundError();
        expect(error).toBeInstanceOf(Error);
    });

    it('should have default message', () => {
        const error = new NotFoundError();
        expect(error.message).toBe('Resource not found');
    });

    it('should allow custom message', () => {
        const customMessage = 'Custom error message';
        const error = new NotFoundError(customMessage);
        expect(error.message).toBe(customMessage);
    });

    it('should have name property set to NotFoundError', () => {
        const error = new NotFoundError();
        expect(error.name).toBe('NotFoundError');
    });

    it('should have responseStatus property set to 404', () => {
        const error = new NotFoundError();
        expect(error.responseStatus).toBe(404);
    });

    it('should be identifiable with instanceof', () => {
        const error = new NotFoundError();
        expect(error instanceof NotFoundError).toBe(true);
    });
});
