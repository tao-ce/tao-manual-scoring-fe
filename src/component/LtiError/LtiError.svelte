<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021 (original work) Open Assessment Technologies SA;
    import { __ } from '@oat-sa-private/ui-core';
    import ErrorMessage from '../ErrorMessage/ErrorMessage.svelte';
    import { log } from '../../core/utils/logger';
    import * as ltiService from '../../services/ltiService';
    import * as launchService from '../../services/launchService';

    const internalError = {
        title: __('Scoring not available.'),
        description: __('Please contact your system administrator.')
    };
    const ltiConfig = ltiService.getConfig();
    if (ltiConfig && ltiConfig.ltiResourceLink) {
        ltiService.redirectToReturnUrl(
            launchService.compileLtiReturnUrl(ltiConfig.ltiResourceLink, internalError, false)
        );
    }

    log.error(launchService.getErrorLog(false));
</script>

<style>
    main {
        padding: 6rem;
        height: 100vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    @media screen and (--mq-maxwidth-small) {
        main {
            padding: 4rem;
        }
    }
</style>

<svelte:head>{__('Error page')}</svelte:head>
<main>
    <ErrorMessage title={internalError.title} description={internalError.description} />
</main>
