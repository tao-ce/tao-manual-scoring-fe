<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021-2026 (original work) Open Assessment Technologies SA;
    import { __ } from '@oat-sa-private/ui-core';
    import FinalMessage from '@/component/FinalMessage/FinalMessage.svelte';
    import { log } from '@/core/utils/logger';
    import * as ltiService from '@/services/ltiService';
    import * as launchService from '@/services/launchService';
    import { ERROR_CODES } from '@/constants/error-codes';
    import { FINAL_MESSAGES } from '@/constants/error-messages';

    export let reason;

    const internalError = {
        title: FINAL_MESSAGES.default?.title,
        description: FINAL_MESSAGES.default?.description
    };
    const ltiConfig = ltiService.getConfig();

    const ltiRedirect =
        ltiConfig && ltiConfig.ltiResourceLink
            ? launchService.compileLtiReturnUrl(ltiConfig.ltiResourceLink, internalError, false)
            : null;

    const props =
        reason && reason === ERROR_CODES.NO_TASKS_TO_SCORE
            ? {
                  title: FINAL_MESSAGES[ERROR_CODES.NO_TASKS_TO_SCORE]?.title,
                  description: FINAL_MESSAGES[ERROR_CODES.NO_TASKS_TO_SCORE]?.description,
                  icon: 'finish-16',
                  buttonLabel: __('Proceed'),
                  redirectUrl: ltiRedirect
              }
            : internalError;

    log.error(launchService.getErrorLog(false));
</script>

<style>
    main {
        padding: 6rem;
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column; /* stack children vertically */
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    @media screen and (--mq-maxwidth-small) {
        main {
            padding: 4rem;
        }
    }
</style>

<svelte:head>{__('Error page')}</svelte:head>
<main>
    <FinalMessage {...props} />
</main>
