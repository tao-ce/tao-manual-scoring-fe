// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { JWT_TOKEN_HANDLER_SERVICE_NAME } from '@/constants/jwtToken.js';

jest.mock('module');
jest.mock('@/core/router');
jest.mock('@/config', () => ({
    baseUrls: {
        api: 'https://example.com',
        authServer: 'https://auth.example.com'
    },
    endpoints: {
        refreshToken: '/refresh-token',
        foo: '/someFooApi',
        bar: '/bar/:userId/:otherId',
        baz: '/baz/:bazId'
    },
    routes: {
        login: '/login'
    }
}));
jest.mock('@/config/env', () => variableName => {
    const environmentConfig = {
        API_URL: 'http://example.com'
    };

    return environmentConfig[variableName];
});
jest.mock('@oat-sa-private/ui-core', () => ({
    __: (message, params) => `${message},${params?.join(',')}`
}));

import config from '@/config';
import jwtTokenRegistry from 'core/jwt/jwtTokenRegistry';
import jwtTokenHandlerFactory from 'core/jwt/jwtTokenHandler';
import request, { getEndpointUrl } from './apiRequest';
import router from '@/core/router';

describe('API Request', () => {
    beforeAll(() => {
        jwtTokenRegistry.register(jwtTokenHandlerFactory({
            serviceName: JWT_TOKEN_HANDLER_SERVICE_NAME,
            refreshTokenUrl: getEndpointUrl('refreshToken', {}, {}, config.baseUrls.authServer),
            oauth2RequestFormat: true,
            refreshTokenParameters: {
                grant_type: 'refresh_token',
                client_id: 'clientId'
            }
        }));
    });
    afterEach(() => {
        fetch.resetMocks();
        router.replace.mockClear();
        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME).clearStore();
    });

    test('getEndpointUrl return url from config', () => {
        expect(getEndpointUrl('foo')).toBe('https://example.com/someFooApi');
    });

    test('getEndpointUrl replaces variables', () => {
        expect(
            getEndpointUrl('bar', {
                userId: 12,
                otherId: 'someId'
            })
        ).toBe('https://example.com/bar/12/someId');
    });

    test('getEndpointUrl concat query parameters', () => {
        expect(
            getEndpointUrl(
                'baz',
                {
                    bazId: 'someBazId'
                },
                { foo: 1, bar: 'some' }
            )
        ).toBe('https://example.com/baz/someBazId?foo=1&bar=some');
    });

    test('request returns with a correct response', () => {
        const mockResponse = { ok: true };
        fetch.mockResponse(JSON.stringify(mockResponse));

        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeAccessToken('authToken')
            .then(() => expect(request('/foo')).resolves.toEqual(mockResponse));
    });

    test('request returns with a correct error response', () => {
        fetch.mockResponse(null, JSON.stringify({ status: 404 }));

        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeAccessToken('authToken')
            .then(() => request('/foo'))
            .catch(error => {
                expect(error.response.status).toBe(404);
            });
    });

    test('error is being translated for translatable error', () => {
        const translationKey = 'test';
        const translationParams = ['foo', 'bar'];
        fetch.mockResponse(
            null,
            JSON.stringify({
                status: 500,
                translation: {
                    key: translationKey,
                    params: translationParams
                }
            })
        );
        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeAccessToken('authToken')
            .then(() => request('/foo'))
            .catch(error => {
                expect(error.response.message).toBe('test,foo,bar');
            });
    });

    test('error is being translated for translatable error in error key', () => {
        const translationKey = 'testError';
        const translationParams = ['foo', 'bar'];
        fetch.mockResponse(
            null,
            JSON.stringify({
                status: 500,
                error: {
                    message: 'somethingfrombackend',
                    translation: {
                        key: translationKey,
                        params: translationParams
                    }
                }
            })
        );
        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeAccessToken('authToken')
            .then(() => request('/foo'))
            .catch(error => {
                expect(error.response.error.message).toBe('testError,foo,bar');
            });
    });

    test('request sends an auth header', () => {
        const mockResponse = { foo: 'bar' };
        const authToken = 'someToken';
        const url = '/bar';

        fetch.mockResponse(req => {
            expect(req.url).toBe(url);
            expect(req.headers.get('Authorization')).toBe(`Bearer ${authToken}`);
            return Promise.resolve(JSON.stringify(mockResponse));
        });

        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeAccessToken(authToken)
            .then(() => expect(request(url, { jwtTokenHandler: jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME) })).resolves.toEqual(mockResponse));
    });

    test('request refreshes the token when it does not exist', function() {
        const mockResponse = { response: 2 };
        const refreshToken = 'refreshToken';
        const newAuthToken = 'newAuthToken';
        const url = '/refresh-token';

        fetch.mockResponses(
            req => {
                expect(req.url).toBe('https://auth.example.com/refresh-token');
                expect(req.method).toBe('POST');
                return Promise.resolve(JSON.stringify({ access_token: newAuthToken }));
            },
            req => {
                expect(req.headers.get('Authorization')).toBe(`Bearer ${newAuthToken}`);
                return Promise.resolve(JSON.stringify(mockResponse));
            }
        );

        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeRefreshToken(refreshToken)
            .then(() => expect(request(url)).resolves.toEqual(mockResponse));
    });

    test('request refreshes the token when it is not valid', () => {
        const mockResponse = { response: 2 };
        const refreshToken = 'refreshToken';
        const accessToken = 'invalidAccessToken';
        const newAuthToken = 'newAuthToken';
        const url = 'https://auth.example.com/refresh-token';

        fetch.mockResponses(
            req => {
                expect(req.url).toBe(url);
                expect(req.headers.get('Authorization')).toBe(`Bearer ${accessToken}`);
                return Promise.resolve({ status: 401 });
            },
            req => {
                expect(req.method).toBe('POST');
                return Promise.resolve(JSON.stringify({ access_token: newAuthToken }));
            },
            req => {
                expect(req.url).toBe(url);
                expect(req.headers.get('Authorization')).toBe(`Bearer ${newAuthToken}`);
                return Promise.resolve(JSON.stringify(mockResponse));
            }
        );

        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeRefreshToken(refreshToken)
            .then(() => jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME).storeAccessToken(accessToken))
            .then(() => expect(request(url)).resolves.toEqual(mockResponse));
    });

    test('redirect to login route if there are no tokens', () =>
        request('/foo').then(() => {
            expect(router.replace.mock.calls[0][0]).toEqual({ backPath: '/', url: '/login' });
        }));

    test('redirect to login if token is not valid and cannot be refreshed', () => {
        const accessToken = 'invalidAccessToken';

        fetch.mockResponse(null, { status: 401 });

        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeAccessToken(accessToken)
            .then(() => request('/foo'))
            .then(() => {
                expect(router.replace.mock.calls[0][0]).toEqual({ backPath: '/', url: '/login' });
            });
    });

    test('redirect to login if token is refreshed and is still not valid', () => {
        const refreshToken = 'refreshToken';
        const accessToken = 'invalidAccessToken';
        const newAuthToken = 'stillInvalidAccessToken';
        const url = '/refresh-token';

        fetch.mockResponses(
            [null, { status: 401 }],
            [JSON.stringify({ accessToken: newAuthToken })],
            [null, { status: 401 }]
        );

        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeRefreshToken(refreshToken)
            .then(() => jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME).storeAccessToken(accessToken))
            .then(() => request(url))
            .then(() => {
                expect(router.replace.mock.calls[0][0]).toEqual({ backPath: '/', url: '/login' });
            });
    });

    test('request rejects if timeout reached', () => {
        fetch.mockResponse(() => new Promise(resolve => setTimeout(resolve, 2000)));

        return jwtTokenRegistry.get(JWT_TOKEN_HANDLER_SERVICE_NAME)
            .storeAccessToken('accessToken')
            .then(() => expect(request('/', { timeout: 1000 })).rejects.toMatchObject({ message: 'Timeout' }));
    });
});
