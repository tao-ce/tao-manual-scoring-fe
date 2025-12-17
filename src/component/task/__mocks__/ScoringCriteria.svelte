<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    import { createEventDispatcher } from 'svelte';
    export let url;
    const dispatch = createEventDispatcher();
    function onCloseCriteria() {
        dispatch('toggleCriteriaView', { show: false });
    }
</script>

<button aria-label={'Close scoring criteria'} on:click={onCloseCriteria} />

<div class="scoring-criteria-mock">Criteria PDF link: {url}</div>
