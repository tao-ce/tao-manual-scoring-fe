<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2025 (original work) Open Assessment Technologies SA ;
    import { REVIEW_MESSAGES } from '@/constants/scoring-project';

    /**
     * @typedef {Object} ScorerScore
     * @property {string} label - The scorer's label
     * @property {Array<{value: number|string}>} [outcomeDeclarations] - Array of outcome declarations with score values
     */

    /**
     * @type {ScorerScore[]}
     */
    export let scores = [];

    /**
     * Computes the display value for a scorer by combining the outcome score and review messages
     * @param {ScorerScore} scorer - The scorer object containing outcomeDeclarations and deliveryExecutionScoring
     * @returns {string} Formatted display value with score and messages, or '-' if no values exist
     */
    const getScorerValue = scorer => {
        let stringValueParts = [];
        const outcomeDeclarationsWithValues = (scorer.outcomeDeclarations ?? []).filter(
            od => od.value !== null && od.value !== void 0 && od.value !== '' && !isNaN(od.value)
        );
        const scaleOutcomeDeclarations = outcomeDeclarationsWithValues.filter(
            od => od.scoringScale
        );
        if (scaleOutcomeDeclarations.length) {
            const scaleOutcomeDeclarationWithMinValue = scaleOutcomeDeclarations.reduce((minOd, currentOd) => {
                const minValue = Number(minOd.value);
                const currentValue = Number(currentOd.value);
                return currentValue < minValue ? currentOd : minOd;
            }, scaleOutcomeDeclarations[0]);
            const { scoringScale, value } = scaleOutcomeDeclarationWithMinValue;
            stringValueParts.push(scoringScale.scale[value] ?? value);
        } else if (outcomeDeclarationsWithValues.length) {
            stringValueParts.push(Math.min(...outcomeDeclarationsWithValues.map(od => Number(od.value))));
        }
        for (const message in REVIEW_MESSAGES) {
            scorer?.deliveryExecutionScoring?.[message] && stringValueParts.push(REVIEW_MESSAGES[message]);
        }
        return (stringValueParts.length && stringValueParts.join(' - ')) || '-';
    };

    $: summaryItems = scores.map(scorer => ({
        label: scorer.label,
        value: getScorerValue(scorer)
    }));
</script>

<style>
    .summary-block {
        list-style-type: none;
        display: flex;
        column-gap: 10%;
        padding: 0 0 var(--space-2x);
        margin: 0 0 var(--space-1x5);
        border-bottom: 1px solid var(--color-gs-graphical-invert);

        &:last-child {
            padding: 0;
            margin: 0;
            border-bottom: none;
        }

        & .summary-item {
            display: flex;
            flex-direction: column;
        }

        & .summary-label {
            font-size: var(--fontsize-body-s);
            color: var(--color-gs-graphical-invert);
            text-transform: capitalize;
        }
        & .summary-value {
            font-size: var(--fontsize-body);
        }
    }
</style>

<ul class="summary-block">
    {#each summaryItems as summaryItem}
        <li class="summary-item">
            <span class="summary-label">{summaryItem.label}</span>
            <span class="summary-value">{summaryItem.value}</span>
        </li>
    {/each}
</ul>
