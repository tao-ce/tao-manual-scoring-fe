<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020-2025 (original work) Open Assessment Technologies SA ;

    import { createEventDispatcher, onMount } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { Button, Progressbar, IconBarButton } from '@oat-sa-private/ui-elements';
    import { breakpoints } from '@oat-sa-private/ui-identity';
    import config from '@/config';
    import router from '@/core/router';
    import { log } from '@/core/utils';
    import { TASK_DATA_TYPE, saveLocalTaskData, removeLocalTaskData } from '@/core/utils/task';
    import { Ribbon, ModalDialog } from '@oat-sa-private/ui-components';
    import InactiveProjectDialog from '../inactiveProject/InactiveProjectDialog.svelte';
    import ItemPreviewer from './ItemPreviewer.svelte';
    import ScoringForm from './ScoringForm.svelte';
    import CompliantNote from './CompliantNote.svelte';
    import { TASK_TYPE } from '../../constants/task';
    import TaskHeader from './TaskHeader.svelte';
    import TaskAdminMode from './TaskAdminMode.svelte';
    import * as taskService from '../../services/taskService';
    import * as ltiService from '../../services/ltiService';
    import ScoringCriteria from './ScoringCriteria.svelte';
    import { taskStore } from '../../store/taskStore';
    import { debounce } from 'lodash';
    import { getLiveSaveStore, liveSaveStatuses } from '@oat-sa-private/ui-components/livesave/liveSaveStore.js';
    import { ScoringModes } from '../../constants/scoring-mode.js';
    import { getConfig } from '../../services/userConfigurationService';
    import {
        highlighterToolStore,
        inlineCommentsToolStore,
        markingSymbolsToolStore
    } from '@/store/deliverToolsStore.js';
    import { getUser } from '@/services/authService';
    import { ERROR_CODES } from '@/constants/error-codes.js';
    const userConfig = getConfig();
    const {
        isMarkAsNotEnoughBasisForAssessment: isMarkAsNotEnoughBasisForAssessmentEnabled,
        is_item_review_marking_symbols_enabled = false,
        is_item_review_highlighter_enabled = false
    } = userConfig;

    export let taskId;
    export let isDeliveryOverviewOpen;
    export let scoringMode = ScoringModes.ITEM;

    $: task = $taskStore.task;
    $: meta = $taskStore.meta;

    $: testTitle = task.test?.title ?? task.delivery?.testTitle ?? '';
    $: itemTitle = task.item?.title ?? '';

    $: adminReviewList = $taskStore.adminReviewList;
    $: adminReviewListActiveTab = $taskStore.adminReviewListActiveTab;
    $: hasAdminReviews = adminReviewList.length > 0;
    // If administrative and read-only, we consider the launch an administrative read-only
    // in this mode, we must load and show all the info (scores, notes, etc) from all previous scorers and reviewers
    //$: isAdminReviewMode = (!(meta?.isAdministrative && !meta?.isReadOnly));
    $: isAdminReviewMode = (meta?.isAdministrative ?? false) && !(meta?.isReadOnly ?? false);

    const autoSaveStatus = getLiveSaveStore('autosave');

    let itemPreviewer;
    let isTaskFieldsChanged = false;
    let wasSuspiciousCheckboxChanged = false;
    let wasNotEnoughBasisCheckboxChanged = false;
    let taskType;
    let position;
    let prevTask = null;
    let nextTask = null;
    let deliveryExecutionScoring = null;
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
    let isReadOnly = false;
    let deliveryExecutionIds = [];

    let criteriaPdfUrl;
    let showCriteriaPdf = false;
    let previewLoading = true;

    let highlights = $taskStore?.task?.highlights;
    let outcomeDeclarations;

    const getActiveUserHighlights = () => (isUsersOwnTabSelected ? highlights : $taskStore.task?.highlights || []);

    function updateTools() {
        highlighterToolStore.update(store => {
            store.installed = is_item_review_highlighter_enabled;
            store.disabled = isReadOnly || (store.installed && !isUsersOwnTabSelected);
            return store;
        });
        inlineCommentsToolStore.update(store => {
            store.disabled = isReadOnly || !isUsersOwnTabSelected;
            return store;
        });
        markingSymbolsToolStore.update(store => {
            store.installed = is_item_review_marking_symbols_enabled;
            store.disabled = isReadOnly || (store.installed && !isUsersOwnTabSelected);
            return store;
        });
    }

    $: isUsersOwnTabSelected = $taskStore && $taskStore.isUsersOwnTabSelected;

    $: hasUnsavedChanges = isTaskFieldsChanged || wasSuspiciousCheckboxChanged || wasNotEnoughBasisCheckboxChanged;

    // react to initial config read / initial ltiConfig.isReadOnly / isUsersOwnTabSelected change
    $: updateTools(
        is_item_review_highlighter_enabled,
        is_item_review_marking_symbols_enabled,
        isReadOnly,
        isUsersOwnTabSelected
    );

    let errorLoading = false;
    let submitErrorActionLabel;
    let submitErrorHeadLabel = __('Scoring task submission error');
    let onSubmitErrorUserAction;
    let submitErrorMessage;
    let windowWidth;

    let isPreviousBtnDisabled = false;
    let isNextBtnDisabled = false;
    let currentUserUsername = null;

    $: scoringHeaderString = [testTitle, itemTitle, testTakerName].filter(Boolean).join(' / ');
    $: currentScorer = hasAdminReviews ? adminReviewList.find(s => s.key === adminReviewListActiveTab) : null;

    $: isCurrentUserTab = (() => {
        if (!currentScorer) return false;
        // `isAdmin` marks the UI entry for the current user's final score
        // (My final score). Treat that entry as the current user's tab.
        if (currentScorer.isAdmin) return true;
        // Otherwise compare keys (previous scorer entries use IDs/usernames)
        return currentScorer?.key === currentUserUsername;
    })();

    $: displayNote = isCurrentUserTab ? task.note : currentScorer?.note ?? '';

    function resolveLtiItemPreviewerLink(params) {
        const {
            currentScorer: currentScorerParam,
            previousScores: previousScoresParam,
            adminReviewListActiveTab: adminReviewListActiveTabParam,
            currentUserUsername: currentUserUsernameParam,
            task: taskParam
        } = params;

        const taskLocal = taskParam;

        if (!taskLocal) {
            return null;
        }

        if (!task) {
            return null;
        }

        let userKey = null;

        // When tabs are rendered (currentScorer exists), always resolve based on the selected tab
        if (currentScorerParam) {
            if (currentScorerParam.isAdmin) {
                // For admin tab, use current user's username
                userKey = currentUserUsernameParam;
            } else {
                // For reviewer/scorer tab, try to find the corresponding user
                // First try previousScores (linked tasks data with username info)
                if (previousScoresParam?.length > 0) {
                    const previousScore = previousScoresParam.find(ps => ps.id === adminReviewListActiveTabParam);
                    userKey = previousScore?.username || null;
                }
                // If not found in previousScores, use the currentScorer's key/label (userId)
                if (!userKey) {
                    userKey = currentScorerParam.key || currentScorerParam.label;
                }
            }
        } else {
            // No tabs rendered, use current user's username
            userKey = currentUserUsernameParam;
        }

        if (userKey && taskLocal.ltiItemPreviewerLinks?.[userKey]) {
            return taskLocal.ltiItemPreviewerLinks[userKey];
        }

        // Fallback to a single preview link when per-user links are not available.
        if (taskLocal.ltiItemPreviewerLink) {
            return taskLocal.ltiItemPreviewerLink;
        }

        return null;
    }

    $: ltiItemPreviewerLink = resolveLtiItemPreviewerLink({
        isAdminReviewMode,
        currentScorer,
        previousScores,
        // Use the store value directly to ensure the key used by the
        // `{#key $taskStore.adminReviewListActiveTab}` block and the value
        // used to resolve the previewer link are the same reactive source.
        adminReviewListActiveTab: $taskStore.adminReviewListActiveTab,
        currentUserUsername,
        task
    });

    $: isScoringUIDisabled = isReadOnly || previewLoading || errorLoading;

    $: numberOfTasks = $taskStore.meta.numberOfTasks;
    $: totalScored = $taskStore.meta.totalScored;

    $: completion = numberOfTasks > 0 ? Math.floor((totalScored / numberOfTasks) * 100) : 0;

    $: isScoringCompleted = completion === 100;

    $: isNotEnoughBasisChecked = deliveryExecutionScoring?.notEnoughBasisForAssessment ?? false;

    $: smallWidth = windowWidth <= breakpoints.width.medium + 1;

    $: smallPdfView = smallWidth && showCriteriaPdf;

    const dispatch = createEventDispatcher();

    $: {
        if (task) {
            outcomeDeclarations = task.outcomeDeclarations;
        }

        if (meta) {
            previousScores = meta.previousScores;
            position = meta.position;
            prevTask = meta.prevTask;
            nextTask = meta.nextTask;
            taskType = meta.taskType;
            deliveryExecutionScoring = meta.deliveryExecutionScoring;

            // Show the interrupted dialog if the session is interrupted, and we haven't shown it yet
            if (meta?.interrupted === true && !$taskStore.interrupted) {
                taskStore.setAsInterrupted();
            }
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
        isReadOnly = ltiConfig.isReadOnly || false;
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

    const handleRequestError = error => {
        if (error.error?.message?.endsWith(taskId)) {
            submitErrorHeadLabel = __('Scoring task could not be started');
            error.error.message = __(
                'This scoring task could not be initiated most likely because another scoring session was initiated in a different window or browser.<br>To resolve this issue:<br><ul><li>Make sure you are not scoring different session in another window or browser.</li><li>Close any other tabs or browser windows where this or another scoring link might be open.</li></ul>If you have already checked these steps and still see this message, please contact support or your administrator for further assistance.'
            );
            error.allowResubmit = false;
        }

        if (error.responseStatus === 409) {
            let isInterruptedByUnknownReasons = error.error?.message === ERROR_CODES.NULL_SESSION_TOKEN_ID;

            taskStore.setAsInterrupted(isInterruptedByUnknownReasons);

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

    const saveDeliveryExecutionScoring = async () => {
        await taskStore.saveDeliveryExecutionScoring(deliveryExecutionScoring);
        wasSuspiciousCheckboxChanged = false;
        wasNotEnoughBasisCheckboxChanged = false;
    };

    const updateTask = async (id, data) => {
        try {
            if ($taskStore.ltiConfig?.isReadOnly) {
                return { data: $taskStore.task, _meta: $taskStore.meta };
            }

            autoSaveStatus.reset(liveSaveStatuses.waiting);

            if (
                wasSuspiciousCheckboxChanged ||
                wasNotEnoughBasisCheckboxChanged ||
                (scoringMode === ScoringModes.TEST && isNotEnoughBasisChecked)
            ) {
                await saveDeliveryExecutionScoring();
            }

            const response = await taskStore.submitTasks(id, {
                bookmarked: data.bookmarked,
                highlights: data.highlights,
                note: data.note,
                outcomeDeclarations: data.outcomeDeclarations
            });

            if (response.redirectTask) {
                taskStore.updateRedirectTask(response.redirectTask);
            }
            isTaskFieldsChanged = false;
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
        if (isCurrentUserTab) {
            taskStore.updateNote(displayNote);
        }

        const taskUpdated = {
            ...task,
            highlights: getActiveUserHighlights()
        };

        if (
            wasSuspiciousCheckboxChanged ||
            wasNotEnoughBasisCheckboxChanged ||
            (scoringMode === ScoringModes.TEST && isNotEnoughBasisChecked)
        ) {
            await saveDeliveryExecutionScoring();
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
        if (isCurrentUserTab) {
            taskStore.updateNote(displayNote);
        }
        const data = taskService.formatTaskData({
            ...task,
            highlights: getActiveUserHighlights()
        });

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
     * @param isInterrupted
     */
    async function onExit(target, isInterrupted = false) {
        const data = taskService.formatTaskData({
            ...task,
            highlights: getActiveUserHighlights()
        });

        try {
            if (!isReadOnly && !isInterrupted) {
                await debouncedUpdate(taskId, data);
            }

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
        const { score, outcomeDeclarationId } = detail;

        isTaskFieldsChanged = true;
        taskStore.updateScore({ score, outcomeDeclarationId });

        const data = taskService.formatTaskData({
            ...task,
            note: hasAdminReviews ? displayNote : task.note,
            highlights: getActiveUserHighlights()
        });

        await debouncedUpdate(taskId, data);
    }

    function onNoteChange(evt) {
        const noteValue = evt.detail ?? '';
        taskStore.updateNote(noteValue);
		taskStore.persistHighlights(taskId, getActiveUserHighlights());
        deliveryExecutionScoring = {
            ...(deliveryExecutionScoring || {}),
            note: noteValue
        };
        taskStore.storeDeliveryExecutionScoring(deliveryExecutionScoring);

        isTaskFieldsChanged = true;
    }

    async function onSubmitScores() {
        try {
            const shouldBlockSubmission = isMarkAsNotEnoughBasisForAssessmentEnabled
                ? !isScoringCompleted && !isNotEnoughBasisChecked
                : !isScoringCompleted;

            if (shouldBlockSubmission) {
                return;
            }

            isScoringCompleted = false;

            if (isCurrentUserTab) {
                taskStore.updateNote(displayNote);
            }
            taskStore.storeDeliveryExecutionScoring(deliveryExecutionScoring);

            const data = taskService.formatTaskData({
                ...task,
                highlights: getActiveUserHighlights()
            });

            debouncedUpdate.cancel();
            await updateTask(taskId, data);
            if (isReview) {
                log.log('Reviewer/scorer submitted scores for a session');
            }

            if ($taskStore.redirectTask !== null || isReadOnly) {
                return;
            }
            const response = await taskService.submitLTITasks(taskType, taskId);

            removeLocalTaskData(taskId);

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
            isScoringCompleted = true;
        }
    }

    function onBookmark() {
        isTaskFieldsChanged = true;
        taskStore.toggleBookmark();
    }

    function onClickHighlighter(event) {
        const show = event.detail.show;
        isScoringPanelOpen = false;

        self.postMessage({ event: show ? 'highlighter-show' : 'highlighter-hide' }, '*');
    }

    function onClickMarkingSymbols(event) {
        const show = event.detail.show;
        isScoringPanelOpen = false;

        self.postMessage({ event: show ? 'markingSymbols-show' : 'markingSymbols-hide' }, '*');
    }

    function onMarkingSymbolsState(event) {
        const open = !!event.detail.open;
        markingSymbolsToolStore.update(store => ({
            ...store,
            open
        }));
    }

    function validateRender(event) {
        if (scoringMode === ScoringModes.TEST) {
            return;
        }

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

    const onSuspiciousChange = async event => {
        wasSuspiciousCheckboxChanged = true;
        const { suspicious, suspiciousNote } = event.detail;

        deliveryExecutionScoring = {
            ...(deliveryExecutionScoring || {}),
            suspicious,
            suspiciousNote,
            note: task.note
        };

        taskStore.storeDeliveryExecutionScoring(deliveryExecutionScoring);
    };

    const onNotEnoughBasisChange = async event => {
        wasNotEnoughBasisCheckboxChanged = true;
        const { notEnoughBasisForAssessment, notEnoughBasisForAssessmentNote } = event.detail;

        deliveryExecutionScoring = {
            ...(deliveryExecutionScoring || {}),
            notEnoughBasisForAssessment,
            notEnoughBasisForAssessmentNote,
            note: task.note
        };

        taskStore.storeDeliveryExecutionScoring(deliveryExecutionScoring);
    };

    const handleHighlighterUpdate = e => {
        const { reset } = e.detail;
        itemPreviewer.updateHighlighter(reset);
    };

    const getNotEnoughBasisForAssessmentNoteFromDeliveryExecutionScoring = isAdmin => {
        if (isAdmin) {
            return deliveryExecutionScoring?.notEnoughBasisForAssessmentNote ?? '';
        }

        return currentScorer?.deliveryExecutionScoring?.notEnoughBasisForAssessmentNote ?? '';
    };

    const getSuspiciousNoteFromDeliveryExecutionScoring = isAdmin => {
        if (isAdmin) {
            return deliveryExecutionScoring?.suspiciousNote ?? '';
        }

        return currentScorer?.deliveryExecutionScoring?.suspiciousNote ?? '';
    };

    onMount(async () => {
        try {
            const user = await getUser();
            currentUserUsername = user?.userData?.login || null;
        } catch (error) {
            log.error('Failed to get current user:', error);
            currentUserUsername = null;
        }
    });
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
        min-height: 0;

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
        .content {
            display: flex;
            flex-direction: column;
        }
        aside {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 16rem;
            z-index: var(--layer-5);
            box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.25);

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

{#if !smallPdfView}
    <div class="header">
        <TaskHeader
            {isAdminReviewMode}
            {taskHeaderBreadcrumbItems}
            {showBackButton}
            {onExit}
            {isScoringCompleted}
            {isReadOnly}
            {hasUnsavedChanges}
            {isNotEnoughBasisChecked}
            notEnoughBasisNote={deliveryExecutionScoring?.notEnoughBasisForAssessmentNote ?? ''}
            {isDeliveryOverviewOpen}
            on:highlighter={onClickHighlighter}
            on:markingSymbols={onClickMarkingSymbols}
            on:submitScores={onSubmitScores}
        />
    </div>
{/if}

<div class="wrapper" class:smallPdfView>
    {#if hasAdminReviews}
        <TaskAdminMode bind:highlights on:updateHighlighter={handleHighlighterUpdate} />
    {/if}

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
                        {#if !hasAdminReviews}
                            <div class="scoring-header">
                                <h4>
                                    {scoringHeaderString}
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
                                        :
                                    </p>
                                    {#if previousScore.scoringViolation}
                                        <div class="scoring-note">
                                            <CompliantNote
                                                scorerName={previousScore.fullname}
                                                scorerUsername={previousScore.username}
                                                {itemTitle}
                                                note={previousScore.scoringViolation.description}
                                            />
                                        </div>
                                    {/if}
                                {/if}
                            {/each}
                            <p>{__('Answer %s of %s', position, numberOfTasks)}</p>
                        {:else}
                            {@const scorer = isAdminReviewMode ? task : currentScorer}
                            <div class="scoring-header">
                                <h4>
                                    {scoringHeaderString}
                                </h4>
                                <div>
                                    <IconBarButton
                                        label={__('Bookmark')}
                                        size="base-16"
                                        icon={scorer?.bookmarked ? 'bookmark-fill-16' : 'bookmark-outline-16'}
                                        ariaPressed={scorer?.bookmarked}
                                        disabled={!isCurrentUserTab || isScoringUIDisabled}
                                        on:click={onBookmark}
                                    />
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="form-container">
                    {#if hasAdminReviews}
                        {#if currentScorer}
                            <ScoringForm
                                taskId={currentScorer?.key}
                                outcomeDeclarations={currentScorer.outcomeDeclarations}
                                previousScores={isCurrentUserTab ? previousScores : []}
                                {notePlaceholder}
                                {showSelectionStatus}
                                {hideNoteBox}
                                deliveryExecutionScoring={isAdminReviewMode
                                    ? deliveryExecutionScoring
                                    : currentScorer?.deliveryExecutionScoring}
                                notEnoughBasisNote={getNotEnoughBasisForAssessmentNoteFromDeliveryExecutionScoring(
                                    isCurrentUserTab
                                )}
                                suspiciousNote={getSuspiciousNoteFromDeliveryExecutionScoring(isCurrentUserTab)}
                                note={displayNote}
                                disabled={!isCurrentUserTab || isScoringUIDisabled}
                                {isAdminReviewMode}
                                bind:isNotEnoughBasisChecked
                                on:score-change={onScoreChange}
                                on:note-change={onNoteChange}
                                on:toggleCriteriaView={handleSeeCriteriaClick}
                                on:suspicious-change={onSuspiciousChange}
                                on:not-enough-basis-change={onNotEnoughBasisChange}
                            />
                        {/if}
                    {:else}
                        <ScoringForm
                            {taskId}
                            {outcomeDeclarations}
                            {previousScores}
                            {notePlaceholder}
                            {showSelectionStatus}
                            {hideNoteBox}
                            {deliveryExecutionScoring}
                            notEnoughBasisNote={deliveryExecutionScoring?.notEnoughBasisForAssessmentNote ?? ''}
                            suspiciousNote={deliveryExecutionScoring?.suspiciousNote ?? ''}
                            {isAdminReviewMode}
                            note={task.note}
                            disabled={isScoringUIDisabled}
                            bind:isNotEnoughBasisChecked
                            on:score-change={onScoreChange}
                            on:note-change={onNoteChange}
                            on:toggleCriteriaView={handleSeeCriteriaClick}
                            on:suspicious-change={onSuspiciousChange}
                            on:not-enough-basis-change={onNotEnoughBasisChange}
                        />
                    {/if}
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

                <Progressbar value={totalScored} max={numberOfTasks} valueLabel={__('Completion: %s %', completion)} />
            </nav>
        </aside>
        <main aria-label={showCriteriaPdf ? __('Scoring criteria') : __('Test taker response')}>
            {#if showCriteriaPdf}
                <ScoringCriteria url={criteriaPdfUrl} on:toggleCriteriaView={handleSeeCriteriaClick} />
            {/if}
            {#if ltiItemPreviewerLink}
                {#key $taskStore.adminReviewListActiveTab}
                    <ItemPreviewer
                        on:success={handleItemPreviewLoaded}
                        on:error={handleError}
                        on:renderitem={validateRender}
                        bind:loading={previewLoading}
                        url={ltiItemPreviewerLink.url}
                        parameters={ltiItemPreviewerLink.parameters}
                        taskId={task.id}
                        itemId={task?.item?.qtiIdentifier}
                        hidden={isComplaintDialogOpened || showCriteriaPdf}
                        bind:highlights
                        bind:this={itemPreviewer}
                        on:markingSymbolsState={onMarkingSymbolsState}
                    />
                {/key}
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
{#if $taskStore.interrupted}
    <ModalDialog
        open={$taskStore.interrupted}
        heading={__('Session Interrupted')}
        disableClosing={true}
        buttons={[{ key: 'ok', label: __('Return to session'), skin: 'primary', initialFocus: true, autoClose: true }]}
        on:action={() => onExit(ltiBackLink, true)}
        initialFocus
    >
        <p>
            {__(
                'This scoring session has been interrupted because the test taker’s session was reopened by an administrator. Please go back and restart scoring.'
            )}
        </p>
    </ModalDialog>
{/if}
