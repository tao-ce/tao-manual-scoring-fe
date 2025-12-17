<!--
SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.

SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
-->

<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2019 (original work) Open Assessment Technologies SA ;

    import { __ } from '@oat-sa-private/ui-core';
    import { Button } from '@oat-sa-private/ui-elements';
    import router from '@/core/router';
    import config from '@/config';

    const redirectToHome = () => router.redirect(config.routes.home);
</script>

<style>
    main {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        min-height: 100vh;
    }

    h5 {
        font-size: 5rem;
        padding: 0;
        margin: 0;
    }

    p {
        padding-bottom: 2rem;
    }
</style>

<main>
    <section>
        <h5>{__('Oops! Page not found')}</h5>
        <p>{__('The page you are looking for does not exist.')}</p>
        <Button shape="pill" skin="secondary" label={__('Go to home')} on:click={redirectToHome} />
    </section>
</main>
