<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020-2025 (original work) Open Assessment Technologies SA ;

    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { Button, Progressbar, IconBarButton } from '@oat-sa-private/ui-elements';
    import { breakpoints } from '@oat-sa-private/ui-identity';
    import config from '@/config';
    import router from '@/core/router';
    import { log } from '@/core/utils';
    import { TASK_DATA_TYPE, saveLocalTaskData, removeLocalTaskData } from '@/core/utils/task';
    import { Ribbon, ModalDialog } from '@oat-sa-private/ui-components';
    import { getUser } from '@/services/authService';
    import InactiveProjectDialog from '../inactiveProject/InactiveProjectDialog';
    import ItemPreviewer from './ItemPreviewer';
    import ScoringForm from './ScoringForm.svelte';
    import CompliantNote from './CompliantNote';
    import ComplaintDialog from './ComplaintDialog';
    import { TASK_STATUS, TASK_TYPE } from '../../constants/task';
    import TaskHeader from './TaskHeader.svelte';
    import * as taskService from '../../services/taskService';
    import * as ltiService from '../../services/ltiService';
    import ScoringCriteria from './ScoringCriteria.svelte';
    import { taskStore } from '../../store/taskStore';
    import { debounce } from 'lodash';
    import { getLiveSaveStore, liveSaveStatuses } from '@oat-sa-private/ui-components/livesave/liveSaveStore.js';

    export let taskId;
    export let deliveryId;
    export let isDeliveryOverviewOpen;

    $: task = $taskStore.task;
    $: meta = $taskStore.meta;

    const autoSaveStatus = getLiveSaveStore('autosave');

    let isTaskFieldsChanged = false;
    let isSuspiciousFieldsChanged = false;
    let taskType;
    let position;
    let prevTask = null;
    let nextTask = null;
    let deliveryExecutionScoring = null;
    let numberOfTasks;
    // previous scores data
    let previousScores = []; // scores data of previous users (e.g. in review mode)
    // custom props
    let notePlaceholder; // placeholder for note textarea
    let showSelectionStatus = false; // specifies if selection status should be shown (check / double check)
    let complaint = {
        enabled: false,
        error: ''
    };
    let isComplaintDialogOpened = false;
    let taskHeaderBreadcrumbItems;
    let hideNoteBox = false;
    let ltiBackLink;
    let showBackButton = true;
    let isOverviewBtnDisabled = false;
    let isScoringPanelOpen = false;
    let testTakerName = '';
    let isReview = false;
    let deliveryExecutionIds = [];

    let criteriaPdfUrl;
    let showCriteriaPdf = false;
    let previewLoading = true;

    let highlights;
    let outcomeDeclarations;
    let taskIdToComplain;
    let scorerToComplain;
    let showHighlighter = false;
    let errorLoading = false;
    let submitErrorActionLabel;
    let submitErrorHeadLabel = __('Scoring task submission error');
    let onSubmitErrorUserAction;
    let submitErrorMessage;
    let windowWidth;

    let isPreviousBtnDisabled = false;
    let isNextBtnDisabled = false;

    $: isScoringUIDisabled = previewLoading || errorLoading;

    $: hasNullScore = outcomeDeclarations && !!outcomeDeclarations.find(s => s.value === null);

    $: totalScoredExceptCurrent = task && meta && meta.totalScored - (task.status === TASK_STATUS.SCORED ? 1 : 0);

    $: totalScored = totalScoredExceptCurrent + (hasNullScore ? 0 : 1);

    $: completion = Math.floor((totalScored / numberOfTasks) * 100);

    $: isSubmitEnabled = completion === 100;

    $: smallWidth = windowWidth <= breakpoints.width.medium + 1;

    $: smallPdfView = smallWidth && showCriteriaPdf;

    const dispatch = createEventDispatcher();

    $: {
        if (task) {
            outcomeDeclarations = task.outcomeDeclarations;
        }

        if (meta) {
            previousScores = meta.previousScores;
            numberOfTasks = meta.numberOfTasks;
            position = meta.position;
            prevTask = meta.prevTask;
            nextTask = meta.nextTask;
            taskType = meta.taskType;
            deliveryExecutionScoring = meta.deliveryExecutionScoring;
        }

        // Update component own properties
        if (taskType === TASK_TYPE.SCORING) {
            notePlaceholder = __('Type a note for this answer');
            showSelectionStatus = false;
            complaint = {
                enabled: false
            };
        } else {
            notePlaceholder = __('Type a note for this review');
            showSelectionStatus = true;
            complaint = {
                enabled: true,
                error: ''
            };
        }

        const ltiConfig = $taskStore.ltiConfig;

        ltiBackLink = ltiConfig.ltiResourceLink;
        showBackButton = !!ltiBackLink;
        testTakerName = ltiConfig.testTakerName || '';
        hideNoteBox = ltiConfig.hideNoteBox || false;
        isReview = ltiConfig.isReview || false;
        deliveryExecutionIds = ltiConfig.deliveryExecutionIds?.length ? ltiConfig.deliveryExecutionIds : [];
        /**
         * Create breadcrumb for taskHeader for users coming via lti launch
         */
        if (ltiConfig.breadcrumbs?.length) {
            taskHeaderBreadcrumbItems = ltiConfig.breadcrumbs.map(({ label, href }) => ({ label, href }));
        } else if (ltiConfig.ltiResourceLink && ltiConfig.ltiResourceLabel) {
            taskHeaderBreadcrumbItems = [
                {
                    label: ltiConfig.ltiResourceLabel,
                    href: ltiConfig.ltiResourceLink
                }
            ];
        }

        if (isTaskFieldsChanged) {
            saveLocalTaskData(taskId, TASK_DATA_TYPE.CURRENT, task);
        }
    }

    onMount(() => {
        taskStore.loadTask(taskId, __.getLocale());
    });

    onDestroy(() => {
        taskStore.reset();
    });

    const handleRequestError = error => {
        if (error.error?.message?.endsWith(taskId)) {
            submitErrorHeadLabel = __('Scoring task could not be started');
            error.error.message = __('This scoring task could not be initiated most likely because another scoring session was initiated in a different window or browser.<br>To resolve this issue:<br><ul><li>Make sure you are not scoring different session in another window or browser.</li><li>Close any other tabs or browser windows where this or another scoring link might be open.</li></ul>If you have already checked these steps and still see this message, please contact support or your administrator for further assistance.');
            error.allowResubmit = false;
        }

        if (error.responseStatus === 409) {
            taskStore.setInactiveProject();
            return;
        }
        submitErrorMessage =
            error.error?.message ??
            __(
                'We encountered an issue while saving your score. Please try again. If the problem persists, contact our support team for assistance.'
            );

        if (error.allowResubmit) {
            submitErrorActionLabel = __('Try again');
            onSubmitErrorUserAction = () => {
                submitErrorMessage = '';
            };
        } else {
            submitErrorActionLabel = __('Back');
            onSubmitErrorUserAction = navigateBack;
        }
    };

    const updateSuspicious = async () => {
        await taskStore.updateSuspicious(deliveryExecutionScoring);
        isSuspiciousFieldsChanged = false;
    }

    const updateTask = async (id, data) => {
        try {
            autoSaveStatus.reset(liveSaveStatuses.waiting);
            const response = await taskStore.submitTasks(id, {
                bookmarked: data.bookmarked,
                highlights,
                note: data.note,
                outcomeDeclarations: data.outcomeDeclarations
            });
            if (isSuspiciousFieldsChanged) {
                await updateSuspicious();
            }
            if (response.redirectTask) {
                taskStore.updateRedirectTask(response.redirectTask);
            }
            autoSaveStatus.reset(liveSaveStatuses.saved);
            return response;
        } catch (error) {
            handleRequestError(error);
            isTaskFieldsChanged = false;

            throw error;
        }
    };

    const debouncedUpdate = debounce(updateTask, 2000, {
        leading: true,
        trailing: true
    });

    async function onNextClick() {
        isNextBtnDisabled = true;
        try {
            await redirectToTask(nextTask);
        } finally {
            isNextBtnDisabled = false;
        }
    }

    async function onPreviousClick() {
        isPreviousBtnDisabled = true;
        try {
            await redirectToTask(prevTask);
        } finally {
            isPreviousBtnDisabled = false;
        }
    }

    async function redirectToTask(nextTaskId) {
        const taskUpdated = {
            ...task,
            highlights
        };
        if (isSuspiciousFieldsChanged) {
            await updateSuspicious();
        }
        await taskStore.loadNextTask(taskId, taskUpdated, nextTaskId).catch(error => {
            handleRequestError(error);
            isTaskFieldsChanged = false;

            throw error;
        });
    }

    async function onOverviewClick() {
        if (isOverviewBtnDisabled) {
            return;
        }
        isOverviewBtnDisabled = true;
        const data = taskService.formatTaskData(task);

        showCriteriaPdf = false;

        try {
            await debouncedUpdate(taskId, data);
            dispatch('openDeliveryOverview', { taskType });
        } catch (error) {
            log.error(error);
        } finally {
            isOverviewBtnDisabled = false;
        }
    }

    /**
     * Handles exit from scoring task
     * @param {string} target - target url
     */
    async function onExit(target) {
        const data = taskService.formatTaskData(task);

        try {
            await debouncedUpdate(taskId, data);

            removeLocalTaskData(taskId);

            if (target) {
                window.location.replace(target);
            } else {
                navigateBack();
            }
        } catch (error) {
            log.error(error);
        }
    }

    /**
     * Navigates back to scoring projects or to LTI return url
     */
    function navigateBack() {
        if (ltiBackLink) {
            ltiService.redirectToReturnUrl(ltiBackLink);
        } else {
            router.redirect(config.routes.ltiSubmitted);
        }
    }

    async function onScoreChange({ detail }) {
        const { index, score } = detail;

        isTaskFieldsChanged = true;
        taskStore.updateScore({ index, score });
        const data = taskService.formatTaskData(task);

        await debouncedUpdate(taskId, data);
    }

    function onNoteChange() {
        isTaskFieldsChanged = true;
    }

    async function onSubmitScores() {
        try {
            if (!isSubmitEnabled) {
                return;
            }

            isSubmitEnabled = false;

            const data = taskService.formatTaskData(task);

            await debouncedUpdate(taskId, data);
            if (isReview) {
                const user = await getUser();
                const deliveries = deliveryExecutionIds?.length ? deliveryExecutionIds.join(', ') : '';
                log.log(`Reviewer/scorer: ${user.sub} submitted scores for a session: ${deliveries} for a test taker: ${testTakerName}`);
            }

            if ($taskStore.redirectTask !== null) {
                return;
            }
            removeLocalTaskData(taskId);

            const response = await taskService.submitLTITasks(taskType, taskId);
            if (response.redirectTask) {
                taskStore.updateRedirectTask(response.redirectTask);
                return;
            }
            if (ltiBackLink) {
                ltiService.redirectToReturnUrl(ltiBackLink);
            } else {
                router.redirect(config.routes.ltiSubmitted);
            }
        } catch (err) {
            handleRequestError(err);

            throw err;
        } finally {
            isSubmitEnabled = true;
        }
    }

    function onBookmark() {
        isTaskFieldsChanged = true;
        taskStore.toggleBookmark();
    }

    function onComplaintDialogOpened(previousTaskId, user) {
        if (!isScoringUIDisabled) {
            taskIdToComplain = previousTaskId;
            scorerToComplain = user;
            isComplaintDialogOpened = true;
        }
    }

    function onComplaintDialogClosed() {
        isComplaintDialogOpened = false;
        complaint.error = '';
    }

    function onComplaintDialogAction(event) {
        const { complaintTaskId, complaintNote } = event.detail;

        taskService
            .complainItemScorerPair(complaintTaskId, complaintNote)
            .then(() => {
                const clonePrevScores = [...previousScores];

                clonePrevScores.find(s => s.id === complaintTaskId).scoringViolation = {
                    description: complaintNote
                };

                previousScores = clonePrevScores;
                complaint = {
                    enabled: false,
                    error: ''
                };
                isComplaintDialogOpened = false;
            })
            .catch(error => {
                complaint = {
                    enabled: true,
                    error: error.error.message
                };
            });
    }

    function onClickHighlighter(event) {
        showHighlighter = event.detail.show;
        isScoringPanelOpen = false;

        self.postMessage({ event: showHighlighter ? 'highlighter-show' : 'highlighter-hide' }, '*');
    }

    function validateRender(event) {
        if (task.item.qtiIdentifier !== event.detail.parameters.itemIdentifier) {
            handleRequestError({});
        }
    }

    const handleConfirmInactive = () => {
        if (ltiBackLink) {
            ltiService.redirectToReturnUrl(ltiBackLink);
        } else {
            router.redirect(config.routes.scoringProjects);
        }
    };

    const handleError = () => {
        errorLoading = true;
    };

    const handleItemPreviewLoaded = () => {
        errorLoading = false;
    };

    const handleSeeCriteriaClick = event => {
        showCriteriaPdf = event.detail.show;
        if (event.detail.show) {
            criteriaPdfUrl = event.detail.url;
        }
        isScoringPanelOpen = false;
    };

    const toggleScoringPanel = () => {
        isScoringPanelOpen = !isScoringPanelOpen;
    };

    const onSuspiciousFieldsChange = (e) => {
        if (deliveryExecutionScoring) {
            const { suspicious, suspiciousNote, note } = e.detail
            isSuspiciousFieldsChanged = true;
            deliveryExecutionScoring.suspicious = suspicious;
            deliveryExecutionScoring.suspiciousNote = suspiciousNote;
            deliveryExecutionScoring.note = note;
        }
    }
