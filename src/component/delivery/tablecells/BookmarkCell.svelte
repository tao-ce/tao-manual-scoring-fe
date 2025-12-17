<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2019-2022 (original work) Open Assessment Technologies SA ;
    import { IconBarButton } from '@oat-sa-private/ui-elements';
    import { __ } from '@oat-sa-private/ui-core';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let data;

    function onClick(evt) {
        evt.stopPropagation();
        dispatch('action', {
            type: 'bookmark',
            options: {
                bookmarked: !data
            }
        });
    }
</script>

<IconBarButton
    label={__('Bookmark')}
    ariaPressed={data}
    size="base-16"
    icon={data ? 'bookmark-fill-16' : 'bookmark-outline-16'}
    on:click={onClick}
/>
