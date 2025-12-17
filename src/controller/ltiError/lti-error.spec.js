// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock(
    '@/component/LtiError/LtiError',
    () =>
        function() {
            this.$on = jest.fn();
            this.$destroy = jest.fn();
        }
);
jest.mock('@/core/apiRequest/apiRequest');

import ltiErrorControllerFactory from './lti-error';

describe('Tasks controller', () => {
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
});
