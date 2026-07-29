// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019-2025 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import pageController from '@/controller/page';
import ErrorPage from '@/routes/error/+page.svelte';
import { __ } from '@oat-sa-private/ui-core';

export default () => pageController({
    name: 'error',

    /**
     * Controller starts here
     */
    start() {
        this.setPageTitle(__("Error page"));

        const container = this.container;
        this.component = new ErrorPage({
            target: container
        });
    }
});
