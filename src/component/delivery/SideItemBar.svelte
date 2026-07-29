<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2022-2025 (original work) Open Assessment Technologies SA ;
    import { __ } from '@oat-sa-private/ui-core';
    export let contents = [];
    export let activeItem;
    export let handleChangeActiveItem = () => {};
</script>

<style>
    .items-bar {
        min-width: var(--sidebar-width);
        padding: var(--space-4x) var(--space-2x);
        background-color: var(--color-bg-info);
        overflow: auto;

        & ul {
            padding: 0 var(--space-3x);
        }

        & li {
            position: relative;
            list-style: none;
            margin-bottom: var(--space-1x);

            & a {
                color: var(--color-text-feedback);
                cursor: pointer;
                text-decoration: none;
            }
        }

        & .active {
            font-weight: 700;
        }

        & .active:before {
            content: ' ';
            position: absolute;
            height: var(--space-half);
            width: var(--space-1x5);
            background: var(--color-bg-active);
            top: 50%;
            left: calc(-1 * var(--space-3x));
            display: block;
            transform: translateY(-50%);
        }
    }
</style>

<aside class="items-bar" aria-label={__('Delivery contents')}>
    {#each contents as content}
        {#if content.items.length > 0}
        <h5>{content.group}</h5>
        <ul>
            {#each content.items as item (`${item.id}_${item.deliveryId}`)}
                <li class:active={activeItem && activeItem.id === item.id && activeItem.deliveryId === item.deliveryId}>
                    <a href on:click|preventDefault={() => handleChangeActiveItem(item)}>{item.title}</a>
                </li>
            {/each}
        </ul>
        {/if}
    {/each}
</aside>
