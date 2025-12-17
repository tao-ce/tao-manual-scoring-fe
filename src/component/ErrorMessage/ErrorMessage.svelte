<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2021-2023 (original work) Open Assessment Technologies SA ;
    import { Icon } from '@oat-sa-private/ui-elements';
    export let title;
    export let description;
</script>

<style>

    .wrapper {
        max-width: 55rem;
        align-items: center;
        display: flex;
        justify-content: center;
        gap: 4rem;

        & :global(.icon) {
            min-width: 10rem;
            height: 10rem;
            color: var(--color-text-feedback);
        }
    }

    @media screen and (--mq-maxwidth-small) {
        .wrapper {
            flex-direction: column;
        }
    }
    .description {
        color: var(--color-text-feedback);
    }
</style>

<div class="wrapper">
    <Icon name="lightning-16" />
    <section>
        <h2>{title}</h2>
        <p class="description">{@html description}</p>
    </section>
</div>
