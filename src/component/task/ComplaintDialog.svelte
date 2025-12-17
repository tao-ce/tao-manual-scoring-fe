<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021 (original work) Open Assessment Technologies SA ;

    import { createEventDispatcher } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { IconBarButton, Textarea, Label, Button, Feedback } from '@oat-sa-private/ui-elements';

    export let open = false;
    export let complaintTaskId;
    export let scorerName;
    export let item;
    export let error = '';

    let complaintNote = '';

    const maxChars = 500;
    const dispatch = createEventDispatcher();

    function onClose() {
        open = false;
        dispatch('close');
    }

    function onAction() {
        dispatch('action', { complaintTaskId, complaintNote });
    }
</script>

<style>
    .dialog {
        height: 100%;
        overflow: auto;
        display: flex;
        flex-flow: column;

        &.close {
            display: none;
        }

        & .content {
            display: flex;
            flex-direction: column;
            max-width: 78rem;
            padding: var(--space-2x) var(--space-3x);
            margin: auto;
        }

        & .warning {
            margin-bottom: var(--space-4x);
        }

        & .bottom-bar {
            display: flex;
            justify-content: flex-end;
            margin-top: var(--space-5x);

            & .action-button {
                margin-left: var(--space-1x);
            }
        }
    }
</style>

<div class="dialog" class:close={!open}>
    <IconBarButton label={__('Close Dialog')} size="base-24" icon="remove-16" on:click={onClose} />
    <div class="content">
        {#if error}
            <Feedback content={error} status="warning" fullwidth />
        {/if}
        <h3>{__('Report this question/scorer pair for non-compliant scoring?')}</h3>
        <p class="warning">
            {__('If you do, all the responses for that pair, %j and scorer %j will be subjected to a review task. This action cannot be undone.', item, scorerName)}
        </p>
        <Label fullwidth label={__('Note')}>
            <Textarea
                hiddenLabel={__('Note')}
                name="complaint-note"
                placeholder={__('Type a note for this report')}
                resizable="vertical"
                maxlength={maxChars}
                rows={7}
                fullwidth
                bind:value={complaintNote} />
        </Label>
        <div class="bottom-bar">
            <div class="action-button">
                <Button type="button" on:click={onClose} skin="secondary" shape="pill" label={__('Cancel')} />
            </div>
            <div class="action-button">
                <Button
                    type="button"
                    on:click={onAction}
                    disabled={!complaintNote}
                    skin="primary"
                    shape="pill"
                    label={__('Report and continue')} />
            </div>
        </div>
    </div>
</div>
