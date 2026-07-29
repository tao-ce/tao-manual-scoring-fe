<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
    import { ModalDialog, DataTable } from '@oat-sa-private/ui-components';
    import { __ } from '@oat-sa-private/ui-core';
    import totalScoreCell from './tablecells/TotalScoreCell';
    import hasNoteCell from './tablecells/HasNoteCell';
    import scoreCell from './tablecells/ScoreCell';
    import bookmarkCell from './tablecells/BookmarkCell';
    import ScoringViolationCell from './tablecells/ScoringViolationCell';
    import { afterUpdate, createEventDispatcher } from 'svelte';
    import { getConfig } from '@/services/ltiService';

    export let totalScoreText;
    export let activeTaskId;
    export let scrollIntoCurrentTask = false;
    export let taskGroup = {};
    export let isBookmarkingInProgress = false;

    $: hasScoringViolation = taskGroup && taskGroup.tasks && taskGroup.tasks.some(task => !!task.scoringViolation);
    let isDialogOpen = false;
    let dialogMessage = '';
    let dialogCaller;
    let tableElem;

    const dispatch = createEventDispatcher();

    afterUpdate(() => {
        if (!scrollIntoCurrentTask) {
            return;
        }
        const row = tableElem.querySelector('.currentrow');
        if (row === null) {
            return;
        }
        row.scrollIntoView();
    });

    const handleShowNote = e => {
        const { note, caller } = e.detail;
        isDialogOpen = true;
        dialogMessage = note;
        dialogCaller = caller;
    };

    const handleModalDialogClose = () => {
        isDialogOpen = false;
    };

    const getColumns = outcomeDeclarations => {
        if (!outcomeDeclarations) {
            return [];
        }

        const columns = outcomeDeclarations.map(od => ({
            title: od.interpretation || od.id,
            cellComponent: scoreCell
        }));

        columns.push({ title: totalScoreText, cellComponent: totalScoreCell });
        columns.push({ title: __('Bookmarked'), cellComponent: bookmarkCell, fitContent: true });
        columns.push({ title: __('Note'), cellComponent: hasNoteCell, fitContent: true });

        if (hasScoringViolation) {
            columns.push({ title: __('Report'), cellComponent: ScoringViolationCell, fitContent: true });
        }

        return columns;
    };

    const isScoringScaleOutcomeDeclaration = outcomeDeclaration => 'scoringScale' in outcomeDeclaration;

    const mapOutcomeDeclarationScoreFromScoringScale = outcomeDeclaration => {
        if (outcomeDeclaration.value === null || !(outcomeDeclaration.value in outcomeDeclaration.scoringScale.scale)) {
            return outcomeDeclaration;
        }

        const scoringScaleKeys = Object.keys(outcomeDeclaration.scoringScale.scale);
        const minScoringScaleIndex = scoringScaleKeys[0];
        const maxScoringScaleIndex = scoringScaleKeys[scoringScaleKeys.length - 1];

        outcomeDeclaration.value = outcomeDeclaration.scoringScale.scale[outcomeDeclaration.value];
        outcomeDeclaration.minimumValue = outcomeDeclaration.scoringScale.scale[minScoringScaleIndex];
        outcomeDeclaration.maximumValue = outcomeDeclaration.scoringScale.scale[maxScoringScaleIndex];

        outcomeDeclaration.previousValues = outcomeDeclaration.previousValues.map(previousValue => {
            if (previousValue !== null || previousValue in outcomeDeclaration.scoringScale.scale) {
                previousValue = outcomeDeclaration.scoringScale.scale[previousValue];
            }

            return previousValue;
        });

        return outcomeDeclaration;
    };

    const processOutcomeDeclarations = outcomeDeclarations =>
        outcomeDeclarations.map(outcomeDeclaration => {
            if (isScoringScaleOutcomeDeclaration(outcomeDeclaration)) {
                outcomeDeclaration = mapOutcomeDeclarationScoreFromScoringScale(outcomeDeclaration);
            }

            return outcomeDeclaration;
        });

    const getRows = tasks => {
        if (!tasks) {
            return [];
        }

        return tasks.map(task => {
            const ltiConfig = getConfig();
            const processedOutcomeDeclarations = processOutcomeDeclarations(task.outcomeDeclarations);

            const rows = processedOutcomeDeclarations.map(od => ({
                outcomeDeclaration: od,
                isReadOnly: ltiConfig.isReadOnly,
                isAdministrative: ltiConfig.isAdministrative
            }));

            rows.push({
                totalScore: task.totalScore,
                isScored: (ltiConfig.isReadOnly && ltiConfig.isAdministrative) ||
                    !task.outcomeDeclarations.some(od => od.value === null)
            });
            rows.push(task.bookmarked);
            rows.push(task.note);

            if (hasScoringViolation) {
                const { scoringViolation, itemTitle } = task;
                rows.push({ scoringViolation, itemTitle });
            }

            return rows;
        });
    };

    const isDisabled = () => isBookmarkingInProgress;
</script>

<style>
    .table {
        padding: var(--space-4x) var(--space-10x);
        position: relative;
    }

    .pagination-container {
        display: flex;
        justify-content: space-around;
    }
    .table :global(.currentrow) {
        background-color: var(--color-primaryPale);
    }

    @media screen and (--mq-maxwidth-medium) {
        .table {
            padding: 0;
        }
    }
</style>

<div class="table" bind:this={tableElem}>
    {#if taskGroup.tasks}
        <DataTable
                columns={getColumns(taskGroup.outcomeDeclarations)}
                rows={getRows(taskGroup.tasks)}
                rowKey={(row, rowIndex) => taskGroup.tasks[rowIndex].id}
                currentRow={taskGroup.tasks.findIndex(task => task.id === activeTaskId)}
                rowDisabled={isDisabled}
                clickableRows
                fullwidth
                on:rowClick={e => dispatch('rowClick', { id: e.detail.key, deliveryId: taskGroup.deliveryId })}
                on:bookmark
                on:shownote={handleShowNote}
        />

        <div class="pagination-container">
            <slot />
        </div>
    {/if}
</div>
<ModalDialog
        message={dialogMessage}
        open={isDialogOpen}
        caller={dialogCaller}
        on:close={handleModalDialogClose}
        anchoring="top right"
/>
