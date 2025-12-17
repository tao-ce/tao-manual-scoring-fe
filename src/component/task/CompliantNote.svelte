<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020-2021 (original work) Open Assessment Technologies SA ;

    import { Dialog } from '@oat-sa-private/ui-components';
    import { __ } from '@oat-sa-private/ui-core';

    export let note;
    export let title = __('Reported for non-compliance');
    export let itemTitle = '';
    export let scorerName = '';
    export let scorerUsername = '';

    let openHover = false;
    let openClick = false;

    $: dialogTitle = __(
        'The pairing of %j and scorer %j with the username %j has been reported for the following reasons:',
        itemTitle,
        scorerName,
        scorerUsername
    );

    function handleButtonClick() {
        openClick = !openClick;
        openHover = false;
    }

    function handleMouseEnter() {
        openHover = true;
    }

    function handleMouseLeave() {
        openHover = false;
    }
</script>

<style>
    button {
        background: var(--color-bg-warning);
        border: none;
        color: var(--color-text-actionable);
        padding: var(--space-half) var(--space-1x);
        display: flex;
        width: 100%;
        text-align: left;
        text-transform: uppercase;
        justify-content: space-between;
        font-size: var(--fontsize-body-xs);
    }

    .clickable {
        cursor: pointer;

        &:hover {
            background: var(--color-bg-warning-hover);
        }

        @add-mixin outline-focus;
        &:focus-visible::after {
            border-color: var(--color-bg-warning);
        }
    }

    .container {
        position: relative;
    }

    .dialog-container {
        position: absolute;
        z-index: var(--layer-1);
    }
</style>

<div class="container">
    <!-- this classname syntax is important for focus-visible -->
    <button
        tabindex={note ? 0 : -1}
        class={note && `clickable`}
        on:click={note && handleButtonClick}
        on:mouseenter={note && handleMouseEnter}
        on:mouseleave={note && handleMouseLeave}>
        <span class="text">{title}</span>
        {#if note}
            <span class="dots">...</span>
        {/if}
    </button>
    <div class="dialog-container">
        <Dialog open={openHover || openClick}>
            <p>{dialogTitle}</p>
            <p>{note}</p>
        </Dialog>
    </div>
</div>
