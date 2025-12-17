<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2019-2020 (original work) Open Assessment Technologies SA ;

    import { __ } from '@oat-sa-private/ui-core';

    export let data;

    // For now we support only scoring and review mode => get just one of the previous scores
    let previousValue;

    $: if (data.previousValues) {
        previousValue = data.previousValues[0];
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

{#if data.value !== null}
    <div class="visually-hidden">{__('%s of %s', data.value, data.maximumValue)}</div>
    <span aria-hidden="true">{`${data.value} / ${data.maximumValue}`}</span>
    {#if typeof previousValue !== 'undefined' && previousValue !== data.value}
        <span class="crossed">({previousValue})</span>
    {/if}
{:else}
    <div class="visually-hidden">{__('No score added')}</div>
    <span aria-hidden="true">-</span>
{/if}
