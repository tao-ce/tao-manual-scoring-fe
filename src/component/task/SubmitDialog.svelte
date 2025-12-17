<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020-2022 (original work) Open Assessment Technologies SA ;

    import { createEventDispatcher } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { ModalDialog } from '@oat-sa-private/ui-components';

    export let open = false;

    const buttons = [
        {
            key: 'cancel',
            label: __('Cancel'),
            skin: 'secondary',
            autoClose: true
        },
        {
            key: 'submit',
            label: __('Submit the scores'),
            skin: 'primary',
            autoClose: true
        }
    ];

    const dispatch = createEventDispatcher();
    const handleAction = ({ detail }) => {
        if (detail.key === 'submit') {
            dispatch('submitScores');
        }
    };
</script>

<ModalDialog bind:open heading={__('Submit the scores?')} {buttons} on:action={handleAction} initialFocus>
    <p>
        {__('All scores will be submitted to your system. If you have previously scored and regraded responses they will be replaced with the new scores.')}
    </p>
</ModalDialog>