</script>

<style>
    .header {
        height: var(--space-8x);
        width: 100%;
    }

    .wrapper {
        --header-height: var(--space-8x);
        flex-direction: column;
        height: calc(100vh - var(--header-height));
        display: flex;

        &.smallPdfView {
            &,
            & main,
            & .content {
                height: 100vh;
            }

            & aside {
                display: none;
            }

            & main :global(iframe) {
                height: calc(100% - 6rem); /* close button size */
            }
        }
    }

    .wrapper :global(.ribbon) {
        position: static;
    }

    .content {
        --ribbon-height: 8.5rem;
        position: relative;
        width: 100%;
        display: flex;
        flex: 1;
        height: calc(100vh - var(--header-height) - var(--ribbon-height));

        &.inaccessible {
            visibility: hidden;
        }
    }

    aside {
        display: flex;
        flex-direction: column;
        background-color: var(--color-bg-info);
        width: 39.25rem;
        transition: height 0.25s ease-in;

        & .form-container {
            flex-grow: 1;
            overflow: auto;
            position: relative;
            min-height: 8rem;
        }
    }

    .sidebarhead {
        margin: 0 var(--space-3x);
        padding-top: var(--space-1x);

        & p {
            font-size: var(--fontsize-body-xs);
            margin: 0;
        }

        & .report {
            color: var(--color-text-default);

            & a {
                color: var(--color-text-default);
            }

            &.disabled,
            & a.disabled,
            & a.disabled:hover {
                border-color: var(--color-lightui-disabled);
                color: var(--color-lightui-disabled);
                cursor: not-allowed;
            }
        }

        & .titles {
            margin-bottom: var(--space-1x5);
        }
    }

    .controls {
        text-align: center;
        display: flex;
        justify-content: space-between;
        padding: var(--space-1x);
        background-color: var(--color-bg-inverted);
    }

    main {
        position: relative;
        flex: 1;
    }

    .scoring-header {
        display: flex;
        justify-content: space-between;

        & h4 {
            margin: auto 0;
        }
    }

    .scoring-note {
        margin: var(--space-1x) 0;
    }

    .collapsable-container {
        position: relative;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    .collapse-button {
        display: none;
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: calc(var(--layer-5) + 1);

        & :global(button) {
            background-color: var(--color-bg-info);
            border: 1px solid #bfbfbf;
            width: 4rem;
            height: 4rem;
            min-width: auto;
        }
    }

    @media screen and (--mq-maxwidth-medium) {
        aside {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 15rem;
            z-index: var(--layer-5);
            box-shadow: 0px -1px 4px rgba(0, 0, 0, 0.25);

            &.open {
                height: calc(100% - 4rem);
                & .collapsable-container {
                    height: auto;
                    overflow: auto;
                }
            }
        }

        .collapsable-container {
            height: 5rem;
            overflow: hidden;

            & .form-container {
                overflow: initial;
            }
        }

        .collapse-button {
            display: block;
        }

        main {
            height: calc(100% - 17rem);
            overflow: auto;
            & > :global(*) {
                min-height: 16rem;
            }
        }
    }
</style>

<svelte:head>
    <title>{__('Score a task')}</title>
</svelte:head>
<svelte:window bind:innerWidth={windowWidth} />

{#if task}
    {#if !smallPdfView}
        <div class="header">
            <TaskHeader
                {taskHeaderBreadcrumbItems}
                {showBackButton}
                {onExit}
                {isSubmitEnabled}
                {isDeliveryOverviewOpen}
                on:highlighter={onClickHighlighter}
                on:submitScores={onSubmitScores}
            />
        </div>
    {/if}
    <div class="wrapper" class:smallPdfView>
        <div class="content" class:inaccessible={isDeliveryOverviewOpen}>
            <aside aria-label={__('Scoring')} class:open={isScoringPanelOpen}>
                <span class="collapse-button">
                    <Button
                        skin="secondary"
                        shape="circular"
                        icon={isScoringPanelOpen ? 'chevron-bottom-16' : 'chevron-top-16'}
                        ariaLabel={isScoringPanelOpen ? __('Collapse scoring panel') : __('Open scoring panel')}
                        on:click={toggleScoringPanel}
                    />
                </span>
                <div class="collapsable-container">
                    <div class="sidebarhead">
                        <div class="titles">
                            <div class="scoring-header">
                                <h4>
                                    {task.test.title} / {task.item.title}{testTakerName ? ` / ${testTakerName}` : ''}
                                </h4>
                                <div>
                                    <IconBarButton
                                        label={__('Bookmark')}
                                        size="base-16"
                                        icon={task.bookmarked ? 'bookmark-fill-16' : 'bookmark-outline-16'}
                                        ariaPressed={task.bookmarked}
                                        disabled={isScoringUIDisabled}
                                        on:click={onBookmark}
                                    />
                                </div>
                            </div>
                            {#each previousScores as previousScore}
                                {#if previousScore.fullname}
                                    <p>
                                        {__('Scores given by %s', previousScore.fullname)}
                                        {#if complaint.enabled && !previousScore.scoringViolation}
                                            <span class="report" class:disabled={isScoringUIDisabled}>
                                                (
                                                <a
                                                    href={window.location.origin}
                                                    on:click|preventDefault={() =>
                                                        onComplaintDialogOpened(
                                                            previousScore.id,
                                                            previousScore.fullname
                                                        )}
                                                    class:disabled={isScoringUIDisabled}
                                                >
                                                    {__('report')}
                                                </a>
                                                )
                                            </span>
                                        {/if}
                                        :
                                    </p>
                                    {#if previousScore.scoringViolation}
                                        <div class="scoring-note">
                                            <CompliantNote
                                                scorerName={previousScore.fullname}
                                                scorerUsername={previousScore.username}
                                                itemTitle={task.item.title}
                                                note={previousScore.scoringViolation.description}
                                            />
                                        </div>
                                    {/if}
                                {/if}
                            {/each}
                            <p>{__('Answer %s of %s', position, numberOfTasks)}</p>
                        </div>
                    </div>
                    <div class="form-container">
                        <ScoringForm
                            {taskId}
                            {outcomeDeclarations}
                            {previousScores}
                            {notePlaceholder}
                            {showSelectionStatus}
                            {hideNoteBox}
                            {deliveryExecutionScoring}
                            bind:note={task.note}
                            disabled={isScoringUIDisabled}
                            on:score-change={onScoreChange}
                            on:note-change={onNoteChange}
                            on:toggleCriteriaView={handleSeeCriteriaClick}
                            on:suspicious-change={onSuspiciousFieldsChange}
                        />
                    </div>
                </div>
                <nav label={__('Response')} aria-label={__('Response')}>
                    <div class="controls">
                        <Button
                            skin="secondary"
                            shape="circular"
                            size={smallWidth ? 'small' : 'medium'}
                            icon="arrow-left-16"
                            inverted
                            disabled={prevTask === null || isPreviousBtnDisabled}
                            ariaLabel={__('Go to previous answer')}
                            on:click={onPreviousClick}
                        />
                        <Button
                            skin="secondary"
                            shape="pill"
                            size={smallWidth ? 'small' : 'medium'}
                            label={__('SEE Overview')}
                            ariaLabel={__('SEE Overview')}
                            inverted
                            disabled={isOverviewBtnDisabled || isDeliveryOverviewOpen}
                            on:click={onOverviewClick}
                        />
                        <Button
                            skin="secondary"
                            shape="circular"
                            icon="arrow-right-16"
                            size={smallWidth ? 'small' : 'medium'}
                            disabled={nextTask === null || isNextBtnDisabled}
                            ariaLabel={__('Go to next answer')}
                            inverted
                            on:click={onNextClick}
                        />
                    </div>

                    <Progressbar
                        value={totalScored}
                        max={numberOfTasks}
                        valueLabel={__('Completion: %s %', completion)}
                    />
                </nav>
            </aside>
            <main aria-label={showCriteriaPdf ? __('Scoring criteria') : __('Test taker response')}>
                {#if scorerToComplain}
                    <ComplaintDialog
                        complaintTaskId={taskIdToComplain}
                        scorerName={scorerToComplain}
                        item={task.item.title}
                        error={complaint.error}
                        open={complaint.enabled && isComplaintDialogOpened}
                        on:close={onComplaintDialogClosed}
                        on:action={onComplaintDialogAction}
                    />
                {/if}
                {#if showCriteriaPdf}
                    <ScoringCriteria url={criteriaPdfUrl} on:toggleCriteriaView={handleSeeCriteriaClick} />
                {/if}
                {#if task.ltiItemPreviewerLink}
                    <ItemPreviewer
                        on:success={handleItemPreviewLoaded}
                        on:error={handleError}
                        on:renderitem={validateRender}
                        bind:loading={previewLoading}
                        url={task.ltiItemPreviewerLink.url}
                        parameters={task.ltiItemPreviewerLink.parameters}
                        taskId={task.id}
                        itemId={task.item.qtiIdentifier}
                        hidden={isComplaintDialogOpened || showCriteriaPdf}
                        {showHighlighter}
                        bind:highlights
                    />
                {/if}
            </main>
        </div>
        {#if errorLoading && !(smallWidth && showCriteriaPdf)}
            <Ribbon
                type="warning"
                message={__('Task failed to load. Please contact your system administrator.')}
                icon="warning-16"
            />
        {/if}
    </div>
{/if}
<InactiveProjectDialog open={$taskStore.isProjectInactive} on:confirm-inactive={handleConfirmInactive} />
{#if submitErrorMessage}
    <ModalDialog
        open
        heading={submitErrorHeadLabel}
        buttons={[{ key: 'ok', label: submitErrorActionLabel, skin: 'primary' }]}
        on:action={onSubmitErrorUserAction}
        disableClosing
        initialFocus
        disableEscape
    >
        <p>{@html submitErrorMessage}</p>
    </ModalDialog>
{/if}
