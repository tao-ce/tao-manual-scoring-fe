<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2025 (original work) Open Assessment Technologies SA ;
    import { createEventDispatcher } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { TabGroup, Notification } from '@oat-sa-private/ui-components';
    import { REVIEW_MESSAGES } from '@/constants/scoring-project';
    import { taskStore } from '../../store/taskStore';
    import TaskSummaryScore from '../../lib/components/TaskSummaryScore/TaskSummaryScore.svelte';

    const dispatch = createEventDispatcher();

    $: activeTab = $taskStore.adminReviewListActiveTab;
    $: adminReviewList = $taskStore.adminReviewList || [];
    $: task = $taskStore.task;

    /** @type {{ highlighted: boolean, deliverData: any }[]} */
    export let highlights = [];

    let standardScorers = [];
    let appealScorers = [];

    const handleTabChange = async e => {
        const otherTabTaskId = e.detail?.key ?? e.detail;
        taskStore.updateAdminReviewListActiveTab(otherTabTaskId);

        if (task.id !== otherTabTaskId) {
            await taskStore.persistHighlights($taskStore.task.id, highlights);
        }
        
        dispatch('updateHighlighter', {
            reset: true
        });
    };

    function updateHighlights(userKey) {
        const currentReviewer = adminReviewList.find(s => s.key === userKey);
        if (currentReviewer?.isAdmin) {
            highlights = $taskStore?.task?.highlights;
        } else {
            highlights = currentReviewer?.highlights;
        }
    }

    /**
     * Assembles review messages from suspicious delivery flags
     * @returns {string} Joined review messages separated by periods, or empty string if none exist
     */
    const getReviewMessages = () => {
        let messages = [];
        for(const message in REVIEW_MESSAGES) {
            $taskStore.suspiciousDelivery[message] && messages.push(REVIEW_MESSAGES[message]);
        }
        return messages.length && messages.join('. ') || '';
    }

    $: {
        // Ensure activeTab is always a valid tab key
        const tabKeys = (adminReviewList || []).map(scorer => scorer.key);
        if (tabKeys.length && (!activeTab || !tabKeys.includes(activeTab))) {
            const adminTab = adminReviewList.find(scorer => scorer.isAdmin);
            const nextActiveTab = adminTab?.key ?? adminReviewList[0]?.key ?? 'admin';
            activeTab = nextActiveTab;
            taskStore.updateAdminReviewListActiveTab(nextActiveTab);
        }

        standardScorers = adminReviewList?.filter(scorer => !scorer.isAppeal);
        appealScorers = adminReviewList?.filter(scorer => scorer.isAppeal);
    }

    $: updateHighlights($taskStore.adminReviewListActiveTab);
</script>

<style>
    .summary-container {
        display: flex;
        flex-direction: column;
        padding: var(--space-2x);
        background-color: var(--color-bg-info);
        margin: 2rem;
        box-sizing: content-box;

        & h3 {
            font-size: var(--fontsize-body);
            margin: 0;
            color: var(--color-bg-actionable-secondary-hover-inverted);
        }
    }

    .notification-container {
        margin: 0 2rem;
    }

    .tabs {
        & :global(.scrollbox) {
            margin-bottom: 0;
        }
    }

</style>

{#if $taskStore.suspiciousDelivery?.suspicious || $taskStore.suspiciousDelivery?.notEnoughBasisForAssessment}
    <div class="notification-container">
        <Notification
            title={__('Review needed')}
            message={getReviewMessages()}
            hierarchy="alert" />
    </div>
{/if}

{#if adminReviewList?.length > 0}

    {#if $taskStore.ltiConfig.isReview && !$taskStore.ltiConfig.isReadOnly}
        <div class="summary-container">
            {#if standardScorers.length > 0 }
                <h3>{__('Standard scores')}</h3>
                <TaskSummaryScore scores={standardScorers} />
            {/if}
            {#if appealScorers.length > 0 }
                <h3>{__('Appeal scores')}</h3>
                <TaskSummaryScore scores={appealScorers} />
            {/if}
        </div>
    {/if}

    <div class="tabs">
        <TabGroup tabs={adminReviewList} bind:activeTab on:change={handleTabChange} />
    </div>
{/if}
