// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2023 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
jest.mock('module');

import { render } from '@testing-library/svelte';
import * as taskService from '../../services/taskService';
import * as ltiService from '../../services/ltiService';
import TaskAdminMode from './TaskAdminMode.svelte';
import { taskStore } from '../../store/taskStore';

const getTaskResponse = () => ({
    data: {
        id: '01FCR37KDMCK57ZMN0AJS2Z55J',
        item: { title: 'Item 1' },
        note: '',
        outcomeDeclarations: [
            {
                taskScoreId: "01K4A053TNJRKS63Q31NYFM6H2",
                outcomeDeclarationId: "01JZPZ6FNSBWJNCBW3QQNVSMSG",
                qtiIdentifier: "OUTCOME_1",
                value: null
            }
        ],
        status: 'scored',
        test: { title: 'Test 2' }
    },
    _meta: {
        deliveryExecutionScoring: {
            id: "01JZPZ6FNSBWJNCBW3QQNVSMSG",
            suspicious: true,
            suspiciousNote: 'Suspicious note',
            note: 'Delivery note'
        },
        linkedTasks: [
            {
                id: '01FCR37KDMCK57ZMN0AJS2Z55J',
                note: "I'm a linked to Score 1",
                outcomeDeclarations: [
                    {
                        taskScoreId: "01K4A053TNJRKS63Q31NYFM6H2",
                        outcomeDeclarationId: "01JZPZ6FNSBWJNCBW3QQNVSMSG",
                        qtiIdentifier: "OUTCOME_1",
                        value: 2
                    }
                ],
                enrollment: {
                    userName: "Maria"
                },
                scoringViolation: true
            }
        ],
        linkedTasksDeliveryExecutionScoring: [
            {
                id: '01K8AQCA92206XQ6C0GFGR8V57',
                userId: 'Maria',
                note: null,
                suspicious: true,
                suspiciousNote: null,
                notEnoughBasisForAssessment: false,
                notEnoughBasisForAssessmentNote: null,
                deliveryExecutionId: '4TTairam#9cdff0b1b62f#0a92fab3230134cca6eadd9898325b9b2ae67998#local-dev-acc.nextgen-stack-local'
            },
        ]
    }
});

describe('TaskAdminMode', () => {
    beforeEach(() => {
        taskStore.reset();
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { container } = render(TaskAdminMode);
        // only snapshot the first child to avoid the extra wrapper div that
        // Testing Library occasionally inserts when the store updates
        expect(container).toMatchSnapshot();
    });

    it('renders correctly with previous scores', async() => {
        taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());
        ltiService.getConfig = jest.fn().mockReturnValue({
            testTakerName: 'Foo Bar Baz',
            isReview: true,
            scorersToReview: [],
            isAppeal: false,
            isReadOnly: false
        });

        await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

        const { container } = render(TaskAdminMode);
        expect(container).toMatchSnapshot();
    });

    it('renders correctly without previous scores when read only', async() => {
        taskService.getTask = jest.fn().mockResolvedValue(getTaskResponse());
        ltiService.getConfig = jest.fn().mockReturnValue({
            testTakerName: 'Foo Bar Baz',
            isReview: true,
            scorersToReview: [],
            isAppeal: false,
            isReadOnly: true
        });

        await taskStore.loadTask('01FCR37KDMCK57ZMN0AJS2Z55J', 'en-US');

        const { container } = render(TaskAdminMode);
        expect(container).toMatchSnapshot();
    });
});
