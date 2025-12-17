<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021-2022 (original work) Open Assessment Technologies SA ;

    import Task from '../task/Task.svelte';
    import Delivery from '../delivery/Delivery.svelte';
    import { cubicOut } from 'svelte/easing';
    import { taskStore } from '../../store/taskStore';

    import { __ } from '@oat-sa-private/ui-core';
    import { compile } from 'path-to-regexp';
    import { ModalDialog } from '@oat-sa-private/ui-components';
    import config from '@/config';
    import router from '@/core/router';

    export let deliveryId;
    export let taskId;

    let isDeliveryOverviewOpen = false;
    let taskType;

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
    }
</style>

<div class="task-page" aria-live="polite">
    <Task {taskId} {deliveryId} {isDeliveryOverviewOpen} on:openDeliveryOverview={handleOpenDeliveryOverview} />
    {#if isDeliveryOverviewOpen}
        <div class="overview-container" role="dialog" aria-label="Overview" transition:slideDown>
            <Delivery {taskId} {deliveryId} {taskType} on:closeDeliveryOverview={handleCloseDeliveryOverview} />
        </div>
    {/if}
    {#if $taskStore.redirectTask !== null}
        <ModalDialog
            type="alert"
            open
            heading={__('Your scoring progress has been updated.')}
            on:action={() => {
                handleRedirect($taskStore.redirectTask)
            }}
        >
            <p>{__('One or more students have re-submitted their responses. Unfortunately the updated responses that were already scored need to be scored again.')}</p>
        </ModalDialog>
    {/if}
</div>
