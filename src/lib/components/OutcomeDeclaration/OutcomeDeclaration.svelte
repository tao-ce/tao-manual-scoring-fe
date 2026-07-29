<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script context="module">
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2025 (original work) Open Assessment Technologies SA;
    /**
     * Outcome declaration types.
     * @readonly
     * @enum {Symbol}
     */
    export const OUTCOME_DECLARATION_TYPES = Object.freeze({
        NORMAL: Symbol('OUTCOME_DECLARATION_TYPES.NORMAL'),
        SCALE: Symbol('OUTCOME_DECLARATION_TYPES.SCALE')
    });
</script>

<script>
    import { createEventDispatcher } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { ScoringInput, SearchableDropdown } from '@oat-sa-private/ui-components';

    /**
     * @typedef {Object} InputOptions
     * @property {string} [placeholder] - Placeholder text for the input.
     * @property {Array} [options] - Options for dropdown inputs.
     */

    /**
     * @prop {string} interpretation - Short interpretation text.
     * @prop {string} longInterpretation - Detailed interpretation text or URL.
     * @prop {string} qtiIdentifier - Identifier for the QTI item.
     * @prop {boolean} disabled - Whether the input is disabled.
     * @prop {Symbol} type - Type of the outcome declaration (NORMAL or SCALE).
     * @prop {InputOptions} inputOptions - Options for the input component.
     */
    export let interpretation;
    export let longInterpretation;
    export let qtiIdentifier;
    export let disabled = false;
    export let type = OUTCOME_DECLARATION_TYPES.NORMAL;
    export let inputOptions = {};

    const dispatch = createEventDispatcher();

    /**
     * Dispatches a change event with the updated score value.
     * @param {CustomEvent<{ value: string }>} event - The change event.
     */
    function handleScoreChange({ detail }) {
        const value = +detail.value;
        const score = isNaN(value) ? void 0 : value;
        dispatch('change', { value: score });
    }

    /**
     * Dispatches a change event with the updated scale value.
     * @param {CustomEvent<{ value: string }>} event - The change event.
     */
    function handleScaleChange({ detail }) {
        const score = detail?.value || void 0;
        dispatch('change', { value: score });
    }

    /**
     * Dispatches a criteriaClick event with the criteria URL.
     * @param {string} href - The URL of the criteria.
     */
    function onCriteriaClick(href) {
        dispatch('criteria-click', { href });
    }
</script>

<style>
    .outcome-declaration-header {
        margin: var(--space-3x) 0 var(--space-2x);

        & .outcome-declaration__title {
            margin: 0;
        }
        & .score-criteria {
            font-size: var(--fontsize-body-s);
            font-weight: normal;
            text-decoration: underline;
            cursor: pointer;
        }
    }
</style>

<div class="outcome-declaration">
    {#if interpretation}
        <div class="outcome-declaration-header">
            <h5 class="outcome-declaration__title">{interpretation}</h5>
            {#if longInterpretation}
                <a
                    class="score-criteria"
                    class:disabled
                    aria-label={__('see criteria for %s', qtiIdentifier)}
                    href={longInterpretation}
                    role="button"
                    on:click|preventDefault={() => onCriteriaClick(longInterpretation)}
                >
                    {__('see scoring criteria')}
                </a>
            {/if}
        </div>
    {/if}
    {#if type === OUTCOME_DECLARATION_TYPES.SCALE}
        <SearchableDropdown
            {...inputOptions}
            name={qtiIdentifier}
            {disabled}
            on:change={handleScaleChange}
        />
    {:else if type === OUTCOME_DECLARATION_TYPES.NORMAL}
        <ScoringInput
            {...inputOptions}
            name={qtiIdentifier}
            {disabled}
            on:change={handleScoreChange}
        />
    {/if}
</div>