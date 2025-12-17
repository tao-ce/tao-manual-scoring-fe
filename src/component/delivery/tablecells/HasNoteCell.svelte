<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2019-2020 (original work) Open Assessment Technologies SA ;
    import { createEventDispatcher } from 'svelte';
    import { IconBarButton } from '@oat-sa-private/ui-elements';
    import { __ } from '@oat-sa-private/ui-core';

    export let data;

    const dispatch = createEventDispatcher();
</script>

{#if data}
    <IconBarButton
        label={__('Press to show task note')}
        size="base-16"
        icon="notepad-16"
        on:click={e => {
            e.stopPropagation();
            dispatch('action', { type: 'shownote', options: { note: data, caller: e.target } });
        }}
    />
{/if}
