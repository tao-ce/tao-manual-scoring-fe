<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script context="module">
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2025 (original work) Open Assessment Technologies SA ;

    /**
     * Enum for delivery overview item types
     * @readonly
     * @enum {string}
     */
    const DeliveryOverviewItemType = Object.freeze({
        ITEM: 'item',
        TEST: 'test'
    });
</script>

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2019-2025 (original work) Open Assessment Technologies SA ;

    import { createEventDispatcher, onMount, tick } from 'svelte';
    import { Loading, Pagination, SearchableDropdown, TabGroup } from '@oat-sa-private/ui-components';
    import { compile } from 'path-to-regexp';
    import config from '@/config';
    import { __ } from '@oat-sa-private/ui-core';
    import { Icon } from '@oat-sa-private/ui-elements';
    import { breakpoints } from '@oat-sa-private/ui-identity';
    import router from '@/core/router';
    import { DELIVERY_TAB, PAGE_SIZE } from '../../constants/delivery';
    import { TASK_TYPE } from '../../constants/task';
    import InactiveProjectDialog from '../inactiveProject/InactiveProjectDialog';
    // TODO: remove services from components to stores
    import * as deliveryService from '../../services/deliveryService';
    import * as taskService from '../../services/taskService';
    import DeliveryTable from './DeliveryTable';
    import SideItemBar from './SideItemBar';
    import { taskStore } from '../../store/taskStore';

    /**
     * @typedef {import('../../services/taskService').TasksResponse} TasksResponse
     * @typedef {import('../../typings/index.js').DeliveryItem} DeliveryItem
     */

    export let deliveryId;
    export let taskId;

    /**
     * @type {TASK_TYPE}
     */
    export let taskType = TASK_TYPE.SCORING;
    if (Object.values(TASK_TYPE).indexOf(taskType) < 0) {
        taskType = TASK_TYPE.SCORING;
    }

    let isProjectInactive = false;
    let isTableLoading = false;
    // True if a bookmark add/remove request is in progress
    let isBookmarkingInProgress = false;

    /**
     * @type {DeliveryItem[]}
     */
    let items = [];
    let tests = [];
    let currentPage = 1;
    let totalPages = 1;
    let activeTab = DELIVERY_TAB.ALL;
    let numTasksUnscored;
    let numTasksScored;
    let numTasksBookmarked;
    let totalScoreText = __('Total score');
    let scrollIntoCurrentTask = false;
    let taskGroup = {};
    let activeItem = null;
    let windowWidth;

    $: totalTasks = numTasksUnscored + numTasksScored;
    $: taskTabs = [
        {
            key: DELIVERY_TAB.ALL,
            label: `${__('All')}(${isNaN(totalTasks) ? ' ' : totalTasks})`
        },
        {
            key: DELIVERY_TAB.INCOMPLETE,
            label: `${__('Incomplete')}(${isNaN(totalTasks) ? ' ' : numTasksUnscored})`,
            disabled: !numTasksUnscored
        },
        {
            key: DELIVERY_TAB.BOOKMARKED,
            label: `${__('Bookmarked')}(${isNaN(totalTasks) ? ' ' : numTasksBookmarked})`,
            disabled: !numTasksBookmarked
        }
    ];
    $: visibleItems = items
        .filter(item => {
            switch (activeTab) {
                case DELIVERY_TAB.BOOKMARKED:
                    return item.hasBookmarked;
                case DELIVERY_TAB.INCOMPLETE:
                    return item.hasIncomplete;
                default:
                    return true;
            }
        })
        .map(createItemsMapper(DeliveryOverviewItemType.ITEM));
    $: visibleTests = tests
        .filter(test => {
            switch (activeTab) {
                case DELIVERY_TAB.BOOKMARKED:
                    return test.hasBookmarked;
                case DELIVERY_TAB.INCOMPLETE:
                    return test.hasIncomplete;
                default:
                    return true;
            }
        })
        .map(createItemsMapper(DeliveryOverviewItemType.TEST));
    /**
     * Options for searchable dropdown
     * @type {Array<{ group: string, options: Array<{ id: string, title: string, deliveryId: string }> }>}
     */
    $: deliveryContents = [
        {
            group: __('Items'),
            items: visibleItems
        },
        {
            group: __('Tests'),
            items: visibleTests
        }
    ];
    $: smallWidth = windowWidth <= breakpoints.width.medium + 1;

    const dispatch = createEventDispatcher();

    /**
     * Creates a mapper function to add overviewItemType to each item
     * @param {string} overviewItemType
     * @returns {(item: DeliveryItem) => DeliveryItem}
     */
    function createItemsMapper(overviewItemType = DeliveryOverviewItemType.ITEM) {
        return item => ({
            ...item,
            overviewItemType
        });
    }

    /**
     * Turns on `isProjectInactive` if the response status code is 409
     * to display an inactive project screen component
     * @param {Error} error
     */
    function handleRequestError(error) {
        if (error.responseStatus === 409) {
            isProjectInactive = true;
        }
    }

    /**
     * @param {TasksResponse} taskResponse
     * @param {DeliveryItem} item
     */
    const handleTasksResponse = ({ redirectTask, data, _pagination, _meta = {} }, item) => {
        if (redirectTask) {
            taskStore.updateRedirectTask(redirectTask);
            return;
        }

        if (_pagination && typeof _pagination.offset === 'number') {
            currentPage = Math.floor(_pagination.offset / PAGE_SIZE) + 1;
        }
        const tasks = taskService.getTasksByGroup(data, item, _meta.linkedTasks);
        taskGroup = tasks[item.id] || {};

        totalPages = Math.ceil(_pagination.numTotal / PAGE_SIZE);
        isTableLoading = false;
        totalScoreText = _meta.linkedTasks ? __('Corrected total score') : __('Total score');
    };

    /**
     * Reducer for deliveries response
     * @param {Object} accumulator
     * @param {Object} delivery
     * @returns {Object}
     */
    function deliveriesResponseReducer(accumulator, delivery) {
        const workProgress = delivery.workProgress[taskType];

        return {
            items: accumulator.items.concat(
                (delivery.items ?? [])
                    .filter(item => item.numTasks > 0)
                    // add deliveryId to item
                    .map(item => ({ ...item, deliveryId: delivery.id }))
            ),
            tests: accumulator.tests.concat(
                (delivery.tests ?? [])
                    .filter(test => test.numTasks > 0)
                    // add deliveryId to test
                    .map(test => ({ ...test, deliveryId: delivery.id }))
            ),
            // summarize statistics
            numTasksUnscored: accumulator.numTasksUnscored + workProgress.numTasksUnscored,
            numTasksScored: accumulator.numTasksScored + workProgress.numTasksScored,
            numTasksBookmarked: accumulator.numTasksBookmarked + workProgress.numTasksBookmarked
        };
    }

    /**
     * Handles get LTI deliveries request
     * @param {Object} deliveriesResponse
     * @param {Object} currentActiveItem
     * @returns {Promise<boolean>} - stop execution?
     */
    async function handleDeliveriesLTIResponse(deliveriesResponse, currentActiveItem) {
        if (deliveriesResponse.redirectTask) {
            taskStore.updateRedirectTask(deliveriesResponse.redirectTask);
            return true; // = stop execution
        }

        const responseItems = deliveriesResponse.data.items ?? [];
        const responseTests = deliveriesResponse.data.tests ?? [];

        const newData = [...responseItems, ...responseTests].reduce(deliveriesResponseReducer, {
            items: [],
            tests: [],
            numTasksUnscored: 0,
            numTasksScored: 0,
            numTasksBookmarked: 0
        });

        items = newData.items;
        tests = newData.tests;

        await tick(); // give time to visibleItems and visibleTests to update
        const targetItem = {
            id: currentActiveItem?.id ?? $taskStore.task?.item?.qtiIdentifier ?? $taskStore.task?.test?.identifier,
            deliveryId: currentActiveItem?.deliveryId ?? $taskStore.task?.item?.taoDeliveryId ?? $taskStore.task?.test?.taoDeliveryId
        };
        activeItem =
            [...visibleItems, ...visibleTests].find(item => item.id === targetItem.id && item.deliveryId === targetItem.deliveryId) ||
            visibleItems[0] ||
            visibleTests[0] ||
            null;
        numTasksUnscored = newData.numTasksUnscored;
        numTasksScored = newData.numTasksScored;
        numTasksBookmarked = newData.numTasksBookmarked;

        return false;
    }

    /**
     * Load deliveries details from LTI call
     * @param currentActiveItem
     * @returns {Promise<boolean>} - stop execution? (in case of redirection)
     */
    async function loadDeliveriesLTI(currentActiveItem) {
        try {
            const deliveries = await deliveryService.getDeliveriesLTI({
                currentTask: taskId,
                isReadOnly: $taskStore.ltiConfig.isReadOnly ?? false
            });
            return handleDeliveriesLTIResponse(deliveries, currentActiveItem);
        } catch (error) {
            handleRequestError(error);
            return true;
        }
    }

    const fetchDeliveriesResponse = async currentActiveItem => {
        const deliveryData = await deliveryService.getDeliveriesLTI({
            currentTask: taskId
        });
        await handleDeliveriesLTIResponse(deliveryData, currentActiveItem);
    };

    /**
     * Loads the tasks based on item
     *
     * @param {DeliveryItem} item
     * @param {Number} pageIndex
     * @returns {Promise|void}
     */
    async function loadTasks(item, pageIndex = currentPage) {
        scrollIntoCurrentTask = false;
        if (!item) {
            isTableLoading = false;
            currentPage = 0;
            totalPages = 0;

            return;
        }

        // When users unmark last (single) task on the bookmark tab page, he should be moved to the previous page.
        let offsetIndex = pageIndex;
        if (activeTab === DELIVERY_TAB.BOOKMARKED) {
            const { tasks } = taskGroup;
            offsetIndex = pageIndex > 1 && tasks && tasks.length === 1 ? pageIndex - 1 : pageIndex;
        }
        currentPage = offsetIndex;

        try {
            const payload = {
                deliveryId: item.deliveryId,
                [item.overviewItemType === DeliveryOverviewItemType.ITEM ? 'itemId' : 'testId']: item.id,
                scope: item.overviewItemType,
                taskType,
                activeTab,
                selectedTaskId: taskId,
                currentTask: taskId,
                currentPage,
                isReadOnly: $taskStore.ltiConfig.isReadOnly ?? false,
            };
            const response = await taskService.getTasksByDelivery(payload);
            return handleTasksResponse(response, item);
        } catch (error) {
            return handleRequestError(error);
        }
    }

    /**
     * Handles change of active item from the sidebar or dropdown
     * @param {Object} item
     */
    async function handleChangeActiveItem(item) {
        activeItem = item;
        loadTasks(activeItem, 1);
    }

    const getItemKey = item => `${item.id}_${item.deliveryId}`;

    /**
     * Handles change event from the item dropdown
     * @param {Event} event
     * @param {Object} event.detail
     */
    async function handleItemDropdownChange({ detail: selectedValue }) {
        const matchedItem = [...visibleItems, ...visibleTests].find(item => getItemKey(item) === getItemKey(selectedValue));
        handleChangeActiveItem(matchedItem);
    }

    const onTabChange = e => {
        isTableLoading = true;
        activeTab = e.detail.key;

        // give time to svelte to update visibleItems
        tick().then(() => {
            activeItem = visibleItems[0] ?? visibleTests[0];
            loadTasks(activeItem, 1);
        });
    };

    const onTaskClick = ({ detail }) => {
        router.redirect(
            compile(config.routes.task)({
                taskId: detail.id,
                deliveryId: detail.deliveryId
            })
        );
    };

    const onClose = () => {
        dispatch('closeDeliveryOverview');
    };

    // TODO: move service login into store
    const onBookmark = async event => {
        const { key, bookmarked } = event.detail;

        isBookmarkingInProgress = true;

        try {
            // if bookmark is removed on bookmark page, task is removed immediatelly to avoid later row jump
            if (bookmarked === false && activeTab === DELIVERY_TAB.BOOKMARKED) {
                // tick is necessary to give time to rendering of bookmark icon
                await tick();
                taskGroup.tasks = taskGroup.tasks.filter(task => task.id !== key);
            }

            const response = await taskService.bookmarkTask(key, bookmarked);

            // Update current task context
            if (taskId === key) {
                await taskStore.setBookmark(response.bookmarked);
            }
            if (Array.isArray(taskGroup.tasks)) {
                const task = taskGroup.tasks.find(curTask => curTask.id === key);
                if (task) {
                    task.bookmarked = response.bookmarked;
                }
                taskGroup = { ...taskGroup }; // FIXME: we have to update taskGroup this way, otherwise table is not updated w/o reload
            }

            // Handle post-bookmark logic
            if (response.bookmarked) {
                numTasksBookmarked++;
                const item = items.find(currentItem => currentItem.id === response.item.qtiIdentifier);
                if (item) {
                    item.hasBookmarked = true;
                }
            } else {
                numTasksBookmarked--;

                if (activeTab === DELIVERY_TAB.BOOKMARKED) {
                    if (numTasksBookmarked === 0) {
                        onTabChange({ detail: { key: DELIVERY_TAB.ALL } });
                    } else {
                        await fetchDeliveriesResponse(activeItem);
                        // tick is necessary to update visibleItems
                        await tick();
                        if (!taskGroup.tasks?.length) {
                            activeItem = visibleItems[0];
                        }
                        loadTasks(activeItem);

                        if (!taskGroup.tasks) {
                            // Full data reload sequence
                            if (activeItem) {
                                isTableLoading = true;
                                const taskResponse = await taskService.getTasksByDelivery({
                                    deliveryId,
                                    itemId: activeItem.id,
                                    taskType,
                                    activeTab,
                                    selectedTaskId: taskId,
                                    currentTask: taskId,
                                    isReadOnly: $taskStore.ltiConfig.isReadOnly ?? false
                                });
                                handleTasksResponse(taskResponse, activeItem);
                            }
                        }
                    }
                } else {
                    // Regular background refresh
                    await fetchDeliveriesResponse(activeItem);
                }
            }
        } catch (error) {
            handleRequestError(error);
        } finally {
            isBookmarkingInProgress = false;
        }
    };

    const handleConfirmInactive = () => {
        router.redirect(config.routes.scoringProjects);
    };

    const handlePagination = ({ detail }) => {
        const pageIndex = detail.page;

        loadTasks(activeItem, pageIndex);
    };

    onMount(async () => {
        const stopExecution = await loadDeliveriesLTI(activeItem);
        if (stopExecution) {
            return;
        }
        if (activeItem) {
            isTableLoading = true;
            const taskResponse = await taskService.getTasksByDelivery({
                deliveryId: activeItem.deliveryId,
                [activeItem.overviewItemType === DeliveryOverviewItemType.ITEM ? 'itemId' : 'testId']: activeItem.id,
                scope: activeItem.overviewItemType,
                taskType,
                activeTab,
                selectedTaskId: taskId,
                currentTask: taskId,
                isReadOnly: $taskStore.ltiConfig.isReadOnly ?? false
            });
            scrollIntoCurrentTask = true;
            handleTasksResponse(taskResponse, activeItem);
        }
    });
