// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2019-2025 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
import pageController from '@/controller/page';
import TaskPage from '@/routes/task/[deliveryId]/[taskId]/+page.svelte';
import config from '@/config';
import { match } from 'path-to-regexp';
import { getUser, ROLE_LTI_USER } from '@/services/authService';
import { getConfig } from '@/services/ltiService';
import { log } from '@/core/utils/logger';

export default () =>
    pageController({
        name: 'task',
        get taskId() {
            return match(config.routes.task)(window.location.pathname).params.taskId;
        },
        get deliveryId() {
            return match(config.routes.task)(window.location.pathname).params.deliveryId;
        },
        async start() {
            const user = await getUser();

            if (user.roles.includes(ROLE_LTI_USER)) {
                const ltiConfig = await getConfig();
                if (ltiConfig === null) {
                    log.error('Session is ended');
                    return this.router.replace(config.routes.ltiError);
                }
            }

            this.component = new TaskPage({
                target: this.container,
                props: {
                    deliveryId: this.deliveryId,
                    taskId: this.taskId
                }
            });
        }
    });
