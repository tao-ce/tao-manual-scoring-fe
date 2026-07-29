<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020-2025 (original work) Open Assessment Technologies SA ;

    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { debounce } from 'lodash';
    import { Textarea, Button, Checkbox, ButtonLink } from '@oat-sa-private/ui-elements';
    import { Loading, ModalOverlayBox } from '@oat-sa-private/ui-components';
    import { __ } from '@oat-sa-private/ui-core';
    import * as scoreSuggestionService from '../../services/scoreSuggestionService';
    import { getConfig } from '../../services/userConfigurationService';
    import { EFFECT_DURATIONS } from '../../constants/task';
    import {
        OUTCOME_DECLARATION_TYPES,
        default as OutcomeDeclaration
    } from '../../lib/components/OutcomeDeclaration/OutcomeDeclaration.svelte';

    const dispatch = createEventDispatcher();

    const { isSuggestedScoringEnabled, isMarkAsSuspiciousForCheatingEnabled, isMarkAsNotEnoughBasisForAssessment } =
        getConfig();

    /**
     * @prop {string} taskId - Task ID for the scoring form.
     * @prop {Array<Object>} outcomeDeclarations - Outcome declarations for the scoring form.
     * @prop {Object} deliveryExecutionScoring - Delivery execution scoring details.
     * @prop {string} [note=''] - Note for the scoring form.
     * @prop {Array<Object>} [previousScores=[]] - Previous scores for the task.
     * @prop {string} [notePlaceholder] - Placeholder text for the note input.
     * @prop {boolean} [showSelectionStatus=false] - Whether to show selection status.
     * @prop {boolean} [disabled=false] - Whether the form is disabled.
     * @prop {boolean} [hideNoteBox=false] - Whether to hide the note box.
     * @prop {string} [notEnoughBasisNote] - The "not enough basis for assessment" note
     * @prop {string} [suspiciousNote] - The "suspicious of cheating" note
     */
    export let taskId;
    export let outcomeDeclarations;
    export let deliveryExecutionScoring;
    export let note = '';
    export let previousScores = [];
    export let notePlaceholder;
    export let showSelectionStatus = false;
    export let disabled = false;
    export let hideNoteBox = false;
    export let isAdminReviewMode = false;
    export let notEnoughBasisNote = '';
    export let suspiciousNote = '';

    let isLoadingSuggestion = false;
    let showScoreSuggestion = false;
    let scoreSuggestion = null;
    let applyToAllDeclarationValue = null;

    const maxNoteLength = 500;

    $: chars = note.length;
    $: isSuspicious = deliveryExecutionScoring?.suspicious;
    $: isNotEnoughBasis = deliveryExecutionScoring?.notEnoughBasisForAssessment;
    // show score suggestion only if at least one outcome has a long interpretation (rubric)
    $: isScoreSuggestionAvailable = outcomeDeclarations.some(od => od.longInterpretation !== null);

    // split outcome declarations into item and CEFR types
    $: itemOutcomeDeclarations = outcomeDeclarations.filter(od => !od.scoringScale);
    $: scaleOutcomeDeclarations = outcomeDeclarations.filter(od => od.scoringScale);
    // check if every scale outcome declaration scale.uri is the same and the array is not empty
    $: showApplyToAllScales =
        scaleOutcomeDeclarations.length > 0 &&
        scaleOutcomeDeclarations.every((od, _, arr) => od.scoringScale.uri === arr[0].scoringScale.uri);

    $: applyToAllDeclaration = showApplyToAllScales
        ? {
              ...scaleOutcomeDeclarations[0],
              get value() {
                  if (
                      !scaleOutcomeDeclarations.length ||
                      !scaleOutcomeDeclarations.every(od => od.value === applyToAllDeclarationValue)
                  ) {
                      applyToAllDeclarationValue = null;
                  }
                  return applyToAllDeclarationValue;
              }
          }
        : null;

    /**
     * Get the selected score for an outcome declaration.
     * @param {Object} outcomeDeclaration - The outcome declaration object.
     * @returns {string|undefined} The selected score as a string, or undefined if no score is selected.
     */
    function getSelectedScore(outcomeDeclaration) {
        let selectedScore;
        if (outcomeDeclaration.value !== null) {
            selectedScore = outcomeDeclaration.value.toString();
        }
        return selectedScore;
    }

    /**
     * Generate scores for a given range.
     * @param {string} id - The ID of the outcome declaration.
     * @param {number} from - The starting score.
     * @param {number} to - The ending score.
     * @returns {Array<Object>} An array of score objects.
     */
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

    /**
     * Fetches a score suggestion for the current task.
     * @async
     * @returns {Promise<void>} Resolves when the score suggestion is fetched.
     */
    async function getScoreSuggestion() {
        isLoadingSuggestion = true;
        scoreSuggestion = await scoreSuggestionService.getScoringSuggestion(taskId);
        showScoreSuggestion = true;
        isLoadingSuggestion = false;
    }

    /**
     * Handles the score suggestion modal actions.
     * @param {Object} params - Parameters for the action.
     * @param {string} params.key - The action key (e.g., 'ok', 'retry', 'hide').
     */
    async function handleScoreSuggestion(params) {
        const { key } = params;
        if (key === 'ok') {
            for (const suggestedScore of scoreSuggestion) {
                const declaration = outcomeDeclarations.find(od => od.qtiIdentifier === suggestedScore.qtiIdentifier);
                if (!declaration) {
                    return;
                }
                const onScoreChange = createScoreChangeHandler(declaration.outcomeDeclaration);
                onScoreChange({ detail: { value: suggestedScore.suggestedScore } });
            }
        } else if (key === 'retry') {
            // to avoid visually overlaping buttons
            setTimeout(() => {
                getScoreSuggestion();
            }, 0);
        }
        showScoreSuggestion = false;
    }

    /**
     * Displays the score suggestion modal.
     */
    function showScoreSuggestionModal() {
        showScoreSuggestion = true;
    }

    /**
     * Creates a handler for score changes for a specific outcome declaration.
     * @param {string} outcomeDeclarationId - The ID of the outcome declaration.
     * @returns {Function} The score change handler.
     */
    function createScoreChangeHandler(outcomeDeclarationId) {
        return function handleChange({ detail }) {
            const value = +detail.value;
            const score = isNaN(value) ? null : value;
            dispatch('score-change', { score, outcomeDeclarationId });
        };
    }

    /**
     * Handles changes to all scale outcome declarations.
     * @param {CustomEvent<{ value: string }>} event - The scale change event.
     */
    function handleAllScaleChange({ detail }) {
        const value = +detail.value;
        const score = isNaN(value) ? null : value;
        applyToAllDeclarationValue = value;
        for (const declaration of scaleOutcomeDeclarations) {
            dispatch('score-change', { score, outcomeDeclarationId: declaration.outcomeDeclarationId });
        }
    }

    /**
     * Dispatches an event to toggle the criteria view.
     * @param {CustomEvent} event - Event with href in detail.
     */
    function onCriteriaClick(event) {
        const formatUrl = event.detail.href;
        dispatch('toggleCriteriaView', { url: formatUrl, show: true });
    }

    /**
     * Dispatches a note change event.
     */
    function onNoteChange(evt) {
        if (!disabled) {
            dispatch('note-change', evt.detail.value);
        }
    }

    /**
     * Toggles the suspicious state and dispatches a suspicious change event.
     */
    function onSuspiciousCheckBoxChange() {
        isSuspicious = !isSuspicious;
        onSuspiciousChange();
    }

    function onSuspiciousChange() {
        if (!isSuspicious) {
            suspiciousNote = '';
        }

        dispatch('suspicious-change', {
            suspicious: isSuspicious,
            suspiciousNote: suspiciousNote
        });
    }

    function onNotEnoughBasisCheckBoxChange() {
        isNotEnoughBasis = !isNotEnoughBasis;
        onNotEnoughBasisChange();
    }

    function onNotEnoughBasisChange() {
        if (!isNotEnoughBasis) {
            notEnoughBasisNote = '';
        }

        dispatch('not-enough-basis-change', {
            notEnoughBasisForAssessment: isNotEnoughBasis,
            notEnoughBasisForAssessmentNote: notEnoughBasisNote
        });
    }

    /**
     * Generates input options for a given outcome declaration type and declaration.
     * @param {Symbol} declarationType - The type of the outcome declaration (e.g., NORMAL, SCALE).
     * @param {Object} declaration - The outcome declaration object.
     * @returns {Object} The input options for the outcome declaration.
     */
    function getInputOptions(declarationType, declaration) {
        switch (declarationType) {
            case OUTCOME_DECLARATION_TYPES.SCALE:
                return {
                    options: Object.entries(declaration.scoringScale.scale).map(([key, value]) => ({
                        label: value,
                        value: +key
                    })),
                    get value() {
                        return this.options.find(item => item.value === declaration.value);
                    },
                    optionLabel: 'label',
                    trackBy: 'value',
                    multiple: false,
                    searchable: false,
                    fullwidth: true
                };
            case OUTCOME_DECLARATION_TYPES.NORMAL:
            default:
                return {
                    items: generateScores(
                        declaration.outcomeDeclarationId,
                        declaration.minimumValue,
                        declaration.maximumValue
                    ),
                    selected: getSelectedScore(declaration),
                    showSelectionStatus
                };
        }
    }

    onMount(() => {
        if (scaleOutcomeDeclarations.every(od => od.value === scaleOutcomeDeclarations[0].value)) {
            applyToAllDeclarationValue = scaleOutcomeDeclarations[0]?.value;
        }
    });

    const debouncedOnSuspiciousChange = debounce(onSuspiciousChange, 300);
    const debouncedOnNotEnoughBasisChange = debounce(onNotEnoughBasisChange, 300);
    const debouncedOnNoteChange = debounce(onNoteChange, 300);
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

        & :global(textarea[name='note']) {
            background: var(--color-gs-light);
            border: var(--border-medium) solid var(--color-border-default);
        }

        & :global(textarea[name='suspicious-note']) {
            background: var(--color-gs-light);
            border: var(--border-medium) solid var(--color-border-default);
        }

        & :global(textarea[name='not-enough-basis-note']) {
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
    {#each itemOutcomeDeclarations as declaration}
        <div class="score">
            <OutcomeDeclaration
                {...declaration}
                {disabled}
                type={OUTCOME_DECLARATION_TYPES.NORMAL}
                inputOptions={getInputOptions(OUTCOME_DECLARATION_TYPES.NORMAL, declaration)}
                on:criteria-click={onCriteriaClick}
                on:change={createScoreChangeHandler(declaration.outcomeDeclarationId)}
            />
        </div>
    {/each}
    {#if scaleOutcomeDeclarations.length > 0}
        <div class="score">
            {#if showApplyToAllScales}
                <OutcomeDeclaration
                    interpretation={__('Apply score to all')}
                    qtiIdentifier={scaleOutcomeDeclarations.map(od => od.qtiIdentifier).join('-')}
                    {disabled}
                    type={OUTCOME_DECLARATION_TYPES.SCALE}
                    inputOptions={getInputOptions(OUTCOME_DECLARATION_TYPES.SCALE, applyToAllDeclaration)}
                    on:criteria-click={onCriteriaClick}
                    on:change={handleAllScaleChange}
                />
                <hr />
            {/if}
            {#each scaleOutcomeDeclarations as declaration}
                <OutcomeDeclaration
                    {...declaration}
                    {disabled}
                    type={OUTCOME_DECLARATION_TYPES.SCALE}
                    inputOptions={getInputOptions(OUTCOME_DECLARATION_TYPES.SCALE, declaration)}
                    on:criteria-click={onCriteriaClick}
                    on:change={createScoreChangeHandler(declaration.outcomeDeclarationId)}
                />
            {/each}
        </div>
    {/if}

    {#if isMarkAsSuspiciousForCheatingEnabled && !hideNoteBox && deliveryExecutionScoring}
        <Checkbox
            label={__('Suspected of cheating')}
            name="is-suspicious"
            on:change={onSuspiciousCheckBoxChange}
            bind:checked={isSuspicious}
            {disabled}
        />
        {#if isSuspicious}
            <div in:slide={{ duration: EFFECT_DURATIONS.SLIDE }} out:slide={{ duration: EFFECT_DURATIONS.SLIDE }}>
                <Textarea
                    hiddenLabel={__('Note')}
                    name="suspicious-note"
                    placeholder={__('Comment (optional)')}
                    resizable="vertical"
                    maxlength={maxNoteLength}
                    fullwidth
                    {disabled}
                    on:change={debouncedOnSuspiciousChange}
                    bind:value={suspiciousNote}
                />
                <p class="counter">
                    <strong>{maxNoteLength - (suspiciousNote?.length ?? 0)}</strong>
                    {__('of %d characters remaining', maxNoteLength)}
                </p>
            </div>
        {:else if !disabled}
            <ButtonLink title={__('Comment (optional)')} on:click={onSuspiciousCheckBoxChange} />
        {/if}
    {/if}

    {#if isMarkAsNotEnoughBasisForAssessment && !hideNoteBox && deliveryExecutionScoring}
        <Checkbox
            label={__('Not Enough Basis for Assessment')}
            name="is-not-enough-basis"
            on:change={onNotEnoughBasisCheckBoxChange}
            bind:checked={isNotEnoughBasis}
            {disabled}
        />
        {#if isNotEnoughBasis}
            <div in:slide={{ duration: EFFECT_DURATIONS.SLIDE }} out:slide={{ duration: EFFECT_DURATIONS.SLIDE }}>
                <Textarea
                    hiddenLabel={__('Note')}
                    name="not-enough-basis-note"
                    placeholder={isAdminReviewMode ? __('Comment') : __('Comment (optional)')}
                    resizable="vertical"
                    maxlength={maxNoteLength}
                    fullwidth
                    {disabled}
                    on:change={debouncedOnNotEnoughBasisChange}
                    bind:value={notEnoughBasisNote}
                    required={isAdminReviewMode}
                    customValidity={isAdminReviewMode && !notEnoughBasisNote?.trim() ? __('Type a note for this review') : ''}
                />
                <p class="counter">
                    <strong>{maxNoteLength - (notEnoughBasisNote?.length ?? 0)}</strong>
                    {__('of %d characters remaining', maxNoteLength)}
                </p>
            </div>
        {:else if !disabled}
            <ButtonLink title={isAdminReviewMode ? __('Comment') : __('Comment (optional)')} on:click={onNotEnoughBasisCheckBoxChange} />
        {/if}
    {/if}

    {#each previousScores as previousScore}
        {#if previousScore.note && ((isAdminReviewMode && previousScore.id === taskId) || !isAdminReviewMode)}
            <h5 class="field-header">{__("Scorer's note:")}</h5>
            <p class="note-text">{previousScore.note}</p>
        {/if}
    {/each}

    {#if (isAdminReviewMode && !disabled && !hideNoteBox) || (!isAdminReviewMode && !hideNoteBox)}
        <Textarea
            hiddenLabel={__('Note')}
            name="note"
            placeholder={notePlaceholder}
            resizable="vertical"
            maxlength={maxNoteLength}
            rows={4}
            fullwidth
            {disabled}
            on:change={debouncedOnNoteChange}
            value={note}
        />
        <p class="counter">
            <strong>{maxNoteLength - chars}</strong>
            {__('of %d characters remaining', maxNoteLength)}
        </p>
    {/if}
</form>
