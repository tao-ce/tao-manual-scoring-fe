// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { render, waitFor } from '@testing-library/svelte';
import CookiePolicyWrapper from '@/component/CookiePolicyWrapper/CookiePolicyWrapper.svelte';

jest.mock('@/services/authService', () => ({
    getUser: jest.fn(() => Promise.resolve({ sub: 'test-user', tenantId: 'test-tenant' })),
}));

jest.mock('util/cookies.js', () => ({
    createCookieStorage: jest.fn(() => ({
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
    })),
}));

jest.mock('@/component/CookiePolicyWrapper/cookiePolicyConfig', () => ({
    cookiePolicyConfig: () => ({
        title: 'Cookie Policy Banner title',
        message: 'This is a mock cookie message.',
        options: [{ name: 'analytics', label: 'Analytics' }],
        privacyPolicyLink: { url: 'https://example.com/privacy', label: 'Privacy Policy' },
        cookiePolicyLink: { url: 'https://example.com/cookies', label: 'Cookie Policy' },
    }),
}));

jest.mock('@oat-sa-private/ui-core/encrypting/sha256.js', () => ({
    stringToSha256: str => Promise.resolve(str)
}));

jest.mock('@/services/analyticsService', () => ({
    initialize: jest.fn(),
}));

describe('CookiePolicyWrapper', () => {
    it('renders the component', async () => {
        const { container, getByText } = render(CookiePolicyWrapper);
        await waitFor(() => {
        expect(getByText('Cookie Policy Banner title')).toBeInTheDocument();
        });
        expect(container).toMatchSnapshot();
    });
});
