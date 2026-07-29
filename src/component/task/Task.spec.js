// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@/core/apiRequest/apiRequest');
jest.mock('@/core/router');
jest.mock('@/component/task/ItemPreviewer');
jest.mock('@/component/task/ScoringCriteria');
jest.mock('@/services/authService');

import { taskStore } from '@/store/taskStore';
import * as taskUtils from '@/core/utils/task';
import { wait } from '@/core/utils/async';
import { fireEvent, getByTitle, render, waitFor, getByRole as getByRoleWithContainer } from '@testing-library/svelte';
import Task from './Task.svelte';
import * as taskService from '../../services/taskService';
import router from '@/core/router';
import * as ltiService from '../../services/ltiService';
import { tick } from 'svelte';
import * as userConfigurationService from '../../services/userConfigurationService';
import * as authService from '@/services/authService';

const defaultUserConfig = {
    isSuggestedScoringEnabled: false,
    isMarkAsSuspiciousForCheatingEnabled: true,
    is_item_review_highlighter_enabled: true,
    is_item_review_marking_symbols_enabled: true
};

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
        ltiItemPreviewerLinks: {
            mariaReview1: {
                url: 'https://sds-tao-1.docker.localhost/ltiOutcomeUi/It…23i61127b43681064369d09cb8c9e44642&itemRef=item-1',
                parameters: {}
            }
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
            id: '01K8AQ34B3896E4XD471MYPC54',
            userId: 'mariaReview1',
            suspicious: true,
            suspiciousNote: 'Suspicious note',
            notEnoughBasisForAssessment: true,
            notEnoughBasisForAssessmentNote: 'Not basis for assessment note',
            note: 'Delivery note'
        },
        linkedTasks: [
            {
                id: '01FCR37KDMCK57ZMN0AJS2Z55J',
                note: "I'm a linked to Score 1",
                highlights: [],
                outcomeDeclarations: [
                    {
                        taskScoreId: '01K4A053TNJRKS63Q31NYFM6H2',
                        outcomeDeclarationId: '01JZPZ6FNSBWJNCBW3QQNVSMSG',
                        qtiIdentifier: 'OUTCOME_1',
                        value: 2
                    }
                ],
                enrollment: {
                    userName: 'Maria'
                },
                scoringViolation: true
            }
        ],
        linkedTasksDeliveryExecutionScoring: []
    }
});

