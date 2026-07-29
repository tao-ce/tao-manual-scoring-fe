// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { render, screen } from '@testing-library/svelte';
import TaskSummaryScore from './TaskSummaryScore.svelte';

describe('TaskSummaryScore', () => {
    it('displays minimal score when outcome values present', () => {
        const scores = [
            {
                label: 'Alice',
                outcomeDeclarations: [{ value: 5 }, { value: 3 }, { value: 4 }]
            }
        ];

        render(TaskSummaryScore, { scores });

        // label
        expect(screen.getByText('Alice')).toBeInTheDocument();

        // minimal value is 3
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays minimal score as string based on scale if it is present', () => {
        const scoringScale = { scale: { 1: 'A1', 2: 'A2', 3: 'A3', 4: 'A4', 5: 'A5' } };
        const scores = [
            {
                label: 'Alice',
                outcomeDeclarations: [
                    { value: 5, scoringScale },
                    { value: 3, scoringScale },
                    { value: 4, scoringScale }
                ]
            }
        ];

        render(TaskSummaryScore, { scores });

        // label
        expect(screen.getByText('Alice')).toBeInTheDocument();

        // minimal value is 3
        expect(screen.getByText('A3')).toBeInTheDocument();
    });

    it('displays "Suspected of cheating" message when flagged', () => {
        const scores = [
            {
                label: 'Alice',
                outcomeDeclarations: [],
                deliveryExecutionScoring: { suspicious: true }
            }
        ];

        render(TaskSummaryScore, { scores });

        // label
        expect(screen.getByText('Alice')).toBeInTheDocument();

        // REVIEW_MESSAGES.suspicious should be shown alone
        expect(screen.getByText(/Suspected of cheating/)).toBeInTheDocument();
    });

    it('displays "Not enough basis for assessment" message when flagged', () => {
        const scores = [
            {
                label: 'Alice',
                outcomeDeclarations: [{ value: 5 }, { value: 3 }, { value: 4 }],
                deliveryExecutionScoring: { notEnoughBasisForAssessment: true }
            }
        ];

        render(TaskSummaryScore, { scores });

        // label
        expect(screen.getByText('Alice')).toBeInTheDocument();

        // REVIEW_MESSAGES.notEnoughBasisForAssessment should be shown with the score
        expect(screen.getByText(/Not enough basis for assessment/)).toBeInTheDocument();
    });

    it('displays dash when no outcome values present', () => {
        const scores = [
            {
                label: 'Bob',
                outcomeDeclarations: []
            }
        ];

        render(TaskSummaryScore, { scores });

        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('-')).toBeInTheDocument();
    });
});
