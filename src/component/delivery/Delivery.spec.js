// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2020-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('../../services/taskService', () => ({
    __esModule: true,
    getTasksByDelivery: jest.fn().mockResolvedValue(),
    getTasksByGroup: jest.fn().mockResolvedValue(),
    bookmarkTask: jest.fn().mockResolvedValue()
}));
jest.mock('../../services/deliveryService', () => ({
    __esModule: true,
    getDeliveriesLTI: jest.fn().mockResolvedValue()
}));
jest.mock('../../services/ltiService', () => ({
    __esModule: true,
    getConfig: jest.fn().mockResolvedValue(null)
}));
jest.mock('@/core/router');
jest.mock('@/component/delivery/DeliveryTable');
jest.mock('@/component/inactiveProject/InactiveProjectDialog');

import { render, waitFor, fireEvent } from '@testing-library/svelte';
import Delivery from './Delivery.svelte';
import * as deliveryService from '../../services/deliveryService';
import * as taskService from '../../services/taskService';
import router from '@/core/router';
import { taskStore } from '@/store/taskStore';
import { tick } from 'svelte';

const deliveryData = {
    data: {
        id: 'delivery-id-1',
        items: [
            {
                id: 'item-1',
                title: 'MANUAL',
                numTasks: 2,
                hasIncomplete: true,
                hasBookmarked: true
            }
        ],

        workProgress: {
            scoring: {
                numTasksBookmarked: 0,
                numTasksUnscored: 1,
                numTasksScored: 1,
                numTasksSubmitted: 0
            }
        }
    }
};
const deliveryData2 = {
    data: {
        id: 'delivery-id-2',
        items: [
            {
                id: 'item-1',
                title: 'item-1-title',
                numTasks: 2,
                hasIncomplete: true,
                hasBookmarked: false
            },
            {
                id: 'item-2',
                title: 'item-2-title',
                numTasks: 1,
                hasIncomplete: false,
                hasBookmarked: true
            }
        ],

        workProgress: {
            scoring: {
                numTasksBookmarked: 1,
                numTasksUnscored: 0,
                numTasksScored: 3,
                numTasksSubmitted: 0
            }
        }
    }
};
const getTasksByDeliveryValue2 = {
    _pagination: {
        limit: 30,
        offset: 0,
        numTotal: 3
    },
    data: [
        {
            id: 'task-1',
            itemId: 'item-1'
        },
        {
            id: 'task-2',
            itemId: 'item-1'
        },
        {
            id: 'task-3',
            itemId: 'item-2'
        }
    ]
};

const getTasksByDeliveryValue = {
    _pagination: {
        limit: 30,
        offset: 0,
        numTotal: 2
    },
    data: [
        {
            id: 'task-1',
            itemId: 'item-1'
        },
        {
            id: 'task-2',
            itemId: 'item-1'
        }
    ]
};

