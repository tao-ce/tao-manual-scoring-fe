// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/routes/ltiError/+page.svelte', () =>
    jest.fn().mockImplementation(function LtiErrorPageMock() {
        this.$on = jest.fn();
        this.$destroy = jest.fn();
    })
);
jest.mock('@/core/apiRequest/apiRequest');

import LtiErrorPage from '@/routes/ltiError/+page.svelte';
import ltiErrorControllerFactory from './lti-error';
import { ERROR_CODES } from '@/constants/error-codes';

describe('LTI error controller', () => {
    it('controller is a factory', () => {
        expect(typeof ltiErrorControllerFactory).toBe('function');
        expect(ltiErrorControllerFactory()).not.toBe(ltiErrorControllerFactory());
    });

    it('it destroys component', () => {
        const ltiErrorController = ltiErrorControllerFactory();
        ltiErrorController.start();
        ltiErrorController.destroy();

        expect(ltiErrorController.component.$destroy).toHaveBeenCalled();
    });

    it('passes reason query param to LtiError when present in the URL', () => {
        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: new URL(`http://localhost/ltiError?reason=${ERROR_CODES.NO_TASKS_TO_SCORE}`)
        });

        try {
            LtiErrorPage.mockClear();
            const ltiErrorController = ltiErrorControllerFactory();
            ltiErrorController.start();

            expect(LtiErrorPage).toHaveBeenCalledWith(
                expect.objectContaining({
                    props: { reason: ERROR_CODES.NO_TASKS_TO_SCORE }
                })
            );
        } finally {
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: originalLocation
            });
        }
    });
});
