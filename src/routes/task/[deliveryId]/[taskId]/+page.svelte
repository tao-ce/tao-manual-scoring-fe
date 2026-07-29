<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021-2022 (original work) Open Assessment Technologies SA ;

    import Task from '@/component/task/Task.svelte';
    import Delivery from '@/component/delivery/Delivery.svelte';
    import { cubicOut } from 'svelte/easing';
    import { taskStore } from '@/store/taskStore';
    import { onMount, onDestroy } from 'svelte';

    import { __ } from '@oat-sa-private/ui-core';
    import { compile } from 'path-to-regexp';
    import { ModalDialog, Loading } from '@oat-sa-private/ui-components';
    import { ScoringModes } from '@/constants/scoring-mode';
    import config from '@/config';
    import router from '@/core/router';

    export let deliveryId;
    export let taskId;

    let isDeliveryOverviewOpen = false;
    let taskType;
    let scoringMode = ScoringModes.ITEM;
    let taskComponent;

    const handleOpenDeliveryOverview = e => {
        isDeliveryOverviewOpen = true;
        taskType = e.detail.taskType;
    };

    const handleCloseDeliveryOverview = () => {
        isDeliveryOverviewOpen = false;
    };

    const slideDown = () => ({
        delay: 0,
        duration: 400,
        easing: cubicOut,
        css: (t, u) => `transform: translateY(${u * 100}%)`
    });

    function handleRedirect(redirectTask = {}) {
        router.redirect(
            compile(config.routes.task)({
                taskId: redirectTask.id,
                deliveryId: redirectTask.deliveryId
            })
        );
    }

    onMount(async () => {
        scoringMode = window.sessionStorage.getItem('scoringMode');
        await taskStore.loadTask(taskId, __.getLocale());
    });

    onDestroy(() => {
        taskComponent?.$destroy();
        taskStore.reset();
    });
</script>

<style>
    .task-page {
        height: 100vh;
        position: relative;
        overflow: hidden;
    }
    .overview-container {
        position: fixed;
        top: var(--space-8x);
        bottom: 0;
        width: 100%;
        height: calc(100% - var(--space-8x));
        background: var(--color-bg-default);
        overflow: auto;
        z-index: var(--layer-1);
    }
</style>

<div class="task-page" aria-live="polite">
    {#if $taskStore.isLoading}
        <div class="loader-container">
            <Loading ariaRole="alert" ariaBusy="true" />
        </div>
    {:else}
        {#if $taskStore.task}
            <Task
                bind:this={taskComponent}
                {taskId}
                {isDeliveryOverviewOpen}
                {scoringMode}
                on:openDeliveryOverview={handleOpenDeliveryOverview}
            />
            {#if isDeliveryOverviewOpen}
                <div class="overview-container" role="dialog" aria-label="Overview" transition:slideDown>
                    <Delivery {taskId} {deliveryId} {taskType} on:closeDeliveryOverview={handleCloseDeliveryOverview} />
                </div>
            {/if}
        {/if}
        {#if $taskStore.redirectTask !== null}
            <ModalDialog
                type="alert"
                open
                heading={__('Your scoring progress has been updated.')}
                on:action={() => {
                    handleRedirect($taskStore.redirectTask);
                }}
            >
                <p>
                    {__(
                        'One or more students have re-submitted their responses. Unfortunately the updated responses that were already scored need to be scored again.'
                    )}
                </p>
            </ModalDialog>
        {/if}
    {/if}
</div>