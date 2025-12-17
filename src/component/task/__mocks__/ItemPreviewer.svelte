<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    import { createEventDispatcher } from 'svelte';

    export let loading = true;
    const dispatch = createEventDispatcher();

    function onError() {
        loading = false;
        dispatch('error');
    }
    function onSuccess() {
        loading = false;
        dispatch('success');
    }
</script>

<div>Item Previewer</div>
<button on:click={onError}>dispatch item preview error</button>
<button on:click={onSuccess}>dispatch item preview success</button>
