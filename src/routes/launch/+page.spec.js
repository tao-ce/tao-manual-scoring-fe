// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/config/env');
jest.mock('@/services/launchService');

import { render, waitFor } from '@testing-library/svelte';
import LaunchPage from './+page.svelte';
import * as launchService from '@/services/launchService';
import { FINAL_MESSAGES } from '@/constants/error-messages';

describe('LaunchPage component', () => {
    it('hides loading alert after session validation succeeds', async () => {
        launchService.validateSessionToken = jest.fn().mockResolvedValue(null);

        const { queryByRole, getByRole } = render(LaunchPage, {
            props: {
                sessionToken: '123123'
            }
        });

        expect(getByRole('alert')).not.toBeNull();

        await waitFor(() => expect(launchService.validateSessionToken).toHaveBeenCalledWith('123123'), {
            timeout: 2000
        });
        await waitFor(() => expect(queryByRole('alert')).toBeNull());
    });

    it('shows FinalMessage when session validation returns an error', async () => {
        launchService.validateSessionToken = jest.fn().mockResolvedValue({
            title: FINAL_MESSAGES.default?.title,
            description: FINAL_MESSAGES.default?.description
        });

        const { queryByRole, getByRole, getByText } = render(LaunchPage, {
            props: { sessionToken: 'tok' }
        });

        expect(getByRole('alert')).not.toBeNull();

        await waitFor(() => expect(queryByRole('alert')).toBeNull());

        expect(getByText(FINAL_MESSAGES.default?.title)).toBeInTheDocument();
        expect(getByText(FINAL_MESSAGES.default?.description)).toBeInTheDocument();
    });
});
