<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020-2025 (original work) Open Assessment Technologies SA ;
    import { IconBarButton, Button } from '@oat-sa-private/ui-elements';
    import { __ } from '@oat-sa-private/ui-core';
    import { Breadcrumb, ModalDialog } from '@oat-sa-private/ui-components';
    import { breakpoints } from '@oat-sa-private/ui-identity';
    import { createEventDispatcher } from 'svelte';
    import SubmitDialog from './SubmitDialog';
    import LiveSaveIndicator from '@oat-sa-private/ui-components/livesave/LiveSaveIndicator.svelte';

    export let isSubmitEnabled = false;
    export let isDeliveryOverviewOpen = false;
    let open = false;
    let submitButtonWidth = 0;
    let exitTarget = '';

    const handleSubmit = () => {
        open = true;
    };

    export let onExit = () => {};
    export let taskHeaderBreadcrumbItems;
    export let showBackButton = true;

    const backButtonLabel = __('Back');
    const EXIT_DIALOG_SAVE_KEY = 'save';
    const buttons = [
        {
            key: 'cancel',
            label: __('continue grading'),
            skin: 'secondary'
        },
        {
            key: EXIT_DIALOG_SAVE_KEY,
            label: __('save and leave'),
            autoClose: 'false',
            initialFocus: 'true'
        }
    ];
    let exitDialogOpen = false;
    let dialogCaller;
    let windowWidth;

    $: smallWidth = windowWidth <= breakpoints.width.medium + 1;

    $: breadcrumb = taskHeaderBreadcrumbItems?.length ? [...taskHeaderBreadcrumbItems, { label: __('Score') }] : [];

    const dispatch = createEventDispatcher();

    let highlighterShown = false;

    $: highlighterLabel = highlighterShown ? __('Hide highlighter') : __('Show highlighter');

    function onClickHighlighter() {
        highlighterShown = !highlighterShown;

        dispatch('highlighter', { show: highlighterShown });
    }
    function onBackClick() {
        exitDialogOpen = true;
    }
    function onBreadcrumbClick(e) {
        const { href } = e.target;

        if (href) {
            exitTarget = href;
            exitDialogOpen = true;
        }
    }
    function onCancelExit() {
        exitDialogOpen = false;
        exitTarget = '';
    }
    function onDialogAction(e) {
        if (e.detail.key === EXIT_DIALOG_SAVE_KEY) {
            onExit(exitTarget);
        }
    }
</script>

<style>
    nav {
        display: flex;
        align-items: center;
        flex-shrink: 1;
        overflow-x: hidden;

        & :global(.breadcrumbs + .livesave) {
            margin-inline-start: 1.5rem;
        }
    }

    .tools-container {
        display: flex;
        position: absolute;
        top: 0;
        right: calc( var(--submit-button-width) + var(--space-1x) );
    }
    .link {
        color: var(--color-text-default);
    }
    .breadcrumbs {
        margin-inline-start: var(--space-1x);
        text-overflow: ellipsis;
        overflow-x: hidden;

        & :global(.separator) {
            line-height: 3.5rem; /* align separator vertical middle */
        }
    }
    .submit {
        margin-inline-start: auto;
    }
</style>

<svelte:window bind:innerWidth={windowWidth} />
<div class="task-header">
    <nav label={__('Main navigation')} aria-label={__('Scores')}>
        {#if showBackButton}
            <div class="back-button" bind:this={dialogCaller}>
                <IconBarButton label={backButtonLabel} size="base-24" icon="arrow-left-24" on:click={onBackClick} />
                <ModalDialog
                    on:open
                    on:close={onCancelExit}
                    on:action={onDialogAction}
                    heading={__('Are you sure you want to leave?')}
                    message={__("Your grades will be saved and you'll be able to resume grading at a later time.")}
                    open={exitDialogOpen}
                    caller={dialogCaller}
                    {buttons} />
            </div>
        {/if}
        {#if breadcrumb}
            <div class="breadcrumbs">
                <Breadcrumb items={breadcrumb} let:item>
                    {#if item.href}
                        <a href={item.href} on:click|preventDefault={onBreadcrumbClick} class="link">{item.label}</a>
                    {:else}<span>{item.label}</span>{/if}
                </Breadcrumb>
            </div>
        {/if}
        <LiveSaveIndicator namespace="autosave" withTime={true} />
        <div class="submit" bind:offsetWidth={submitButtonWidth}>
            <Button
                shape={smallWidth ? 'circular' : 'pill'}
                size="small"
                label={smallWidth ? '' : __('Send scores')}
                ariaLabel={__('Send scores')}
                icon="submit-16"
                iconSide="right"
                skin="primary"
                on:click={handleSubmit}
                disabled={!isSubmitEnabled} />
        </div>
    </nav>
    <div class="tools-container" label={__('Tools')} aria-label={__('Tools')} style={`--submit-button-width:${submitButtonWidth}px`}>
        <div class="highlighter" class:hidden={isDeliveryOverviewOpen}>
            <IconBarButton
                label={highlighterLabel}
                size="base-24"
                icon="highlighter-24"
                on:click={onClickHighlighter} />
        </div>
    </div>
</div>

<SubmitDialog bind:open on:submitScores />
