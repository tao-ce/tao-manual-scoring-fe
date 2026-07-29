// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2022 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import pageController from '@/controller/page';
import LtiSubmitted from '@/routes/ltiSubmitted/+page.svelte';

export default () =>
    pageController({
        name: 'ltiSubmitted',

        start() {
            const container = this.container;
            this.component = new LtiSubmitted({
                target: container
            });
        }
    });
