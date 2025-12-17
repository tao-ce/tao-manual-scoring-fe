<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const onClick = () => {
        dispatch('openDeliveryOverview', { taskType: 'some-task-type' });
    };
</script>

<div>Task <button class="mock-show-overview-button" on:click={onClick}> SEE Overview </button></div>
