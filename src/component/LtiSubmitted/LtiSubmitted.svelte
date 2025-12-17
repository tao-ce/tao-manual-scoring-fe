<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
    import { Icon } from '@oat-sa-private/ui-elements';
    import { __ } from '@oat-sa-private/ui-core';
</script>

<style>
    main {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        min-width: 100vw;
        padding: 6rem;
    }

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
</style>

<main>
    <div class="wrapper">
        <Icon name='finish-16' />
        <section>
            <h2>{__('The scores have been successfully submitted')}</h2>
        </section>
    </div>
</main>
