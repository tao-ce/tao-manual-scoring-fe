<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021 (original work) Open Assessment Technologies SA ;

    import { onMount, createEventDispatcher } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { Loading } from '@oat-sa-private/ui-components';
    import { IconBarButton } from '@oat-sa-private/ui-elements';

    export let url;
    export let title = __('Scoring criteria');

    let loading = true;
    let iframe;
    const PDF_VIEW_HASH_OPTIONS = '#view=fitH';

    const dispatch = createEventDispatcher();

    $: {
        if (url && iframe) {
            loading = true;
            const urlWithViewParams = new URL(url);
            urlWithViewParams.hash = urlWithViewParams.hash || PDF_VIEW_HASH_OPTIONS;
            iframe.src = urlWithViewParams.toString();
        }
    }

    onMount(() => {
        iframe.onload = () => {
            loading = false;
        };
    });

    function onCloseCriteria() {
        dispatch('toggleCriteriaView', { show: false });
    }
</script>

<style>
    .criteria {
        margin: 0 var(--space-2x);
        width: calc(100% - 2 * var(--space-2x));
        height: 100%;

        &.hide {
            width: 1px;
            height: 1px;
        }
    }

    .container {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .loader-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;

        & .loader-hint {
            color: var(--color-mediumGrey);
            text-align: center;
            margin-top: 2rem;
        }
    }
    .criteria-top-panel {
        align-self: stretch;
    }
</style>

<div class="container">
    {#if loading}
        <div class="loader-container">
            <Loading text={__('loading')} ariaRole="alert" />
            <p class="loader-hint">{__('Scoring criteria is loading')}</p>
        </div>
    {/if}

    <div class="criteria-top-panel">
        <IconBarButton
            label={__('Close scoring criteria')}
            size="base-24"
            icon="remove-16"
            on:click={onCloseCriteria} />
    </div>

    <iframe
        class="criteria"
        {title}
        bind:this={iframe}
        allow="fullscreen"
        allowfullscreen
        class:hide={loading} />
</div>
