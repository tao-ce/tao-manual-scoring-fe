<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021 (original work) Open Assessment Technologies SA ;

    import { IconBarButton } from '@oat-sa-private/ui-elements';
    import { getIn } from '@/core/utils/object';
    import { Dialog } from '@oat-sa-private/ui-components';
    import { __ } from '@oat-sa-private/ui-core';

    export let data;

    $: reportee = getIn(data, ['scoringViolation', 'reportee']);

    let open = false;

    const handleClick = e => {
        e.stopPropagation();

        open = !open;
    };
</script>

<style>
    .container {
        position: relative;

        & :global(button) {
            color: var(--color-bg-warning);
        }
    }

    .dialog-container {
        position: absolute;
        right: 0;
        z-index: var(--layer-4);
    }
</style>

{#if data}
    <div class="container">
        <IconBarButton label={__('Press to show note')} size="base-16" icon="warning-16" on:click={handleClick} />

        <div class="dialog-container">
            <Dialog {open} mode="inline">
                <p>
                    {__('The pairing of "%s" and scorer "%s %s" with the username "%s" has been reported for the following reasons:', data.itemTitle, reportee.firstName, reportee.lastName, reportee.username)}
                </p>
                <p>{data.scoringViolation.description || __('Reason not given')}</p>
            </Dialog>
        </div>
    </div>
{/if}
