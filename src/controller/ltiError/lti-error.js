// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import pageController from '@/controller/page';
import LtiError from '@/component/LtiError/LtiError.svelte';

export default () =>
    pageController({
        name: 'ltiError',

        start() {
            const container = this.container;
            this.component = new LtiError({
                target: container
            });
        }
    });
