// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('@/services/ltiService', () => ({
    __esModule: true,
    getConfig: jest.fn(),
    redirectToReturnUrl: jest.fn()
}));
jest.mock('@/core/utils/logger', () => ({
    __esModule: true,
    log: { error: jest.fn() }
}));

jest.mock('@/services/launchService', () => ({
    __esModule: true,
    getErrorLog: jest.fn(),
    compileLtiReturnUrl: jest.fn()
}));

jest.mock('@oat-sa-private/ui-core', () => ({
    __esModule: true,
    __: key => key
}));

import { render, fireEvent } from '@testing-library/svelte';
import LtiErrorPage from './+page.svelte';
import { log } from '@/core/utils/logger';
import * as ltiService from '@/services/ltiService';
import * as launchService from '@/services/launchService';
import { ERROR_CODES } from '@/constants/error-codes';
import { FINAL_MESSAGES } from '@/constants/error-messages';

describe('Lti Error', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders error and logs without return url', () => {
        launchService.getErrorLog = jest.fn().mockReturnValue('[IRRECOVERABLE] ');
        ltiService.getConfig = jest.fn().mockReturnValue(null);

        const { getByText } = render(LtiErrorPage);
        expect(launchService.getErrorLog).toHaveBeenCalledWith(false);
        expect(log.error).toHaveBeenCalledWith('[IRRECOVERABLE] ');
        expect(getByText(FINAL_MESSAGES.default?.title)).toBeInTheDocument();
        expect(getByText(FINAL_MESSAGES.default?.description)).toBeInTheDocument();
    });
    it(`redirects to return url when user clicks proceed when reason is "${ERROR_CODES.NO_TASKS_TO_SCORE}"`, () => {
        ltiService.getConfig = jest.fn().mockReturnValue({
            ltiResourceLink: 'http://example.com'
        });
        launchService.compileLtiReturnUrl = jest
            .fn()
            .mockReturnValue(
                'http://example.com/?lti_errormsg=Scoring+not+available.Please+contact+your+system+administrator.&lti_errorlog=%5BIRRECOVERABLE%5D+'
            );
        launchService.getErrorLog = jest.fn().mockReturnValue('[IRRECOVERABLE] ');

        const internalError = {
            title: FINAL_MESSAGES.default?.title,
            description: FINAL_MESSAGES.default?.description
        };

        const { getByRole, getByText } = render(LtiErrorPage, {
            props: { reason: ERROR_CODES.NO_TASKS_TO_SCORE }
        });
        expect(launchService.compileLtiReturnUrl).toHaveBeenCalledWith('http://example.com', internalError, false);
        expect(getByText(FINAL_MESSAGES[ERROR_CODES.NO_TASKS_TO_SCORE]?.title)).toBeInTheDocument();
        expect(getByText(FINAL_MESSAGES[ERROR_CODES.NO_TASKS_TO_SCORE]?.description)).toBeInTheDocument();

        const button = getByRole('button', { name: 'Proceed' });
        fireEvent.click(button);
        expect(ltiService.redirectToReturnUrl).toHaveBeenCalledWith(
            'http://example.com/?lti_errormsg=Scoring+not+available.Please+contact+your+system+administrator.&lti_errorlog=%5BIRRECOVERABLE%5D+'
        );
    });
    it(`does not show a redirect button when reason is "${ERROR_CODES.NO_TASKS_TO_SCORE}" and there is no LTI return URL`, () => {
        ltiService.getConfig = jest.fn().mockReturnValue({
            ltiResourceLink: null
        });
        launchService.getErrorLog = jest.fn().mockReturnValue('[IRRECOVERABLE] ');

        const { queryByRole, getByText } = render(LtiErrorPage, {
            props: { reason: ERROR_CODES.NO_TASKS_TO_SCORE }
        });
        expect(launchService.compileLtiReturnUrl).not.toHaveBeenCalled();
        expect(getByText(FINAL_MESSAGES[ERROR_CODES.NO_TASKS_TO_SCORE]?.title)).toBeInTheDocument();
        expect(getByText(FINAL_MESSAGES[ERROR_CODES.NO_TASKS_TO_SCORE]?.description)).toBeInTheDocument();
        expect(queryByRole('button')).not.toBeInTheDocument();
    });
});
