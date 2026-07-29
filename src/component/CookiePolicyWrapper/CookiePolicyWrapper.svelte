<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public License version 2
    // Copyright (c) 2025-2026 (original work) Open Assessment Technologies SA

    import { __ } from '@oat-sa-private/ui-core';
    import { ButtonLink } from '@oat-sa-private/ui-elements';
    import { CookiePolicy } from '@oat-sa-private/ui-components';

    import { initialize as initializeAnalyticsService } from '@/services/analyticsService';
    import { getUser } from '@/services/authService';
    import { getConfig } from '@/services/userConfigurationService';
    import { onMount } from 'svelte';

    import { cookiePolicyConfig } from '@/component/CookiePolicyWrapper/cookiePolicyConfig';
    import { createCookieStorage } from 'util/cookies.js';

    const storage = createCookieStorage({ domainLevel: 2 });
    const config = cookiePolicyConfig();
    const userConfig = getConfig();
    const display = userConfig?.cookiePolicy?.display !== false;

    let userData = null;
    let storageId = '';

    function handleInitializeCookies(event) {
        if (event.detail?.analytics) {
            initializeAnalyticsService(userData);
        }
    }

    onMount(async () => {
        userData = await getUser();
        if (userData?.tenantId && userData?.sub) {
            storageId = `${userData.tenantId}-${userData.sub}`;
        }
    });
</script>

{#if storageId && config && display}
    <CookiePolicy
        {storageId}
        {storage}
        title={config.title}
        message={config.message}
        options={config.options}
        on:initializeCookies={handleInitializeCookies}
    >
        <div slot="additional-text">
            {__('You can read more about this in our')}&nbsp;
            <ButtonLink href={config.privacyPolicyLink.url} title={config.privacyPolicyLink.label} target="_blank" />
            &nbsp;{__('and')}&nbsp;
            <ButtonLink href={config.cookiePolicyLink.url} title={config.cookiePolicyLink.label} target="_blank" />
        </div>
    </CookiePolicy>
{/if}
