<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const onClick = () => {
        dispatch('closeDeliveryOverview');
    };
</script>

<div>Delivery overview <button class="mock-close-overview-button" on:click={onClick}>Test overview</button></div>