describe('Delivery overview', () => {
    beforeEach(() => {
        taskStore.set({
            task: {
                item: {
                    qtiIdentifier: 'item-1'
                }
            }
        });
    });

    it('renders correctly after LTI launch', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue);
        deliveryService.getDeliveriesLTI = jest
            .fn()
            .mockResolvedValue({ data: [deliveryData.data, deliveryData2.data] });

        const { container, findByTestId } = render(Delivery, {
            props: {
                taskId: 'task-1'
            }
        });

        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'all',
                    itemId: deliveryData.data.items[0].id,
                    taskType: 'scoring',
                    deliveryId: deliveryData.data.id,
                    selectedTaskId: 'task-1',
                    currentTask: 'task-1'
                }),
            { timeout: 100 }
        );

        expect(deliveryService.getDeliveriesLTI).toBeCalled();
        await findByTestId('DeliveryTable');
        expect(container).toMatchSnapshot();
    });

    it('renders correctly with paginator', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue({
            ...getTasksByDeliveryValue,
            _pagination: {
                limit: 30,
                offset: 0,
                numTotal: 31
            }
        });
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData.data] });

        const deliveryId = 'Example delivery I';
        const { container, findByTestId } = render(Delivery, {
            props: {
                deliveryId: deliveryId,
                taskId: 'task-1'
            }
        });

        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'all',
                    itemId: 'item-1',
                    taskType: 'scoring',
                    deliveryId: deliveryData.data.id,
                    selectedTaskId: 'task-1',
                    currentTask: 'task-1'
                }),
            { timeout: 100 }
        );

        await findByTestId('DeliveryTable');
        expect(container).toMatchSnapshot();
    });

    it('renders correcly with different task types', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue);
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData.data] });

        const deliveryId = 'Example delivery I';
        const { container, findByTestId } = render(Delivery, {
            props: {
                deliveryId,
                taskType: 'unexpected task type',
                taskId: 'task-1'
            }
        });

        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'all',
                    itemId: 'item-1',
                    taskType: 'scoring',
                    deliveryId: deliveryData.data.id,
                    selectedTaskId: 'task-1',
                    currentTask: 'task-1'
                }),
            { timeout: 100 }
        );
        expect(deliveryService.getDeliveriesLTI).toBeCalled();
        await findByTestId('DeliveryTable');
        expect(container).toMatchSnapshot();
    });

    it('change to incomplete tab', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue);
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData.data] });

        const deliveryId = 'Example delivery I';
        const { getByText, container, findByText } = render(Delivery, {
            props: {
                deliveryId,
                taskId: 'task-1'
            }
        });

        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'all',
                    taskType: 'scoring',
                    itemId: 'item-1',
                    deliveryId: deliveryData.data.id,
                    selectedTaskId: 'task-1',
                    currentTask: 'task-1'
                }),
            { timeout: 1000 }
        );
        await findByText('Incomplete(1)');
        fireEvent.click(getByText('Incomplete(1)'));

        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'incomplete',
                    currentPage: 1,
                    itemId: 'item-1',
                    taskType: 'scoring',
                    deliveryId: deliveryData.data.id,
                    currentTask: 'task-1'
                }),
            { timeout: 1000 }
        );
        expect(container).toMatchSnapshot();
    });

    it('change to bookmarked tab', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue);
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData.data] });

        const deliveryId = 'Example delivery I';
        const { getByText, findByText } = render(Delivery, {
            props: {
                deliveryId,
                taskId: 'task-1'
            }
        });
        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'all',
                    taskType: 'scoring',
                    itemId: 'item-1',
                    deliveryId: deliveryData.data.id,
                    selectedTaskId: 'task-1',
                    currentTask: 'task-1'
                }),
            { timeout: 1000 }
        );

        await findByText('Bookmarked(0)');
        fireEvent.click(getByText('Bookmarked(0)'));

        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'bookmarked',
                    taskType: 'scoring',
                    itemId: 'item-1',
                    deliveryId: deliveryData.data.id,
                    currentPage: 1,
                    currentTask: 'task-1'
                }),
            { timeout: 1000 }
        );
    });

    it('bookmark test', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue);
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData.data] });
        taskService.bookmarkTask = jest.fn().mockResolvedValue({ bookmarked: true });

        const deliveryId = 'Example delivery I';
        const { container, getByTestId, findByTestId } = render(Delivery, {
            props: {
                deliveryId,
                taskId: 'task-1'
            }
        });
        await findByTestId('DeliveryTable');
        await fireEvent(
            getByTestId('DeliveryTable'),
            new CustomEvent('click', {
                detail: { name: 'bookmark', key: 'task-1', bookmarked: true }
            })
        );
        expect(taskService.bookmarkTask).toBeCalled();
        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'all',
                    taskType: 'scoring',
                    itemId: 'item-1',
                    deliveryId: deliveryData.data.id,
                    selectedTaskId: 'task-1',
                    currentTask: 'task-1'
                }),
            { timeout: 1000 }
        );
        await tick();

        expect(container).toMatchSnapshot();
    });

    it('bookmark test unexpected task key', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue);
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData.data] });
        taskService.bookmarkTask = jest.fn().mockRejectedValue({ responseStatus: 409 });

        const deliveryId = 'Example delivery I';
        const { container, getByTestId, findByTestId } = render(Delivery, {
            props: {
                deliveryId,
                taskId: 'task-1'
            }
        });

        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'all',
                    taskType: 'scoring',
                    itemId: 'item-1',
                    deliveryId: deliveryData.data.id,
                    selectedTaskId: 'task-1',
                    currentTask: 'task-1'
                }),
            { timeout: 1000 }
        );

        await findByTestId('DeliveryTable');

        fireEvent(
            getByTestId('DeliveryTable'),
            new CustomEvent('click', {
                detail: { name: 'bookmark', key: 'unexpected task key', bookmarked: true }
            })
        );

        expect(taskService.bookmarkTask).toBeCalledWith('unexpected task key', true);

        expect(container).toMatchSnapshot();
    });

    it('redirect to task page', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue);
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData.data] });
        router.redirect = jest.fn();
        const deliveryId = 'Example delivery I';
        const { getByTestId, findByTestId } = render(Delivery, {
            props: {
                deliveryId,
                taskId: 'task-1'
            }
        });
        await findByTestId('DeliveryTable');
        fireEvent(
            getByTestId('DeliveryTable'),
            new CustomEvent('click', { detail: { name: 'rowClick', id: 'task-id', deliveryId: 'task-delivery-id' } })
        );

        await waitFor(() => expect(router.redirect).toBeCalledWith('/task/task-delivery-id/task-id'), {
            timeout: 1000
        });
    });

    it('active item change', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue2);
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData2.data] });

        const deliveryId = 'Example delivery I';
        const { container, getByText, findByTestId } = render(Delivery, {
            props: {
                deliveryId,
                taskId: 'task-1'
            }
        });

        await waitFor(
            () =>
                expect(taskService.getTasksByDelivery).toBeCalledWith({
                    activeTab: 'all',
                    taskType: 'scoring',
                    itemId: 'item-1',
                    deliveryId: deliveryData2.data.id,
                    selectedTaskId: 'task-1',
                    currentTask: 'task-1'
                }),
            { timeout: 100 }
        );
        expect(deliveryService.getDeliveriesLTI).toBeCalled();
        getByText('item-2-title').click();
        await waitFor(() =>
            expect(taskService.getTasksByDelivery).toBeCalledWith({
                deliveryId: deliveryData2.data.id,
                itemId: 'item-2',
                activeTab: 'all',
                taskType: 'scoring',
                currentPage: 1,
                currentTask: 'task-1'
            })
        );
        await findByTestId('DeliveryTable');
        expect(container).toMatchSnapshot();
        getByText('item-1-title').click();
        expect(taskService.getTasksByDelivery).toBeCalledTimes(3);
    });

    it('close overview', async () => {
        taskService.getTasksByDelivery = jest.fn().mockResolvedValue(getTasksByDeliveryValue);
        deliveryService.getDeliveriesLTI = jest.fn().mockResolvedValue({ data: [deliveryData.data] });
        const eventListener = jest.fn();

        const deliveryId = 'Example delivery I';
        const { component, getByText } = render(Delivery, {
            props: {
                deliveryId,
                taskId: 'task-1'
            }
        });
        component.$on('closeDeliveryOverview', eventListener);
        fireEvent.click(getByText('Test overview'));

        expect(eventListener).toBeCalled();
    });
});
