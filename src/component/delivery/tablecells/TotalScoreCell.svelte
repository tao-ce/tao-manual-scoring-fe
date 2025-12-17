<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2019-2020 (original work) Open Assessment Technologies SA ;

    import { Icon } from '@oat-sa-private/ui-elements';
    import { __ } from '@oat-sa-private/ui-core';

    export let data;
</script>

{#if data.isScored}
    <span class="visually-hidden">{__('Task is scored')}</span>
    <Icon name="check-16" ariaHidden/>
    <div class="visually-hidden">{__('%s of %s', data.totalScore.value, data.totalScore.maximumValue)}</div>
    <span aria-hidden="true">{`${data.totalScore.value} / ${data.totalScore.maximumValue}`}</span>
{/if}
