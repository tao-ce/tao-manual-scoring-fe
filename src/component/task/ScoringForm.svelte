<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020-2024 (original work) Open Assessment Technologies SA ;

    import { createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { Textarea, Button, Checkbox, ButtonLink } from '@oat-sa-private/ui-elements';
    import { ScoringInput, Loading, ModalOverlayBox } from '@oat-sa-private/ui-components';
    import { __ } from '@oat-sa-private/ui-core';
    import * as scoreSuggestionService from '../../services/scoreSuggestionService';
    import * as userConfigurationService from '../../services/userConfigurationService';
    import { EFFECT_DURATIONS } from '../../constants/task';

    const dispatch = createEventDispatcher();

    const { isSuggestedScoringEnabled, isMarkAsSuspiciousForCheatingEnabled } = userConfigurationService.getConfig();

    export let taskId;
    export let outcomeDeclarations;
    export let deliveryExecutionScoring;
    export let note = '';
    export let previousScores = [];
    export let notePlaceholder;
    export let showSelectionStatus = false;
    export let disabled = false;
    export let hideNoteBox = false;

    let isLoadingSuggestion = false;
    let showScoreSuggestion = false;
    let scoreSuggestion = null;
    let suspiciousNote = deliveryExecutionScoring?.suspiciousNote || '';

    const maxNoteLength = 500;

    $: chars = note.length;
    $: isSuspicious = deliveryExecutionScoring?.suspicious;
    // show score suggestion only if at least one outcome has a long interpretation (rubric)
    $: isScoreSuggestionAvailable = outcomeDeclarations.some(od => od.longInterpretation !== null);

    function getSelectedSore(outcomeDeclaration) {
        let selectedScore;
        if (outcomeDeclaration.value !== null) {
            selectedScore = outcomeDeclaration.value.toString();
        }
        return selectedScore;
    }

    function generateScores(id, from, to) {
        const scoreValues = [];
        const scoresForCriterion = previousScores.map(ps => ps.scores.find(s => s.outcomeDeclarationId === id));

        for (let i = from; i <= to; i++) {
            scoreValues.push({
                label: i.toString(),
                value: i.toString(),
                marked: !!scoresForCriterion.find(sc => sc.value === i)
            });
        }
        return scoreValues;
    }

    async function getScoreSuggestion() {
        isLoadingSuggestion = true;
        scoreSuggestion = await scoreSuggestionService.getScoringSuggestion(taskId);
        showScoreSuggestion = true;
        isLoadingSuggestion = false;
    }

    async function handleScoreSuggestion(params) {
        const { key } = params;
        if (key === 'ok') {
            for (const suggestedScore of scoreSuggestion) {
                const index = outcomeDeclarations.findIndex(od => od.qtiIdentifier === suggestedScore.qtiIdentifier);
                if (index > -1) {
                    onScoreChange({ detail: { value: suggestedScore.suggestedScore } }, index);
                }
            }
        } else if (key === 'retry') {
            // to avoid visually overlaping buttons
            setTimeout(() => {
                getScoreSuggestion();
            }, 0);
        }
        showScoreSuggestion = false;
    }

    function showScoreSuggestionModal() {
        showScoreSuggestion = true;
    }

    function onScoreChange({ detail = {} }, index) {
        const value = +detail.value;
        const score = isNaN(value) ? null : value;
        dispatch('score-change', { index, score });
    }

    function onCriteriaClick(url) {
        dispatch('toggleCriteriaView', { url, show: true });
    }

    function onNoteChange() {
        dispatch('note-change');
    }

    function onSuspiciousChange() {
        isSuspicious = !isSuspicious;
        onSuspiciousFieldsChange();
    }

    function onSuspiciousFieldsChange() {
        if (!isSuspicious) {
            suspiciousNote = '';
        }
        dispatch('suspicious-change', { suspicious: isSuspicious, suspiciousNote: suspiciousNote });
    }
</script>

<style>
    form {
        padding: 0 var(--space-3x);

        & div {
            margin-bottom: var(--space-4x);
        }

        & .note-text {
            font-size: var(--fontsize-body-s);
        }

        & .score {
            margin-top: var(--space-1x);

            & :global(button) {
                margin: var(--space-1x) 0 0 0;
            }
        }

        & .score-header {
            display: flex;
            align-items: center;
            margin: var(--space-1x) 0;
        }

        & .field-header {
            margin: 0 var(--space-1x) 0 0;
            font-size: var(--fontsize-body-s);
        }

        & .loading-block {
            margin-bottom: var(--space-5x);
        }

        & .score-criteria {
            flex-shrink: 0;
            white-space: nowrap;
            text-decoration: underline;
            font-size: var(--fontsize-body-s);
            cursor: pointer;
            margin-left: 0.5rem;

            &.disabled {
                color: var(--color-lightui-disabled);
            }
        }

        & .score-suggestion {
            margin: var(--space-1x) 0 var(--space-2x);
            display: flex;
            justify-content: center;
        }

        & .score-suggestion-modal {
            margin: var(--space-2x) 0;
            display: flex;
            justify-content: space-evenly;
        }

        & .score-suggestion-modal-wrapper {
            & ul {
                margin-bottom: 3rem;
            }
        }

        & .counter {
            color: var(--color-text-feedback);
        }

        & :global(.dialog.inverted) {
            color: inherit;
            background-color: inherit;
            border: 1px solid;
            min-width: auto;

            & :global(button) {
                margin-top: var(--space-1x);
                font-size: var(--fontsize-body-s);
            }
        }

        & :global(.overlay-box-header .heading-container > h3) {
            font-size: var(--fontsize-heading-l) !important;
        }

        & :global(textarea[name="note"]) {
            background: var(--color-gs-light);
            border: var(--border-medium) solid var(--color-border-default);
        }

        & :global(textarea[name="suspicious-note"]) {
            background: var(--color-gs-light);
            border: var(--border-medium) solid var(--color-border-default);
        }

        & :global(.button-link) {
            margin-bottom: 0.75rem;
        }

        & h4 {
            margin: var(--space-1x5) 0;
        }

        & .feedback {
            background-color: var(--color-success-alternative-bg);
            font-style: italic;
            padding: 1rem;
        }
    }
</style>

<form>
    {#if isSuggestedScoringEnabled}
        {#if isLoadingSuggestion}
            <div class="loading-block">
                <Loading size="small" />
            </div>
        {:else if scoreSuggestion}
            <ModalOverlayBox
                bind:open={showScoreSuggestion}
                heading={__('Suggested scoring explanation')}
                width="75%"
                headingLevel={3}
                startActions={[]}
            >
                <div class="score-suggestion-modal-wrapper">
                    <ul>
                        {#each scoreSuggestion as { qtiIdentifier, suggestedScore, explanation, feedback }}
                            <li>
                                <h4>{qtiIdentifier}: {suggestedScore}</h4>
                                <p>{explanation}</p>
                                <p class="feedback">{feedback}</p>
                            </li>
                        {/each}
                    </ul>
                    <div class="score-suggestion-modal">
                        <Button
                            skin="secondary"
                            label={__('Try again')}
                            ariaLabel={__('Try again')}
                            shape="pill"
                            on:click={() => handleScoreSuggestion({ key: 'retry' })}
                        />
                        <Button
                            skin="primary"
                            label={__('Use the score')}
                            ariaLabel={__('Use the score')}
                            shape="pill"
                            on:click={() => handleScoreSuggestion({ key: 'ok' })}
                        />
                        <Button
                            skin="secondary"
                            label={__('Discard')}
                            ariaLabel={__('Discard')}
                            shape="pill"
                            on:click={() => handleScoreSuggestion({ key: 'hide' })}
                        />
                    </div>
                </div>
            </ModalOverlayBox>
            <div class="score-suggestion" in:fade={{ duration: EFFECT_DURATIONS.FADE }} out:fade={{ duration: 0 }}>
                <Button
                    inverted
                    skin="secondary"
                    label={__('Show score suggestion')}
                    ariaLabel={__('Show score suggestion')}
                    on:click={showScoreSuggestionModal}
                />
            </div>
        {:else if isScoreSuggestionAvailable}
            <div class="score-suggestion" in:fade={{ duration: EFFECT_DURATIONS.FADE }}>
                <Button
                    skin="primary"
                    label={__('Get score suggestion')}
                    ariaLabel={__('Get score suggestion')}
                    on:click={getScoreSuggestion}
                />
            </div>
        {/if}
    {/if}
    {#each outcomeDeclarations as declaration, i}
        <div class="score">
            {#if declaration.interpretation}
                <div class="score-header">
                    <h5 class="field-header">{declaration.interpretation}</h5>
                    {#if declaration.longInterpretation}
                        <a
                            class="score-criteria"
                            class:disabled
                            ariaLabel={__('see criteria for %s', declaration.qtiIdentifier)}
                            href={declaration.longInterpretation}
                            role="button"
                            on:click|preventDefault={() => onCriteriaClick(declaration.longInterpretation)}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {__('see criteria')}
                        </a>
                    {/if}
                </div>
            {/if}
            <ScoringInput
                name={declaration.qtiIdentifier}
                items={generateScores(
                    declaration.outcomeDeclarationId,
                    declaration.minimumValue,
                    declaration.maximumValue
                )}
                selected={getSelectedSore(declaration)}
                {showSelectionStatus}
                {disabled}
                on:change={e => onScoreChange(e, i)}
            />
        </div>
    {/each}

    {#if isMarkAsSuspiciousForCheatingEnabled && !hideNoteBox && deliveryExecutionScoring}
        <Checkbox
            label={__('Suspected of cheating')}
            name="is-suspicious"
            on:change={onSuspiciousChange}
            bind:checked={isSuspicious}
        />
        {#if isSuspicious}
            <div in:slide={{ duration: EFFECT_DURATIONS.SLIDE }} out:slide={{ duration: EFFECT_DURATIONS.SLIDE }}>
                <Textarea
                    hiddenLabel={__('Note')}
                    name="suspicious-note"
                    placeholder={__('Comment optional')}
                    resizable="vertical"
                    maxlength={maxNoteLength}
                    fullwidth
                    {disabled}
                    on:change={onSuspiciousFieldsChange}
                    bind:value={suspiciousNote}
                />
                <p class="counter"><strong>{maxNoteLength - suspiciousNote.length}</strong> {__('of %d characters remaining', maxNoteLength)}</p>
            </div>
        {:else}
            <ButtonLink
                title={__('Comment (optional)')}
                on:click={onSuspiciousChange}
            />
        {/if}
    {/if}

    {#each previousScores as previousScore}
        {#if previousScore.note}
            <h5 class="field-header">{__("Scorer's note:")}</h5>
            <p class="note-text">{previousScore.note}</p>
        {/if}
    {/each}

    {#if !hideNoteBox}
        <Textarea
            hiddenLabel={__('Note')}
            name="note"
            placeholder={notePlaceholder}
            resizable="vertical"
            maxlength={maxNoteLength}
            rows={4}
            fullwidth
            {disabled}
            on:change={onNoteChange}
            bind:value={note}
        />
        <p class="counter"><strong>{maxNoteLength - chars}</strong> {__('of %d characters remaining', maxNoteLength)}</p>
    {/if}
</form>
