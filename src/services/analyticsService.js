// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { Userpilot } from 'userpilot';
import env from '@/config/env';
import { getUser } from '@/services/authService';
import { __ } from '@oat-sa-private/ui-core';
import * as userConfigurationService from './userConfigurationService';

const PROCESS_ENV = env('NODE_ENV');
const GA_TAG = env('GA_TAG');

let isUserPilotInitialized = false;

/**
 * Initialize the userpilot service
 */
async function initializeUserPilot() {
    const userConfiguration = userConfigurationService.getConfig();

    const userPilotToken = userConfiguration?.userpilot?.token || env('USERPILOT_TOKEN');
    if (userPilotToken) {
        let user;
        try {
            user = await getUser();
            Userpilot.initialize(userPilotToken);
            Userpilot.identify(`${user.tenantId}|${user.sub}`, {
                name: user.name,
                login: user.sub,
                email: user.email,
                roles: user.roles,
                interfaceLanguage: __.getLocale(),
                company: {
                    id: user.tenantId
                }
            });
            /* eslint-disable no-empty */

            isUserPilotInitialized = true;
        } catch (e) {}
    }
}

/**
 * Inserts the Google Analytics script into the document head
 */
function insertGAScript() {
    const scriptTag = document.createElement('script');
    scriptTag.async = true;
    scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TAG}`;
    document.head.appendChild(scriptTag);

    const inlineScript = document.createElement('script');
    inlineScript.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', '${GA_TAG}', {
            environment: '${PROCESS_ENV === 'production' ? 'Production' : 'Internal'}'
        });
    `;
    document.head.appendChild(inlineScript);
}

/**
 * Informs the analytics service that the URL has changed
 */
export function urlChange() {
    Userpilot.reload();
}

/**
 * Informs the analytics service that the user has logged out
 */
export function logout() {
    Userpilot.destroy();
}

/**
 * Initialize the analytics service
 */
export async function initialize() {
    if (!isUserPilotInitialized) {
        await initializeUserPilot();
    }
    insertGAScript();
}
