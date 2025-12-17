// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { JWT_TOKEN_HANDLER_SERVICE_NAME, registerJwtTokenHandler } from '@/services/authService';
import jwtTokenStoreFactory from 'core/jwt/jwtTokenStore';
import pageController from '@/controller/page';
import LaunchPage from '@/component/LaunchPage/LaunchPage.svelte';

export default () =>
    pageController({
        name: 'launch',
        async start() {
            const queryParams = new URLSearchParams(location.search);
            const sessionToken = queryParams.get('session_token');
            const userId = queryParams.get('user');

            window.sessionStorage.setItem('user', userId);

            await jwtTokenStoreFactory({ namespace: JWT_TOKEN_HANDLER_SERVICE_NAME }).clearRefreshToken();

            registerJwtTokenHandler(userId);

            this.component = new LaunchPage({
                target: this.container,
                props: {
                    sessionToken
                }
            });
        }
    });
