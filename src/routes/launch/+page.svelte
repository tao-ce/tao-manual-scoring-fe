<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021 (original work) Open Assessment Technologies SA;
    import { __ } from '@oat-sa-private/ui-core';
    import { Loading } from '@oat-sa-private/ui-components';
    import FinalMessage from '@/component/FinalMessage/FinalMessage.svelte';
    import { onMount } from 'svelte';
    import * as launchService from '@/services/launchService';

    export let sessionToken;

    let isLoading = true;
    $: internalError = null;

    onMount(() => {
        launchService.validateSessionToken(sessionToken).then(launchError => {
            if (launchError) {
                internalError = launchError;
            }

            isLoading = false;
        });
    });
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

<svelte:head>{__('Launch page')}</svelte:head>
<main>
    {#if isLoading}
        <div class="loader-container">
            <Loading ariaRole="alert" ariaBusy="true" />
        </div>
    {:else if internalError !== null}
        <FinalMessage title={internalError.title} description={internalError.description} />
    {/if}
</main>
