// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('../core/apiRequest/apiRequest');

import * as ltiService from './ltiService';

const config = {
    ltiResourceLink: 'http://example.com',
    ltiResourceLabel: 'back to example.com'
};

describe('ltiService', () => {
    it('set,get and remove config', () => {
        expect(ltiService.getConfig()).toBeNil();
        ltiService.setConfig(config);
        expect(ltiService.getConfig()).toEqual(config);
        ltiService.removeConfig();
        expect(ltiService.getConfig()).toBeNil();
    });
    it('logout LTI user', async () => {
        ltiService.setConfig(config);

        ltiService.logoutLti();
        expect(ltiService.getConfig()).toBeNil();
    });

    it('redirect and logout lti user', async () => {
        const returnUrlWithParams =
            'http://example.com/?lti_errormsg=Scoring+not+available.&lti_errorlog=%5BRECOVERABLE%5D+';
        Object.defineProperty(window, 'location', {
            value: {
                replace: jest.fn()
            }
        });

        ltiService.redirectToReturnUrl(returnUrlWithParams);
        expect(window.location.replace).toHaveBeenCalledWith(returnUrlWithParams);
    });
});
