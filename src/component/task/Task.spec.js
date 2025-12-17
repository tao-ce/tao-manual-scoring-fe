// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/core/apiRequest/apiRequest');
jest.mock('@/core/router');
jest.mock('@/component/task/ItemPreviewer');
jest.mock('@/component/task/ScoringCriteria');

import { taskStore } from '@/store/taskStore';
import * as taskUtils from '@/core/utils/task';
import { wait } from '@/core/utils/async';
import { fireEvent, getByTitle, render, waitFor, getByRole as getByRoleWithContainer } from '@testing-library/svelte';
import Task from './Task.svelte';
import * as taskService from '../../services/taskService';
import { TASK_STATUS } from '../../constants/task';
import router from '@/core/router';
import * as ltiService from '../../services/ltiService';
import { tick } from 'svelte';
import * as userConfigurationService from '../../services/userConfigurationService';

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
        }
    }
});

describe('Task', () => {
    beforeEach(() => {
        userConfigurationService.setConfig({
            isSuggestedScoringEnabled: false,
            isMarkAsSuspiciousForCheatingEnabled: true
        });
        taskStore.reset();
        jest.clearAllMocks();
    });

    const taskId = 'task_id_123';
    const deliveryId = 'delivery_id_123';

    Object.defineProperty(window, 'location', {
        value: {
            pathname: `/task/${deliveryId}/${taskId}`,
            search: '',
            replace: jest.fn()
        }
    });

    it('renders correctly TaskContainer', async () => {
        taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());
        ltiService.getConfig = jest.fn().mockReturnValue({
            testTakerName: 'Foo Bar Baz'
        });

        const { container, getByLabelText, getByText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByLabelText('Scoring')).not.toBeNull(), { timeout: 2000 });
        await fireEvent.click(getByText('dispatch item preview success'));

        expect(container).toMatchSnapshot();
    });

    it('redirect to the home page when task is submitted', async () => {
        taskService.getTask = jest.fn().mockResolvedValue({
            data: {
                status: TASK_STATUS.SUBMITTED
            }
        });
        ltiService.getConfig = jest.fn().mockReturnValue({
            testTakerName: 'Foo Bar Baz'
        });

        render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(taskService.getTask).toBeCalled(), { timeout: 2000 });
        expect(router.redirect).toBeCalledWith('/');
    });

    it('renders page for scorer', async () => {
        const response = getTaskResponse();
        taskUtils.saveLocalTaskData = jest.fn();

        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.getServerTaskData = jest.fn().mockResolvedValue(response);

        const { container, getByLabelText, getByText, queryByText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByLabelText('Test taker response')).not.toBeNull(), { timeout: 1000 });
        await waitFor(() => expect(queryByText('Suspected of cheating')).not.toBeNull(), { timeout: 1000 });
        await fireEvent.click(getByText('dispatch item preview success'));

        expect(container).toMatchSnapshot();
    });

    it('renders page for scorer without suspicious fields', async () => {
        const response = getTaskResponse();
        delete response._meta.deliveryExecutionScoring;
        taskUtils.saveLocalTaskData = jest.fn();

        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.getServerTaskData = jest.fn().mockResolvedValue(response);

        const { container, getByText, getByLabelText, queryByText, queryByLabelText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByLabelText('Test taker response')).not.toBeNull(), { timeout: 1000 });
        await waitFor(() => expect(queryByText('Suspected of suspicious')).toBeNull(), { timeout: 1000 });
        await waitFor(() => expect(queryByLabelText("Scorer's notes")).toBeNull(), { timeout: 1000 });
        await fireEvent.click(getByText('dispatch item preview success'));

        expect(container).toMatchSnapshot();
    });

    it('renders page for reviewer', async () => {
        const response = getTaskResponse();
        response._meta.linkedTasks = [
            {
                id: 'linked_id_1',
                note: 'Note',
                enrollment: {
                    username: 'i_am_reviewer',
                    firstName: 'foo',
                    lastName: 'bar'
                },
                // scoringViolation: {
                //     description: 'Be careful!!!'
                // },
                outcomeDeclarations: []
            }
        ];

        taskUtils.saveLocalTaskData = jest.fn();
        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.getServerTaskData = jest.fn().mockResolvedValue(response);

        const { container, getByLabelText, getByPlaceholderText, getByText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByLabelText('Test taker response')).not.toBeNull(), { timeout: 1000 });
        await fireEvent.click(getByText('dispatch item preview success'));

        expect(getByPlaceholderText('Type a note for this review')).not.toBeNull();
        expect(container).toMatchSnapshot();
    });

    it('shows test taker name, if it is provided in LTI launch', async () => {
        taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());
        ltiService.getConfig = jest.fn().mockReturnValue({
            testTakerName: 'Foo Bar Baz'
        });

        const { container, getByLabelText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByLabelText('Scoring')).not.toBeNull(), { timeout: 2000 });
        expect(container.querySelector('.scoring-header')).toMatchSnapshot();
    });

    it('opens delivery overview', async () => {
        const response = getTaskResponse();

        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.updateTask = jest.fn().mockResolvedValue({});

        const { getByRole, component } = render(Task, {
            taskId,
            deliveryId
        });

        const openDeliveryHandler = jest.fn();
        component.$on('openDeliveryOverview', openDeliveryHandler);

        await waitFor(() => expect(getByRole('button', { name: /see overview/i })).toBeInTheDocument(), {
            timeout: 2000
        });

        const overviewButton = getByRole('button', { name: /see overview/i });
        await fireEvent.click(overviewButton);

        await waitFor(() => expect(openDeliveryHandler).toBeCalled());
    });

    it('opens delivery overview only once', async () => {
        const response = getTaskResponse();

        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.updateTask = jest.fn().mockResolvedValue({});

        const { getByRole, component } = render(Task, {
            taskId,
            deliveryId
        });

        const openDeliveryHandler = jest.fn();
        component.$on('openDeliveryOverview', openDeliveryHandler);

        await waitFor(() => expect(getByRole('button', { name: /see overview/i })).toBeInTheDocument(), {
            timeout: 2000
        });

        const bookmarkButton = getByRole('button', { name: /bookmark/i });
        await fireEvent.click(bookmarkButton);

        const overviewButton = getByRole('button', { name: /see overview/i });

        await fireEvent.click(overviewButton);

        expect(overviewButton).toBeDisabled();
    });

    it('opens previously scored task', async () => {
        const response = getTaskResponse();

        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.formatTaskData = jest.fn().mockReturnValue({});
        taskService.updateTask = jest.fn().mockResolvedValue({});
        taskStore.loadNextTask = jest.fn(taskStore.loadNextTask);
        taskStore.set = jest.fn();

        const { getByRole } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByRole('button', { name: /go to previous answer/i })).toBeInTheDocument(), {
            timeout: 5000
        });

        const prevTaskButton = getByRole('button', { name: /go to previous answer/i });

        expect(prevTaskButton).not.toBeDisabled();

        await fireEvent.click(prevTaskButton);

        expect(taskStore.loadNextTask.mock.calls[0][2]).toMatchObject({
            id: 'prev_task_id',
            deliveryId: 'prev_task_delivery_id'
        });
        expect(taskService.formatTaskData).toBeCalled();
        expect(taskService.updateTask).toBeCalled();
    });

    it('opens next scored task', async () => {
        const response = getTaskResponse();

        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.formatTaskData = jest.fn().mockReturnValue({});
        taskService.updateTask = jest.fn().mockResolvedValue({});
        taskStore.loadNextTask = jest.fn(taskStore.loadNextTask);
        taskStore.set = jest.fn();

        const { getByRole } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByRole('button', { name: /go to next answer/i })).toBeInTheDocument(), {
            timeout: 5000
        });

        const nextTaskButton = getByRole('button', { name: /go to next answer/i });

        expect(nextTaskButton).not.toBeDisabled();

        await fireEvent.click(nextTaskButton);

        expect(taskStore.loadNextTask.mock.calls[0][2]).toMatchObject({
            id: 'next_task_id',
            deliveryId: 'next_task_delivery_id'
        });
        expect(taskService.formatTaskData).toBeCalled();
        expect(taskService.updateTask).toBeCalled();
    });

    it('changes bookmark state on click', async () => {
        const response = getTaskResponse();
        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { getByRole, getByText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByRole('button', { name: /bookmark/i })).toBeInTheDocument(), {
            timeout: 5000
        });
        await fireEvent.click(getByText('dispatch item preview success'));

        const bookmarkButton = getByRole('button', { name: /bookmark/i });

        expect(bookmarkButton).not.toBeDisabled();
        expect(getByTitle(bookmarkButton, 'Bookmark inactive icon')).toBeInTheDocument();

        await fireEvent.click(bookmarkButton);

        expect(getByTitle(bookmarkButton, 'Bookmark active icon')).toBeInTheDocument();
    });

    it('changes bookmark state on click', async () => {
        const response = getTaskResponse();
        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { getByLabelText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByLabelText(/show highlighter/i)).toBeInTheDocument(), {
            timeout: 2000
        });

        const highlighterButton = getByLabelText(/show highlighter/i);

        expect(highlighterButton).toBeInTheDocument();
        expect(highlighterButton).toHaveAccessibleDescription('Show highlighter');

        await fireEvent.click(highlighterButton);

        expect(highlighterButton).toHaveAccessibleDescription('Hide highlighter');
    });

    it.each`
        nrOfTasks | totalScored | progress
        ${225}    | ${224}      | ${99}
        ${100}    | ${0}        | ${0}
        ${100}    | ${51}       | ${51}
        ${4}      | ${3}        | ${75}
    `(
        'renders progression of $nrOfTasks tasks where $totalScored task scored must be $progress%',
        async ({ nrOfTasks, totalScored, progress }) => {
            const response = getTaskResponse();

            response._meta.nrOfTasks = nrOfTasks;
            response._meta.totalScored = totalScored;

            taskService.getTask = jest.fn().mockResolvedValue(response);

            const { getByRole } = render(Task, {
                taskId,
                deliveryId
            });

            await waitFor(() => expect(getByRole('progressbar')).toBeInTheDocument(), { timeout: 2000 });

            expect(getByRole('progressbar').textContent.trim()).toBe(`Completion: ${progress} %`);
        }
    );

    it('opens and closes complain dialog', async () => {
        const response = getTaskResponse();
        response.data.type = 'review';
        response._meta.linkedTasks = [
            {
                id: 'linked_id_1',
                note: 'Note',
                enrollment: {
                    username: 'i_am_reviewer',
                    firstName: 'foo',
                    lastName: 'bar'
                },
                outcomeDeclarations: []
            }
        ];

        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { getByRole, getByText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByText(/report/i)).toBeInTheDocument(), { timeout: 4000 });
        await fireEvent.click(getByText('dispatch item preview success'));

        const reportButton = getByText(/report/i);

        await fireEvent.click(reportButton);

        const sendReportButton = getByRole('button', { name: /report and continue/i });

        expect(sendReportButton).toBeVisible();

        const cancelReportButton = getByRole('button', { name: /close dialog/i });

        expect(cancelReportButton).toBeInTheDocument();

        await fireEvent.click(cancelReportButton);

        expect(cancelReportButton.parentElement).toHaveClass('close');

        taskService.complainItemScorerPair = jest.fn().mockResolvedValue();

        await fireEvent.click(reportButton);
        await fireEvent.click(sendReportButton);

        expect(taskService.complainItemScorerPair).toBeCalled();
    });

    it('hides back button and breadcrumbs for lti users if no return url provided', async () => {
        const response = getTaskResponse();
        ltiService.getConfig = jest.fn().mockReturnValue({
            ltiResourceLabel: 'lti return link breadcrumbs label'
        });
        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { queryByRole, findByLabelText, queryByText } = render(Task, {
            taskId,
            deliveryId
        });

        await findByLabelText('Scoring');

        const backButton = queryByRole('button', { name: /back to scoring project/i });

        expect(backButton).not.toBeInTheDocument();
        expect(queryByText('lti return link breadcrumbs label')).not.toBeInTheDocument();
    });

    it('shows back button and breadcrumbs for lti users if return url provided', async () => {
        const response = getTaskResponse();
        ltiService.getConfig = jest.fn().mockReturnValue({
            ltiResourceLabel: 'lti return link breadcrumbs label',
            ltiResourceLink: 'https://example.com'
        });
        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { queryByRole, findByLabelText, queryByText } = render(Task, {
            taskId,
            deliveryId
        });

        await findByLabelText('Scoring');

        const backButton = queryByRole('button', { name: /back/i });
        expect(backButton).toBeInTheDocument();
        expect(
            queryByText('lti return link breadcrumbs label', { selector: 'ul:not(.resize-helper) a' })
        ).toBeInTheDocument();
    });

    it('enables submit after scoring last unscored task', async () => {
        const response = getTaskResponse();
        Object.assign(response.data, {
            outcomeDeclarations: [
                {
                    qtiIdentifier: 'OUTCOME_1',
                    maximumValue: 1,
                    minimumValue: 0,
                    value: null
                }
            ],
            status: 'unscored'
        });
        Object.assign(response._meta, {
            nrOfTasks: 3,
            totalScored: 2,
            position: 2
        });

        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { queryByLabelText, findByLabelText, queryByRole, getByText } = render(Task, {
            taskId,
            deliveryId
        });

        await findByLabelText('Scoring');
        await fireEvent.click(getByText('dispatch item preview success'));

        const submitButton = queryByRole('button', { name: /send scores/i });
        expect(submitButton).toBeDisabled();

        const setScoreValueTo1Button = queryByLabelText('1', { selector: 'input[name="OUTCOME_1"]' });

        await fireEvent.click(setScoreValueTo1Button);

        expect(submitButton).toBeEnabled();
        expect(getByText('Completion: 100 %'));

        await fireEvent.click(setScoreValueTo1Button);

        expect(getByText('Completion: 66 %'));
        expect(submitButton).toBeDisabled();
    });

    it('redirects lti user back to return url after submit', async () => {
        const response = getTaskResponse();
        ltiService.redirectToReturnUrl = jest.fn();
        router.redirect = jest.fn();
        ltiService.getConfig = jest.fn().mockReturnValue({
            ltiResourceLabel: 'lti return link breadcrumbs label',
            ltiResourceLink: 'https://example.com'
        });
        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.submitLTITasks = jest.fn().mockResolvedValue({});

        const { queryByRole, findByLabelText, findByText } = render(Task, {
            taskId,
            deliveryId
        });

        await findByLabelText('Scoring');

        const submitButton = queryByRole('button', { name: /send scores/i });
        expect(submitButton).toBeEnabled();
        submitButton.click();

        const confirmSubmit = await findByText('Submit the scores');
        confirmSubmit.click();

        await waitFor(() => expect(ltiService.redirectToReturnUrl).toBeCalled(), { timeout: 4000 });
        expect(taskService.submitLTITasks).toBeCalledWith('scoring', 'task_id_123');
        expect(ltiService.redirectToReturnUrl).toBeCalledWith('https://example.com');
    });

    it('redirects lti user to submitted page after submit if no return url defined', async () => {
        ltiService.redirectToReturnUrl = jest.fn();
        router.redirect = jest.fn();
        const response = getTaskResponse();
        ltiService.getConfig = jest.fn().mockReturnValue({
            ltiResourceLabel: 'lti return link breadcrumbs label'
        });
        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.submitLTITasks = jest.fn().mockResolvedValue({});

        const { queryByRole, findByLabelText, findByText } = render(Task, {
            taskId,
            deliveryId
        });

        await findByLabelText('Scoring');

        const submitButton = queryByRole('button', { name: /send scores/i });
        expect(submitButton).toBeEnabled();
        submitButton.click();

        const confirmSubmit = await findByText('Submit the scores');
        confirmSubmit.click();

        await waitFor(() => expect(submitButton).toBeDisabled(), { timeout: 4000 });
        await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 4000 });
        expect(taskService.submitLTITasks).toBeCalledWith('scoring', 'task_id_123');
        expect(ltiService.redirectToReturnUrl).not.toBeCalled();
        expect(router.redirect).toBeCalledWith('/submitted');
    });

    it('opens scoring criteria pdf', async () => {
        const response = getTaskResponse();
        response.data.outcomeDeclarations = [
            {
                value: 1,
                interpretation: 'Math',
                longInterpretation: 'test.com/Math.pdf'
            },
            {
                value: 0,
                interpretation: 'English',
                longInterpretation: 'test.com/English.pdf'
            }
        ];
        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { queryByLabelText, getByText, queryByText, findByLabelText } = render(Task, {
            taskId,
            deliveryId
        });

        await findByLabelText('Scoring');

        const outcome1 = getByText('Math').parentElement;
        await fireEvent.click(getByRoleWithContainer(outcome1, 'button'));

        expect(queryByText('test.com/Math.pdf', { exact: false })).toBeVisible();

        const outcome2 = getByText('English').parentElement;
        await fireEvent.click(getByRoleWithContainer(outcome2, 'button'));

        expect(queryByText('test.com/English.pdf', { exact: false })).toBeVisible();

        await fireEvent.click(queryByLabelText('Close scoring criteria'));

        expect(queryByText('test.com/English.pdf', { exact: false })).not.toBeInTheDocument();
        expect(queryByText('test.com/Math.pdf', { exact: false })).not.toBeInTheDocument();
    });

    it('enables scorer only to change task data when item preview succesfully loaded', async () => {
        const response = getTaskResponse();
        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { getByRole, getByText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByRole('button', { name: /bookmark/i })).toBeInTheDocument(), {
            timeout: 5000
        });

        expect(getByRole('button', { name: /bookmark/i })).toBeDisabled();

        await fireEvent.click(getByText('dispatch item preview error'));

        expect(getByRole('button', { name: /bookmark/i })).toBeDisabled();

        await fireEvent.click(getByText('dispatch item preview success'));

        expect(getByRole('button', { name: /bookmark/i })).toBeEnabled();
    });

    it('shows item preview error message', async () => {
        const response = getTaskResponse();
        taskService.getTask = jest.fn().mockResolvedValue(response);

        const { getByLabelText, getByText, queryByText } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByLabelText('Test taker response')).not.toBeNull(), { timeout: 1000 });

        expect(queryByText('Task failed to load. Please contact your system administrator.')).toBe(null);

        await fireEvent.click(getByText('dispatch item preview error'));

        expect(queryByText('Task failed to load. Please contact your system administrator.')).toBeVisible();

        await fireEvent.click(getByText('dispatch item preview success'));

        expect(queryByText('Task failed to load. Please contact your system administrator.')).toBe(null);
    });

    it('shows project inactive dialog', async () => {
        // Prepare
        const response = getTaskResponse();
        taskService.getTask = jest.fn().mockResolvedValue(response);

        // Run
        const { getByText, getByRole } = render(Task, {
            taskId,
            deliveryId
        });
        await waitFor(() => expect(getByRole('button', { name: /see overview/i })).toBeInTheDocument(), {
            timeout: 5000
        });

        await fireEvent.click(getByText('dispatch item preview success'));

        taskService.getTask = jest.fn().mockRejectedValue({
            responseStatus: 409,
            error: {
                message: 'The linked scoring project is inactive'
            }
        });
        taskService.updateTask = jest.fn().mockRejectedValue({
            responseStatus: 409,
            error: {
                message: 'The linked scoring project is inactive'
            }
        });

        await fireEvent.click(getByRole('button', { name: /see overview/i }));
        await wait(0);

        // Check
        expect(getByText('This project is now inactive')).toBeVisible();
        await fireEvent.click(getByText('Ok'));
        expect(router.redirect).toBeCalledWith('/scoringprojects');
    });

    it('shows out-of-range modal, if too high/low score is submitted', async () => {
        // Prepare
        const response = getTaskResponse();
        taskService.getTask = jest.fn().mockResolvedValue(response);

        // Run
        const { getByText, getByRole } = render(Task, {
            taskId,
            deliveryId
        });
        await wait(0);
        await fireEvent.click(getByText('dispatch item preview success'));

        taskService.updateTask = jest.fn().mockRejectedValue({
            responseStatus: 400,
            error: {
                info: 'Score value is out of range'
            }
        });

        await fireEvent.click(getByRole('button', { name: /see overview/i }));
        await wait(0);

        // Check
        expect(
            getByText(
                'We encountered an issue while saving your score. Please try again. If the problem persists, contact our support team for assistance.'
            )
        ).toBeVisible();
        await fireEvent.click(getByText('Try again'));
        expect(router.redirect).not.toBeCalled();
    });

    it('shows out-of-range modal, if the task was submitted', async () => {
        // Prepare
        const response = getTaskResponse();
        taskService.getTask = jest.fn().mockResolvedValue(response);

        // Run
        const { getByText, getByRole } = render(Task, {
            taskId,
            deliveryId
        });
        await wait(0);
        await fireEvent.click(getByText('dispatch item preview success'));

        taskService.updateTask = jest.fn().mockRejectedValue({
            responseStatus: 400,
            error: {
                message: 'The scoring task ID:TaskId is already scored and submitted'
            }
        });

        await fireEvent.click(getByRole('button', { name: /see overview/i }));
        await wait(0);

        // Check
        expect(getByText('The scoring task ID:TaskId is already scored and submitted')).toBeVisible();
        await fireEvent.click(getByText('Try again'));
        expect(router.redirect).not.toBeCalled();
    });

    it('shows dialog when have a server error and return to sessions', async () => {
        // Prepare
        const response = getTaskResponse();
        taskService.getTask = jest.fn().mockResolvedValue(response);

        // Run
        const { getByText, getByRole } = render(Task, {
            taskId,
            deliveryId
        });
        await wait(0);
        await fireEvent.click(getByText('dispatch item preview success'));

        taskService.updateTask = jest.fn().mockRejectedValue({
            responseStatus: 400,
            error: {
                message: `Custom Error ${taskId}`
            }
        });

        await fireEvent.click(getByRole('button', { name: /see overview/i }));
        await wait(0);

        // Check
        expect(getByText('Scoring task could not be started')).toBeVisible();
        await fireEvent.click(getByText('Back'));
        expect(router.redirect).toBeCalled();
    });

    it('disables double click behaviour for next and previous buttons', async () => {
        const response = getTaskResponse();

        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.formatTaskData = jest.fn().mockReturnValue({});
        taskService.updateTask = jest.fn().mockResolvedValue({});
        taskStore.updateSuspicious = jest.fn().mockResolvedValue({});
        taskStore.loadNextTask = jest.fn(async () => {
            await tick();
        });
        taskStore.set = jest.fn();

        const { getByRole } = render(Task, {
            taskId,
            deliveryId
        });

        await waitFor(() => expect(getByRole('button', { name: /go to next answer/i })).toBeInTheDocument(), {
            timeout: 5000
        });

        const nextTaskButton = getByRole('button', { name: /go to next answer/i });
        const prevTaskButton = getByRole('button', { name: /go to previous answer/i });

        expect(nextTaskButton).not.toBeDisabled();
        await fireEvent.click(nextTaskButton);
        expect(nextTaskButton).toBeDisabled();
        await tick();
        await tick();
        expect(nextTaskButton).not.toBeDisabled();

        expect(prevTaskButton).not.toBeDisabled();
        await fireEvent.click(prevTaskButton);
        expect(prevTaskButton).toBeDisabled();
        await tick();
        await tick();
        expect(prevTaskButton).not.toBeDisabled();
    });
});
