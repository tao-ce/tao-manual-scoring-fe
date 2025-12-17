// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/config/env');
jest.mock('../../services/launchService');

import { render, waitFor } from '@testing-library/svelte';
import LaunchPage from './LaunchPage.svelte';
import * as launchService from '../../services/launchService';
import { tick } from 'svelte';

describe('LaunchPage component', () => {
    it('renders  ', async () => {
        launchService.validateSessionToken = jest.fn().mockResolvedValue({});

        const { queryByRole, getByRole } = render(LaunchPage, {
            props: {
                sessionToken: '123123'
            }
        });

        expect(getByRole('alert')).not.toBeNull();

        await waitFor(() => expect(launchService.validateSessionToken).toHaveBeenCalled(), { timeout: 2000 });
        await tick();

        const loader = await queryByRole('alert');
        expect(loader).toBeNull();
    });
});
