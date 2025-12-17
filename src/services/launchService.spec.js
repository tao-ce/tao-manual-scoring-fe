// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/core/apiRequest/apiRequest', () => ({
    __esModule: true,
    default: jest.fn(),
    getEndpointUrl: jest.fn()
}));
jest.mock('@/core/router');
jest.mock('./ltiService', () => ({
    __esModule: true,
    redirectToReturnUrl: jest.fn(),
    setConfig: jest.fn()
}));

import { __ } from '@oat-sa-private/ui-core';
import { log, locale, DEFAULT_LOCALE_ID } from '@/core/utils';
import router from '@/core/router';
import config from '../config';
import * as authService from './authService';
import * as ltiService from './ltiService';
import * as launchService from './launchService';

jest.mock('./authService', () => ({
    exchangeToken: jest.fn(),
    redirectToReturnUrl: jest.fn()
}));

const LT_LANG_CODE = 'lt-LT';

describe('Launch service', () => {
    beforeAll(() => {
        __.setDictionaryLoader(localeCode =>
            import(`./locale/${localeCode}/messages.json`).then(dictionaryModule => dictionaryModule.default)
        );
    });
    beforeEach(() => {
        log.error = jest.fn();
        log.warn = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Redirect to the error page when token is not valid', async () => {
        const invalidToken = null;

        await launchService.validateSessionToken(invalidToken);

        expect(router.redirect).toBeCalledWith(config.routes.ltiError);
    });

    it('Returns valid response and redirects users to the task page', async () => {
        const validToken = 'validSessionToken';
        const localeSpy = jest.spyOn(locale, 'setCode');

        authService.exchangeToken.mockResolvedValue({
            _meta: {
                internalDeliveryId: 'testDeliveryId',
                taskId: 'testTaskId',
                ltiResourceLink: 'testLtiResourceLink',
                ltiResourceLabel: 'testLtiResourceLink',
                language: DEFAULT_LOCALE_ID
            }
        });

        await launchService.validateSessionToken(validToken);

        expect(localeSpy).toBeCalledWith(DEFAULT_LOCALE_ID);
        expect(router.replace).toBeCalledWith('/task/testDeliveryId/testTaskId');
    });

    it('Sets default en-US locale if no locale provided', async () => {
        const validToken = 'validSessionToken';
        const localeSpy = jest.spyOn(locale, 'setCode');

        authService.exchangeToken.mockResolvedValue({
            _meta: {
                internalDeliveryId: 'testDeliveryId',
                taskId: 'testTaskId',
                ltiResourceLink: 'testLtiResourceLink',
                ltiResourceLabel: 'testLtiResourceLink',
                language: LT_LANG_CODE
            }
        });

        await launchService.validateSessionToken(validToken);
        expect(localeSpy).toBeCalledWith(LT_LANG_CODE);
        authService.exchangeToken.mockResolvedValue({
            _meta: {
                internalDeliveryId: 'testDeliveryId',
                taskId: 'testTaskId',
                ltiResourceLink: 'testLtiResourceLink',
                ltiResourceLabel: 'testLtiResourceLink'
            }
        });

        await launchService.validateSessionToken(validToken);
        expect(localeSpy).toBeCalledWith(DEFAULT_LOCALE_ID);
    });

    it('Returns valid response without task identifiers', async () => {
        const validToken = 'validSessionToken';

        authService.exchangeToken.mockResolvedValue({
            _meta: {
                language: DEFAULT_LOCALE_ID
            }
        });

        await launchService.validateSessionToken(validToken);

        expect(router.replace).toBeCalledWith(config.routes.ltiError);
    });

    it('throw an error when the user exchanges an invalid token', async () => {
        const invalidToken = 'QWERTY12345';

        authService.exchangeToken.mockRejectedValue('is not valid');

        await launchService.validateSessionToken(invalidToken);

        expect(log.error).toBeCalledWith('Token exchange is not valid');
        expect(router.redirect).toBeCalledWith(config.routes.ltiError);
    });

    it.each([
        [
            'invalid_response_selection',
            {
                title: 'Scoring not available.',
                description: 'Sorry, we cannot find the responses to score. Please contact your system administrator.'
            }
        ],
        [
            'invalid_response_assignment',
            {
                title: 'Scoring not available.',
                description: 'There are no responses to score yet. Please wait and try again.'
            }
        ],
        [
            'invalid_role',
            {
                title: 'Grading not available.',
                description: 'Please contact your administrator.'
            }
        ],
        [
            'invalid_identity',
            {
                title: 'Scoring not available.',
                description: 'Please contact your system administrator.'
            }
        ],
        [
            'reviewer_is_scorer',
            {
                title: 'Review failed: The reviewer cannot be the same user as the original scorer.',
                description: 'Please assign a different reviewer to ensure an independent review of the score.'
            }
        ],
        [
            'invalid_scoring_category',
            {
                title: 'Invalid Scoring Category',
                description: 'Please check the scoringCategory value. It must be valid and cannot be empty.'
            }
        ]
    ])('generates error from user session exchanges token', async (errorType, expected) => {
        authService.exchangeToken.mockRejectedValue({
            errorCode: 400,
            response: {
                json: () =>
                    Promise.resolve({
                        data: {
                            language: LT_LANG_CODE
                        },
                        error: {
                            code: errorType,
                            log: 'Lorem ipsum dolor sit amet',
                            recoverable: true
                        }
                    })
            }
        });

        const launchRecoverableError = await launchService.validateSessionToken('QWERTY12345');

        expect(launchRecoverableError).toEqual(expected);
    });

    it('generates error from user session exchanges token when have invalid Ids and specific lang', async () => {
        authService.exchangeToken.mockRejectedValue({
            responseStatus: 400,
            data: {
                language: LT_LANG_CODE
            },
            error: {
                code: 'empty_delivery_ids_and_test_takers',
                log: 'Lorem ipsum dolor sit amet',
                recoverable: true
            }
        });

        const localeSpy = jest.spyOn(locale, 'setCode');
        const launchRecoverableError = await launchService.validateSessionToken('QWERTY12345');
        const expectedObject = {
            title: 'Delivery ID(s) and Test Taker ID(s) are empty or not defined.',
            description: 'Please contact your system administrator.'
        };
        expect(launchRecoverableError).toEqual(expectedObject);
        expect(localeSpy).toBeCalledWith(LT_LANG_CODE);
    });

    it('generates error from user session exchanges token when have invalid Ids and default lang', async () => {
        authService.exchangeToken.mockRejectedValue({
            responseStatus: 400,
            error: {
                code: 'empty_delivery_ids_and_test_takers',
                log: 'Lorem ipsum dolor sit amet',
                recoverable: true
            }
        });

        const localeSpy = jest.spyOn(locale, 'setCode');
        const launchRecoverableError = await launchService.validateSessionToken('QWERTY12345');
        const expectedObject = {
            title: 'Delivery ID(s) and Test Taker ID(s) are empty or not defined.',
            description: 'Please contact your system administrator.'
        };
        expect(launchRecoverableError).toEqual(expectedObject);
        expect(localeSpy).toBeCalledWith(DEFAULT_LOCALE_ID);
    });

    it('Redirect on home page for unknown error', async () => {
        authService.exchangeToken.mockRejectedValue({
            errorCode: 400,
            response: {
                json: () =>
                    Promise.resolve({
                        error: {
                            code: 'unknown-error-type'
                        }
                    })
            }
        });

        await launchService.validateSessionToken('QWERTY12345');

        expect(router.redirect).toBeCalledWith(config.routes.ltiError);
    });

    it('Not redirect to lti error page if return_url provided', async () => {
        const localeSpy = jest.spyOn(locale, 'setCode');

        authService.exchangeToken.mockRejectedValue({
            errorCode: 400,
            response: {
                json: () =>
                    Promise.resolve({
                        data: {
                            ltiResourceLink: 'http://example.com',
                            language: DEFAULT_LOCALE_ID
                        },
                        error: {
                            code: 'invalid_response_selection',
                            log: 'Lorem ipsum dolor sit amet',
                            recoverable: true
                        }
                    })
            }
        });

        await launchService.validateSessionToken('QWERTY12345');
        expect(ltiService.redirectToReturnUrl).not.toBeCalledWith(
            'http://example.com/?lti_errormsg=Scoring+not+available.Sorry%2C+we+cannot+find+the+responses+to+score.+Please+contact+your+system+administrator.&lti_errorlog=%5BRECOVERABLE%5D+Lorem+ipsum+dolor+sit+amet'
        );

        expect(localeSpy).toBeCalledWith(DEFAULT_LOCALE_ID);
    });
});
