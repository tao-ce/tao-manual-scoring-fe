// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { __ } from '@oat-sa-private/ui-core';
import * as userConfigurationService from '@/services/userConfigurationService';

export function cookiePolicyConfig() {
    const defaultPrivacyUrl = 'https://www.taotesting.com/about/privacy/';
    const { cookiePolicyLink, privacyPolicyLink } = userConfigurationService.getConfig()?.cookiePolicy || '';

    return {
        title: __('Cookie Policy'),
        message: __(
            'This site uses cookies to improve your browsing experience and to perform analytics and research. To change your preferences, click Manage preferences. Otherwise, clicking Accept all cookies indicates you agree to our use of cookies on your device. Clicking Reject all cookies means you do not agree to our use of non-strictly necessary cookies on your device.'
        ),
        options: [
            {
                label: __('Essential Cookies'),
                value: 'essential',
                description: __(
                    'Strictly Necessary Cookie should be enabled at all times so that we can save your preferences for cookie settings.'
                ),
                required: true
            },
            {
                label: __('Analytics Cookies'),
                value: 'analytics',
                description: __(
                    'These cookies allow us to count visits and various other analytical data so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. If you do not allow these cookies we will not know when you have visited our site, and will not be able to monitor its performance.'
                ),
                required: false
            }
        ],
        privacyPolicyLink: {
            label: __('Privacy Policy'),
            url: privacyPolicyLink || defaultPrivacyUrl
        },
        cookiePolicyLink: {
            label: __('Cookie Policy'),
            url: cookiePolicyLink || defaultPrivacyUrl
        }
    };
}
