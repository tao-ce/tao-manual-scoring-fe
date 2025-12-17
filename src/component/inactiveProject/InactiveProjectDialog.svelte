<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020 (original work) Open Assessment Technologies SA ;

    import { createEventDispatcher } from 'svelte';
    import { __ } from '@oat-sa-private/ui-core';
    import { ModalDialog } from '@oat-sa-private/ui-components';

    export let open = false;

    const buttons = [
        {
            key: 'ok',
            label: __('Ok'),
            skin: 'primary',
            fullwidth: true
        }
    ];

    const dispatch = createEventDispatcher();

    const handleCloseDialog = () => dispatch('confirm-inactive');
</script>

<ModalDialog
    {open}
    heading={__('This project is now inactive')}
    {buttons}
    on:action={handleCloseDialog}
    disableClosing
    initialFocus
    disableEscape>
    <p>{__('You will be now redirected to the projects list')}</p>
</ModalDialog>