describe('Task', () => {
    beforeEach(() => {
        window.localStorage.clear();
        userConfigurationService.setConfig(defaultUserConfig);

        taskStore.reset();
        jest.clearAllMocks();

        authService.getUser = jest.fn().mockResolvedValue({
            userData: {
                login: 'mariaReview1'
            }
        });

        ltiService.getConfig = jest.fn().mockReturnValue({
            testTakerName: 'Foo Bar Baz',
            isReadOnly: false,
        });
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

    describe('Rendering', () => {
        it('renders correctly TaskContainer', async () => {
            taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { container, getByLabelText, getByText } = render(Task, {
                taskId,
                deliveryId
            });

            await waitFor(() => expect(getByLabelText('Scoring')).not.toBeNull(), { timeout: 2000 });
            await fireEvent.click(getByText('dispatch item preview success'));

            expect(container).toMatchSnapshot();
        });

        it('renders page for scorer', async () => {
            const response = getTaskResponse();
            taskUtils.saveLocalTaskData = jest.fn();

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.getServerTaskData = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { container, getByText, getByLabelText, queryByText } = render(Task, {
                taskId,
                deliveryId
            });

            await waitFor(() => expect(getByLabelText('Test taker response')).not.toBeNull(), { timeout: 1000 });
            await waitFor(() => expect(queryByText('Suspected of suspicious')).toBeNull(), { timeout: 1000 });
            await fireEvent.click(getByText('dispatch item preview success'));

            expect(container).toMatchSnapshot();
        });

        it('renders page for scorer without not enough basis for assessment fields', async () => {
            const response = getTaskResponse();
            delete response._meta.deliveryExecutionScoring;
            taskUtils.saveLocalTaskData = jest.fn();

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.getServerTaskData = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { container, getByText, getByLabelText, queryByText } = render(Task, {
                taskId,
                deliveryId
            });

            await waitFor(() => expect(getByLabelText('Test taker response')).not.toBeNull(), { timeout: 1000 });
            await waitFor(() => expect(queryByText('Not Enough Basis for Assessment')).toBeNull(), { timeout: 1000 });
            await fireEvent.click(getByText('dispatch item preview success'));

            expect(container).toMatchSnapshot();
        });

        it('renders page for scorer with not enough basis for assessment fields', async () => {
            const response = getTaskResponse();
            taskUtils.saveLocalTaskData = jest.fn();
            userConfigurationService.setConfig({
                ...defaultUserConfig,
                isMarkAsSuspiciousForCheatingEnabled: false,
                isMarkAsNotEnoughBasisForAssessment: true
            });

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.getServerTaskData = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { container, getByText, getByLabelText, queryByText, queryByRole } = render(Task, {
                taskId,
                deliveryId
            });

            const submitButton = queryByRole('button', { name: /send scores/i });
            expect(submitButton).not.toBeDisabled();
            await waitFor(() => expect(getByLabelText('Test taker response')).not.toBeNull(), { timeout: 1000 });
            await waitFor(() => expect(queryByText('Not Enough Basis for Assessment')).not.toBeNull(), {
                timeout: 1000
            });
            await fireEvent.click(getByText('dispatch item preview success'));

            expect(container).toMatchSnapshot();
        });

        it('renders page for scorer with note disabled', async () => {
            const response = getTaskResponse();
            taskUtils.saveLocalTaskData = jest.fn();
            userConfigurationService.setConfig({
                ...defaultUserConfig,
                isMarkAsSuspiciousForCheatingEnabled: false,
                isMarkAsNotEnoughBasisForAssessment: false
            });

            ltiService.getConfig = jest.fn().mockReturnValue({
                isReadOnly: true
            });

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.getServerTaskData = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { container, queryByRole, getByPlaceholderText } = render(Task, {
                taskId,
                deliveryId
            });

            const submitButton = queryByRole('button', { name: /send scores/i });
            expect(submitButton).toBeDisabled();
            await waitFor(() => expect(getByPlaceholderText('Type a note for this review')).toBeDisabled(), {
                timeout: 1000
            });

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

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { container, getByLabelText, getByPlaceholderText, getByText } = render(Task, {
                taskId,
                deliveryId
            });

            await waitFor(() => expect(getByLabelText('Test taker response')).not.toBeNull(), { timeout: 1000 });
            await fireEvent.click(getByText('dispatch item preview success'));

            expect(getByPlaceholderText('Type a note for this review')).not.toBeNull();
            expect(container).toMatchSnapshot();
        });

        it('hides back button and breadcrumbs for lti users if no return url provided', async () => {
            const response = getTaskResponse();
            ltiService.getConfig = jest.fn().mockReturnValue({
                ltiResourceLabel: 'lti return link breadcrumbs label'
            });
            taskService.getTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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

        it('shows test taker name, if it is provided in LTI launch', async () => {
            taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());
            ltiService.getConfig = jest.fn().mockReturnValue({
                testTakerName: 'Foo Bar Baz'
            });

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { container, getByLabelText } = render(Task, {
                taskId,
                deliveryId
            });

            await waitFor(() => expect(getByLabelText('Scoring')).not.toBeNull(), { timeout: 2000 });
            expect(container.querySelector('.scoring-header')).toMatchSnapshot();
        });

        it.skip('enables scorer only to change task data when item preview succesfully loaded', async () => {
            const response = getTaskResponse();
            taskService.getTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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


        it('shows interrupted modal when the admin reopen the test', async () => {
            const response = getTaskResponse();
            response._meta.interrupted = true;
            taskService.getTask = jest.fn().mockResolvedValue(response);
            ltiService.getConfig = jest.fn().mockReturnValue({
                testTakerName: 'Foo Bar Baz'
            });

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { queryByRole, getByLabelText } = render(Task, {
                taskId,
                deliveryId
            });

            await waitFor(() => expect(getByLabelText('Session Interrupted')).not.toBeNull(), { timeout: 2000 });
            const backButton = queryByRole('button', { name: /return to session/i });
            expect(backButton).toBeInTheDocument();
        });
    });

    describe.skip('Redirects', () => {
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

            await waitFor(() => expect(ltiService.redirectToReturnUrl).toHaveBeenCalled(), { timeout: 4000 });
            expect(taskService.submitLTITasks).toHaveBeenCalledWith('scoring', 'task_id_123');
            expect(ltiService.redirectToReturnUrl).toHaveBeenCalledWith('https://example.com');
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
            expect(taskService.submitLTITasks).toHaveBeenCalledWith('scoring', 'task_id_123');
            expect(ltiService.redirectToReturnUrl).not.toHaveBeenCalled();
            expect(router.redirect).toHaveBeenCalledWith('/submitted');
        });
    });

    describe('Delivery overview', () => {
        it('opens delivery overview', async () => {
            const response = getTaskResponse();

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.updateTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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

            await waitFor(() => expect(openDeliveryHandler).toHaveBeenCalled());
        });

        it('opens delivery overview only once', async () => {
            const response = getTaskResponse();

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.updateTask = jest.fn().mockResolvedValue({});

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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
    });

    describe('Navigation', () => {
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

                await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
                const { getByRole } = render(Task, {
                    taskId,
                    deliveryId
                });

                await waitFor(() => expect(getByRole('progressbar')).toBeInTheDocument(), { timeout: 2000 });

                expect(getByRole('progressbar').textContent.trim()).toBe(`Completion: ${progress} %`);
            }
        );

        it('opens previously scored task', async () => {
            const response = getTaskResponse();

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.formatTaskData = jest.fn().mockReturnValue({});
            taskService.updateTask = jest.fn().mockResolvedValue({});
            taskStore.loadNextTask = jest.fn(taskStore.loadNextTask);
            taskStore.set = jest.fn();

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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
            expect(taskService.formatTaskData).toHaveBeenCalled();
            expect(taskService.updateTask).toHaveBeenCalled();
        });

        it('opens next scored task', async () => {
            const response = getTaskResponse();

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.formatTaskData = jest.fn().mockReturnValue({});
            taskService.updateTask = jest.fn().mockResolvedValue({});
            taskStore.loadNextTask = jest.fn(taskStore.loadNextTask);
            taskStore.set = jest.fn();

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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
            expect(taskService.formatTaskData).toHaveBeenCalled();
            expect(taskService.updateTask).toHaveBeenCalled();
        });
    });

    describe('Tools', () => {
        it('changes bookmark state on click', async () => {
            const response = getTaskResponse();
            taskService.getTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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

        it('shows highlighter tool', async () => {
            const response = getTaskResponse();
            taskService.getTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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

        it.skip('opens scoring criteria pdf', async () => {
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

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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
    });

    describe('Error handling', () => {
        it('shows item preview error message', async () => {
            const response = getTaskResponse();
            taskService.getTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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
            expect(router.redirect).toHaveBeenCalledWith('/scoringprojects');
        });

        it('shows interrupted test dialog', async () => {
            // Prepare
            taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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
                    message: 'Cannot score delivery executions while the session is interrupted.'
                },
                interrupted: true
            });
            taskService.updateTask = jest.fn().mockRejectedValue({
                responseStatus: 409,
                error: {
                    message: 'Cannot score delivery executions while the session is interrupted.'
                },
                interrupted: true
            });

            await fireEvent.click(getByRole('button', { name: /see overview/i }));
            await wait(0);

            // Check
            expect(getByText('Session Interrupted')).toBeVisible();
            await fireEvent.click(getByText('Return to session'));
            expect(router.redirect).toHaveBeenCalledWith('/submitted');
        });

        it('shows out-of-range modal, if too high/low score is submitted', async () => {
            // Prepare
            const response = getTaskResponse();
            taskService.getTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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
            expect(router.redirect).not.toHaveBeenCalled();
        });

        it('shows out-of-range modal, if the task was submitted', async () => {
            // Prepare
            const response = getTaskResponse();
            taskService.getTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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
            expect(router.redirect).not.toHaveBeenCalled();
        });

        it('shows dialog when have a server error and return to sessions', async () => {
            // Prepare
            const response = getTaskResponse();
            taskService.getTask = jest.fn().mockResolvedValue(response);

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
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
            expect(router.redirect).toHaveBeenCalled();
        });
    });

    it.skip('enables submit after scoring last unscored task', async () => {
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

        await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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

    it('disables double click behaviour for next and previous buttons', async () => {
        const response = getTaskResponse();

        taskService.getTask = jest.fn().mockResolvedValue(response);
        taskService.formatTaskData = jest.fn().mockReturnValue({});
        taskService.updateTask = jest.fn().mockResolvedValue({});
        taskStore.updateSuspiciousAndNotEnoughBasis = jest.fn().mockResolvedValue({});
        taskStore.loadNextTask = jest.fn(async () => {
            await tick();
        });
        taskStore.set = jest.fn();

        await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

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

    describe('Table-driven LTI scenarios', () => {
        const cases = [
            [
                'Certification product - Blind scorer - scoring',
                { isReview: false, isReadOnly: false, isAdministrative: false },
                { scorersToReview: null, linkedTasks: [] },
                { tabs: false, myFinal: false, uiEnabled: true }
            ],
            [
                'Certification product - Blind scorer - view scores',
                { isReview: false, isReadOnly: true, isAdministrative: false },
                { scorersToReview: null, linkedTasks: [] },
                { tabs: false, myFinal: false, uiEnabled: false }
            ],
            [
                'Certification product - Admin review',
                { isReview: true, isReadOnly: false, isAdministrative: true },
                { scorersToReview: [], linkedTasks: [] },
                { tabs: true, myFinal: true, uiEnabled: true }
            ],
            [
                'Non-certification product - Scorer - scoring',
                { isReview: false, isReadOnly: false, isAdministrative: false },
                { scorersToReview: null, linkedTasks: [] },
                { tabs: false, myFinal: false, uiEnabled: true }
            ],
            [
                'Non-certification product - Scorer - view only',
                { isReview: false, isReadOnly: true, isAdministrative: false },
                { scorersToReview: null, linkedTasks: [] },
                { tabs: false, myFinal: false, uiEnabled: false }
            ],
            [
                'Non-certification product - Reviewer - review',
                { isReview: true, isReadOnly: false, isAdministrative: false },
                { scorersToReview: [{ userId: 'scorer-1' }], linkedTasks: [] },
                { tabs: true, myFinal: true, uiEnabled: true }
            ],
            [
                'Non-certification product - Reviewer - review (no scorers)',
                { isReview: true, isReadOnly: false, isAdministrative: false },
                { scorersToReview: null, linkedTasks: [] },
                { tabs: false, myFinal: false, uiEnabled: true }
            ],
            [
                'Non-certification product - Reviewer - view only',
                { isReview: true, isReadOnly: true, isAdministrative: false },
                { scorersToReview: [{ userId: 'scorer-1' }], linkedTasks: [] },
                { tabs: true, myFinal: true, uiEnabled: false }
            ],
            [
                'Non-certification product - Group Manager/Admin - view only - (1 scorer - scorer only)',
                { isReview: true, isReadOnly: true, isAdministrative: true },
                { scorersToReview: [{ userId: 'scorer-1' }], linkedTasks: [] },
                { tabs: true, myFinal: false, uiEnabled: false }
            ],
            [
                'Non-certification product - Group Manager/Admin - view only - (2 scorers - scorer + reviewer) ',
                { isReview: true, isReadOnly: true, isAdministrative: true },
                { scorersToReview: [{ userId: 'scorer-1' }, { userId: 'reviewer-2' }], linkedTasks: [] },
                { tabs: true, myFinal: false, uiEnabled: false }
            ]
        ];

        cases.forEach(([title, ltiClaims, dataFlags, expectations]) => {
            it(title, async () => {
                const response = getTaskResponse();
                response._meta.linkedTasks = dataFlags.linkedTasks || [];

                taskService.getTask = jest.fn().mockResolvedValue(response);

                const ltiConfig = { ...ltiClaims };
                if (dataFlags.scorersToReview !== null) ltiConfig.scorersToReview = dataFlags.scorersToReview;

                ltiService.getConfig = jest.fn().mockReturnValue(ltiConfig);

                await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

                const { container, queryByRole, queryByText, getByRole, getByText, queryAllByPlaceholderText } = render(Task, { taskId, deliveryId });

                if (expectations.tabs) {
                    await waitFor(() => expect(getByRole('tablist')).toBeTruthy());
                } else {
                    await waitFor(() => expect(queryByRole('tablist')).toBeNull());
                }

                // `myFinal` is a separate expectation: the presence of the "My final score" tab
                if (expectations.myFinal) {
                    await waitFor(() => expect(getByRole('tab', { name: /My final score/i })).toBeTruthy());
                } else {
                    expect(queryByText('My final score')).toBeNull();
                }

                await fireEvent.click(getByText('dispatch item preview success'));

                const outcomeEls = Array.from(container.querySelectorAll('input[name^="OUTCOME_"]'));

                if (outcomeEls.length > 0) {
                    if (expectations.uiEnabled) {
                        expect(outcomeEls.some(el => !el.disabled)).toBeTruthy();
                    } else {
                        expect(outcomeEls.every(el => el.disabled)).toBeTruthy();
                    }
                } else {
                    const noteAnswers = queryAllByPlaceholderText('Type a note for this answer');
                    const noteReviews = queryAllByPlaceholderText('Type a note for this review');
                    const noteEls = [...noteAnswers, ...noteReviews];

                    if (noteEls.length > 0) {
                        if (expectations.uiEnabled) {
                            expect(noteEls.some(el => !el.disabled)).toBeTruthy();
                        } else {
                            expect(noteEls.every(el => el.disabled)).toBeTruthy();
                        }
                    }
                }
            });
        });
    });

    describe('onOverviewClick - note handling', () => {
        const linkedTaskId = 'linked_task_id_1';

        const getReviewTaskResponse = () => {
            const response = getTaskResponse();
            response.data.note = 'My own note';
            response._meta.linkedTasks = [
                {
                    id: linkedTaskId,
                    note: 'Another scorer note',
                    highlights: [],
                    outcomeDeclarations: [],
                    enrollment: { userName: 'scorer-1' }
                }
            ];
            return response;
        };

        it('calls updateNote with task.note when on own (admin) tab', async () => {
            taskService.getTask = jest.fn().mockResolvedValue(getReviewTaskResponse());
            taskService.updateTask = jest.fn().mockResolvedValue({});
            const updateNoteSpy = jest.spyOn(taskStore, 'updateNote');

            ltiService.getConfig = jest.fn().mockReturnValue({
                isReview: true,
                isAdministrative: true,
                scorersToReview: [{ userId: 'scorer-1' }]
            });

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { getByRole } = render(Task, { taskId, deliveryId });

            await waitFor(() => expect(getByRole('button', { name: /see overview/i })).toBeInTheDocument(), {
                timeout: 2000
            });

            await fireEvent.click(getByRole('button', { name: /see overview/i }));

            expect(updateNoteSpy).toHaveBeenCalledWith('My own note');
            expect(updateNoteSpy).not.toHaveBeenCalledWith('Another scorer note');
        });

        it('does not call updateNote when on another scorer tab', async () => {
            taskService.getTask = jest.fn().mockResolvedValue(getReviewTaskResponse());
            taskService.updateTask = jest.fn().mockResolvedValue({});
            const updateNoteSpy = jest.spyOn(taskStore, 'updateNote');

            ltiService.getConfig = jest.fn().mockReturnValue({
                isReview: true,
                isAdministrative: true,
                scorersToReview: [{ userId: 'scorer-1' }]
            });

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');
            taskStore.updateAdminReviewListActiveTab(linkedTaskId);

            const { getByRole } = render(Task, { taskId, deliveryId });

            await waitFor(() => expect(getByRole('button', { name: /see overview/i })).toBeInTheDocument(), {
                timeout: 2000
            });

            await fireEvent.click(getByRole('button', { name: /see overview/i }));

            expect(updateNoteSpy).not.toHaveBeenCalled();
        });

        it('does not call updateNote when there are no review tabs', async () => {
            const response = getTaskResponse();
            response.data.note = 'My own note';
            response._meta.linkedTasks = [];

            taskService.getTask = jest.fn().mockResolvedValue(response);
            taskService.updateTask = jest.fn().mockResolvedValue({});
            const updateNoteSpy = jest.spyOn(taskStore, 'updateNote');

            ltiService.getConfig = jest.fn().mockReturnValue({
                isReview: false,
                isReadOnly: false
            });

            await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

            const { getByRole } = render(Task, { taskId, deliveryId });

            await waitFor(() => expect(getByRole('button', { name: /see overview/i })).toBeInTheDocument(), {
                timeout: 2000
            });

            await fireEvent.click(getByRole('button', { name: /see overview/i }));

            expect(updateNoteSpy).not.toHaveBeenCalled();
        });
    });
});
