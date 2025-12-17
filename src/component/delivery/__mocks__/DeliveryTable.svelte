<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
</script>

<style>
</style>

<div>
    Delivery Table
    <slot />

    <div
        data-testid={'DeliveryTable'}
        on:click={e => {
            const { name, ...options } = e.detail;
            dispatch(name, options);
        }}
    />
</div>
