// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import pageController from '@/controller/page';
import LtiError from '@/routes/ltiError/+page.svelte';

export default () =>
    pageController({
        name: 'ltiError',

        start() {
            const queryParams = new URLSearchParams(location.search);
            const reason = queryParams.get('reason');
            const props = reason ? { reason } : {};

            const container = this.container;
            this.component = new LtiError({
                target: container,
                props
            });
        }
    });
