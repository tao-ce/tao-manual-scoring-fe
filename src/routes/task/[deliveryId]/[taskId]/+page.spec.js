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

const getTaskResponse = () => ({
    data: {
        bookmarked: false,
        highlights: [],
        id: '01FCR37KDMCK57ZMN0AJS2Z55J',
        item: { title: 'Item 1' },
        ltiItemPreviewerLink: {
            url: 'https://sds-tao-1.docker.localhost/ltiOutcomeUi/It…23i61127b43681064369d09cb8c9e44642&itemRef=item-1',
            parameters: {}
        },
        note: '',
        outcomeDeclarations: [
            {
                value: 'hello'
            }
        ],
        status: 'scored',
        test: { title: 'Test 2' }
    },
    _meta: {
        nextTaskId: 'next_task_id',
        nextTaskDeliveryId: 'next_task_delivery_id',
        nrOfTasks: 3,
        position: 2,
        prevTaskId: 'prev_task_id',
        prevTaskDeliveryId: 'prev_task_delivery_id',
        totalScored: 3,
        deliveryExecutionScoring: {
            suspicious: true,
            suspiciousNote: 'Suspicious note',
            note: 'Delivery note'
        },
    }
});

import { render, waitFor } from '@testing-library/svelte';
import TaskPage from './+page.svelte';
import * as taskService from '@/services/taskService';
import { taskStore } from '@/store/taskStore';

describe('TaskPage', () => {

    beforeEach(() => {
        taskStore.reset();
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());
        const taskId = 'task_id_123';
        const deliveryId = 'delivery_id_123';

        const { container } = render(TaskPage, { deliveryId, taskId });

        expect(container).toMatchSnapshot();
    });

    it('opens and closes overview with animation', async () => {
        taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());
        const taskId = 'task_id_123';
        const deliveryId = 'delivery_id_123';

        const { container, queryByText } = render(TaskPage, { deliveryId, taskId });
        await waitFor(() => expect(queryByText('SEE Overview')).toBeVisible(), { timeout: 500 });
        queryByText('SEE Overview').click();
        await waitFor(() => expect(queryByText('Delivery overview')).toBeVisible(), { timeout: 500 });
        expect(container).toMatchSnapshot();

        queryByText('Test overview').click();
        await waitFor(() => expect(queryByText('Delivery overview')).not.toBeInTheDocument(), { timeout: 500 });
        expect(container).toMatchSnapshot();
    });
});