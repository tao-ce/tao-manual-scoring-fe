// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/config/env', () => variableName => {
    const environmentConfig = {
        API_URL: 'http://example.com'
    };

    return environmentConfig[variableName];
});
jest.mock('@/component/task/Task');
jest.mock('@/component/delivery/Delivery');

import { render, waitFor } from '@testing-library/svelte';
import TaskPage from './TaskPage';

describe('TaskPage', () => {

    it('renders correctly', () => {
        const taskId = 'task_id_123';
        const deliveryId = 'delivery_id_123';

        const { container } = render(TaskPage, { deliveryId, taskId });

        expect(container).toMatchSnapshot();
    });
    
    it('opens and closes overview with animation', async () => {
        const taskId = 'task_id_123';
        const deliveryId = 'delivery_id_123';

        const { container, queryByText } = render(TaskPage, { deliveryId, taskId });
        queryByText('SEE Overview').click();
        await waitFor(() => expect(queryByText('Delivery overview')).toBeVisible(), { timeout: 500 });
        expect(container).toMatchSnapshot();

        queryByText('Test overview').click();
        await waitFor(() => expect(queryByText('Delivery overview')).not.toBeInTheDocument(), { timeout: 500 });
        expect(container).toMatchSnapshot();
    });
});
