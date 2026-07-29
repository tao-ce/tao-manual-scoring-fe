<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2019-2020 (original work) Open Assessment Technologies SA ;

    import { __ } from '@oat-sa-private/ui-core';

    export let data;

    let visibleScoreText = '';

    // CEFR tests need a different representation for the scores
    let isScoringScaleOutcomeDeclaration = false;

    // For non-administrative and non-read-only we support only scoring and review mode => get just one of the previous scores
    // For administrative and readOnly, we consider that both scorer and reviewer have already scored, so we use both values
    let previousValue;

    const isAdministrativeReadOnly = data.isReadOnly && data.isAdministrative;
    const score = isAdministrativeReadOnly ? data.outcomeDeclaration.previousValues[0] : data.outcomeDeclaration.value;

    $: if (isAdministrativeReadOnly) {
        visibleScoreText = data.outcomeDeclaration.previousValues[0];
        previousValue = data.outcomeDeclaration.previousValues[1];
        isScoringScaleOutcomeDeclaration = 'scoringScale' in data.outcomeDeclaration;
    } else {
        if (data.outcomeDeclaration.previousValues) {
            previousValue = data.outcomeDeclaration.previousValues[0];
            isScoringScaleOutcomeDeclaration = 'scoringScale' in data.outcomeDeclaration;
        }
    }

    $: {
        if (isScoringScaleOutcomeDeclaration) {
            visibleScoreText = __('%s (max: %s)', score, data.outcomeDeclaration.maximumValue);
        } else {
            visibleScoreText = `${score} / ${data.outcomeDeclaration.maximumValue}`;
        }
    }
</script>

<style>
    .crossed {
        position: relative;
    }

    .crossed:before {
        position: absolute;
        content: '';
        left: 3px;
        top: 50%;
        right: 3px;
        border-top: 1px solid;
        border-color: inherit;
        transform: rotate(-45deg) translateY(-50%);
    }
</style>

{#if data.outcomeDeclaration.value !== null || isAdministrativeReadOnly}
    <div class="visually-hidden">{__('%s of %s', data.outcomeDeclaration.value, data.outcomeDeclaration.maximumValue)}</div>
    <span aria-hidden="true">{visibleScoreText}</span>
    {#if typeof previousValue !== 'undefined' && previousValue !== data.outcomeDeclaration.value}
        <span class="crossed">({previousValue})</span>
    {/if}
{:else}
    <div class="visually-hidden">{__('No score added')}</div>
    <span aria-hidden="true">-</span>
{/if}
