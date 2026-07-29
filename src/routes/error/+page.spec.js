// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/config/env');
jest.mock('@/core/router');
jest.mock('@/core/apiRequest/apiRequest');

import { render } from '@testing-library/svelte';
import ErrorPage from './+page.svelte';

const flushPromises = () => new Promise(setImmediate);

describe('Error', () => {
    it('it renders correctly', () => {
    const { container } = render(ErrorPage);
        expect(container).toMatchSnapshot();
    });

    it('it redirects to home by clicking on `Go to home` button', async () => {
    const { getByText } = render(ErrorPage);
        const router = require('@/core/router').default;
        const redirectSpy = jest.spyOn(router, 'redirect');
        const button = getByText('Go to home');

        button.click();

        await flushPromises();
        expect(redirectSpy).toHaveBeenCalledTimes(1);
    });
});
