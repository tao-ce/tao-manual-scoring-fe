<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2019-2021 (original work) Open Assessment Technologies SA ;

    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { Loading } from '@oat-sa-private/ui-components';
    import ErrorMessage from '../ErrorMessage/ErrorMessage.svelte';
    import { LONG_TIME_REQUEST } from '@/config/request';
    import { taskStore } from '../../store/taskStore';

    export let url;
    export let parameters = {};
    export let highlights;
    export let hidden;
    export let loading = true;
    export let showHighlighter = false;
    export let itemId;

    const dispatch = createEventDispatcher();

    let iframe;
    let error = null;
    let timeOut;

    $: if (iframe) {
        iframe.contentWindow.postMessage({ event: showHighlighter ? 'highlighter-show' : 'highlighter-hide' }, '*');
    }

    onMount(() => {
        window.addEventListener('message', onMessage);
        timeOut = setTimeout(onError, LONG_TIME_REQUEST);

        // initialize with saved highlights
        highlights = $taskStore?.task?.highlights;

        const urlWithParams = new URL(url);

        Object.entries(parameters)
            .map(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    return [key, JSON.stringify(value)];
                }
                return [key, value];
            })
            .map(([key, value]) => urlWithParams.searchParams.append(key, value));

        iframe.src = urlWithParams.toString();
    });

    onDestroy(() => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timeOut);
    });

    function onError() {
        loading = false;
        error = true;
        dispatch('error', { error });
    }

    function onSuccess() {
        clearTimeout(timeOut);
        loading = false;
        error = null;
        dispatch('success', { error });
    }

    function onMessage(e) {
        if (e.data.event === 'highlighter-deliverHighlights') {
            // store highlights from test-runner highlight plugin
            highlights = [{ highlighted: true, deliverData: e.data.payload }];
        }

        if (e.data.event === 'renderitem') {
            dispatch('renderitem', e.data);
            // send highlight saved to test-runner on renderitem event
            const { deliverData } = highlights[0] || {};
            deliverData && iframe.contentWindow.postMessage({
                event: 'highlighter-restoreHighlights',
                payload: deliverData,
                itemId
            }, '*');
            onSuccess();
        }

        if (e.data.event === 'error') {
            onError();
        }
    }
</script>

<style>
    .center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .itemresponse {
        width: 100%;
        height: 100%;

        &.hide {
            position: absolute;
            visibility: hidden;
            z-index: -1;
        }
    }

    .container {
        height: 100%;
        /*Need to avoid excessive scrollbars*/
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

    .hidden {
        display: none;
    }
</style>

<div class="container" class:hidden>
    {#if loading}
        <div class="loader-container">
            <Loading text={__('loading')} ariaRole="alert" />
            <p class="loader-hint">{__('Response is loading')}</p>
        </div>
    {:else if error}
        <div class="center">
            <ErrorMessage title="" description="" />
        </div>
    {/if}
    <iframe
        id="itemresponse"
        class="itemresponse"
        title={__('Item response')}
        name="itemresponse"
        bind:this={iframe}
        class:hide={loading || error} />
</div>