</script>

<style>
    .delivery {
        --sidebar-width: 30rem;

        height: 100%;
        min-height: 30rem;
        width: 100%;
        display: flex;
        flex-direction: column;

        &.isBookmarkingInProgress {
            position: relative;

            &:after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                cursor: wait;
            }
        }
    }

    .container {
        display: flex;
        flex-direction: row-reverse;
        flex-grow: 1;
        margin-top: calc(-1 * var(--space-2x));
        overflow-y: hidden;
    }

    main {
        width: 100%;
        overflow-y: auto;
        scroll-behavior: smooth;
        display: flex;
        flex-direction: column;
    }

    .content {
        flex: 1;
    }

    .block {
        display: flex;
        align-items: center;
        flex-direction: column;
        width: 100%;
        text-align: center;
        margin: var(--space-10x) 0;
    }

    .close {
        height: var(--space-6x);
        background-color: var(--color-bg-actionable-secondary-hover);
        width: 100%;
        cursor: pointer;
        border: none;
        outline: none;
        font-size: var(--fontsize-body);
        font-weight: bold;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .close:focus:not(:hover) {
        border: var(--border-medium) dotted !important;
        border-color: var(--color-border-focus) !important;
    }

    .close-text {
        margin-right: var(--space-1x);
    }

    .header {
        margin-bottom: var(--space-2x5);
    }

    @media screen and (--mq-maxwidth-medium) {
        aside,
        .container {
            margin: 0 var(--space-4x);
        }
        .item-dropdown {
            display: flex;
            align-items: center;

            & :global(.dropdown) {
                min-width: 0;
            }

            & span {
                font-weight: bold;
                margin-right: var(--space-1x5);
                white-space: nowrap;
            }
        }

        .container {
            flex-direction: column;
        }
    }
</style>

<svelte:window bind:innerWidth={windowWidth} />
<div class="delivery" class:isBookmarkingInProgress>
    <div class="header">
        <button class="close" on:click={onClose} aria-label="Close overview">
            <span class="close-text">{__('Test overview')}</span>
            <Icon name="chevron-bottom-16" />
        </button>
    </div>
    <aside class="tab-bar" aria-label={__('Tasks status')}>
        <TabGroup tabs={taskTabs} {activeTab} on:change={onTabChange} />
        {#if smallWidth}
            <div class="item-dropdown">
                <span>{__('Question')}</span>
                <SearchableDropdown
                    options={deliveryContents}
                    allowGroupSelect={false}
                    groupValues="items"
                    groupLabel="group"
                    optionLabel="title"
                    allowEmpty={false}
                    multiple={false}
                    value={activeItem}
                    fullwidth
                    on:change={handleItemDropdownChange} />
            </div>
        {/if}
    </aside>
    <div class="container">
        <main>
            <div class="content">
                {#if isTableLoading}
                    <div class="block">
                        <Loading lite />
                    </div>
                {:else}
                    <DeliveryTable
                        {taskGroup}
                        {totalScoreText}
                        {isBookmarkingInProgress}
                        on:bookmark={onBookmark}
                        on:rowClick={onTaskClick}
                        {scrollIntoCurrentTask}
                        activeTaskId={taskId}>
                        {#if totalPages > 1}
                            <Pagination on:changePage={handlePagination} {currentPage} {totalPages} />
                        {/if}
                    </DeliveryTable>
                {/if}
            </div>
        </main>
        {#if !smallWidth}
            <SideItemBar contents={deliveryContents} {activeItem} {handleChangeActiveItem} />
        {/if}
    </div>
</div>
<InactiveProjectDialog open={isProjectInactive} on:confirm-inactive={handleConfirmInactive} />
