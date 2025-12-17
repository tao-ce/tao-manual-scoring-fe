// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('../../services/ltiService', () => ({
    __esModule: true,
    getConfig: jest.fn(),
    redirectToReturnUrl: jest.fn()
}));
jest.mock('../../core/utils/logger', () => ({
    __esModule: true,
    log: { error: jest.fn() }
}));

jest.mock('../../services/launchService', () => ({
    __esModule: true,
    getErrorLog: jest.fn(),
    compileLtiReturnUrl: jest.fn()
}));

import { render } from '@testing-library/svelte';
import LtiError from './LtiError.svelte';
import { log } from '../../core/utils/logger';
import * as ltiService from '../../services/ltiService';
import * as launchService from '../../services/launchService';

describe('Lti Error', () => {
    it('renders correctly without return url', () => {
        launchService.getErrorLog = jest.fn().mockReturnValue('[IRRECOVERABLE] ');
        const { container } = render(LtiError);
        expect(container).toMatchSnapshot();
        expect(launchService.getErrorLog).toHaveBeenCalledWith(false);
        expect(log.error).toHaveBeenCalledWith('[IRRECOVERABLE] ');
    });
    it('redirects to return url', () => {
        ltiService.getConfig = jest.fn().mockReturnValue({
            ltiResourceLink: 'http://example.com'
        });
        launchService.compileLtiReturnUrl = jest
            .fn()
            .mockReturnValue(
                'http://example.com/?lti_errormsg=Scoring+not+available.Please+contact+your+system+administrator.&lti_errorlog=%5BIRRECOVERABLE%5D+'
            );

        const internalError = {
            title: 'Scoring not available.',
            description: 'Please contact your system administrator.'
        };
        render(LtiError);
        expect(launchService.compileLtiReturnUrl).toHaveBeenCalledWith('http://example.com', internalError, false);
        expect(ltiService.redirectToReturnUrl).toHaveBeenCalledWith(
            'http://example.com/?lti_errormsg=Scoring+not+available.Please+contact+your+system+administrator.&lti_errorlog=%5BIRRECOVERABLE%5D+'
        );
    });
});
