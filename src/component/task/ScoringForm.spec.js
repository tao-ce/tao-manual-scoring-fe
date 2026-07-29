// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

import { render, waitFor } from '@testing-library/svelte';
import ScoringForm from './ScoringForm.svelte';
import * as userConfigurationService from '../../services/userConfigurationService';

jest.mock('../../services/scoreSuggestionService', () => ({
    getScoringSuggestion() {
        return Promise.resolve([
            {
                qtiIdentifier: 'Understanding',
                suggestedScore: 3,
                explanation: 'foo'
            },
            {
                qtiIdentifier: 'Word Choice',
                suggestedScore: 2,
                explanation: 'foo'
            }
        ]);
    }
}));

describe('ScoringForm', () => {
    it('renders correctly', () => {
        userConfigurationService.setConfig({
            isSuggestedScoringEnabled: false,
            isMarkAsSuspiciousForCheatingEnabled: true,
            isMarkAsNotEnoughBasisForAssessment: true
        });
        const { container } = render(ScoringForm, {
            props: {
                taskId: 'test-task-id',
                outcomeDeclarations: [
                    {
                        interpretation: 'interpretation',
                        longInterpretation: 'longInterpretation',
                        taskScoreId: 'taskScoreId',
                        outcomeDeclarationId: 'outcomeDeclarationId',
                        value: '1',
                        minimumValue: 0,
                        maximumValue: 1,
                        qtiIdentifier: 'id'
                    }
                ],
                deliveryExecutionScoring: {
                    suspicious: false,
                    suspiciousNote: '',
                    notEnoughBasisForAssessment: false,
                    notEnoughBasisForAssessmentNote: ''
                },
                note: ''
            }
        });

        expect(container).toMatchSnapshot();
    });

    it('renders without note box', () => {
        userConfigurationService.setConfig({
            isSuggestedScoringEnabled: false,
            isMarkAsSuspiciousForCheatingEnabled: true,
            isMarkAsNotEnoughBasisForAssessment: true
        });
        const { container } = render(ScoringForm, {
            props: {
                taskId: 'test-task-id',
                outcomeDeclarations: [
                    {
                        interpretation: 'interpretation',
                        longInterpretation: 'longInterpretation',
                        taskScoreId: 'taskScoreId',
                        outcomeDeclarationId: 'outcomeDeclarationId',
                        value: '1',
                        minimumValue: 0,
                        maximumValue: 1,
                        qtiIdentifier: 'id'
                    }
                ],
                deliveryExecutionScoring: {
                    suspicious: true,
                    suspiciousNote: 'Note',
                    notEnoughBasisForAssessment: true,
                    notEnoughBasisForAssessmentNote: 'Some notes'
                },
                note: '',
                hideNoteBox: true
            }
        });

        expect(container).toMatchSnapshot();
    });

    it('renders with scoring suggestion button', () => {
        userConfigurationService.setConfig({
            isSuggestedScoringEnabled: true
        });
        const { container } = render(ScoringForm, {
            props: {
                taskId: 'test-task-id',
                outcomeDeclarations: [
                    {
                        interpretation: 'interpretation',
                        longInterpretation: 'longInterpretation',
                        taskScoreId: 'taskScoreId',
                        outcomeDeclarationId: 'outcomeDeclarationId',
                        value: '1',
                        minimumValue: 0,
                        maximumValue: 1,
                        qtiIdentifier: 'id'
                    }
                ],
                deliveryExecutionScoring: {
                    suspicious: false,
                    suspiciousNote: '',
                    notEnoughBasisForAssessment: false,
                    notEnoughBasisForAssessmentNote: ''
                },
                note: ''
            }
        });

        expect(container).toMatchSnapshot();
    });

    it('renders without suspicious and not enough basis fields', () => {
        userConfigurationService.setConfig({
            isSuggestedScoringEnabled: true,
            isMarkAsSuspiciousForCheatingEnabled: false,
            isMarkAsNotEnoughBasisForAssessment: false
        });
        const { container } = render(ScoringForm, {
            props: {
                taskId: 'test-task-id',
                outcomeDeclarations: [
                    {
                        interpretation: 'interpretation',
                        longInterpretation: 'longInterpretation',
                        taskScoreId: 'taskScoreId',
                        outcomeDeclarationId: 'outcomeDeclarationId',
                        value: '1',
                        minimumValue: 0,
                        maximumValue: 1,
                        qtiIdentifier: 'id'
                    }
                ],
                note: ''
            }
        });

        expect(container).toMatchSnapshot();
    });

    it('renders with suspicious fields', async () => {
        userConfigurationService.setConfig({
            isSuggestedScoringEnabled: false,
            isMarkAsSuspiciousForCheatingEnabled: true,
            isMarkAsNotEnoughBasisForAssessment: false
        });
        const { container, getByText } = render(ScoringForm, {
            props: {
                taskId: 'test-task-id',
                outcomeDeclarations: [
                    {
                        interpretation: 'interpretation',
                        longInterpretation: 'longInterpretation',
                        taskScoreId: 'taskScoreId',
                        outcomeDeclarationId: 'outcomeDeclarationId',
                        value: '1',
                        minimumValue: 0,
                        maximumValue: 1,
                        qtiIdentifier: 'id'
                    }
                ],
                deliveryExecutionScoring: {
                    suspicious: true,
                    suspiciousNote: '',
                    notEnoughBasisForAssessment: false,
                    notEnoughBasisForAssessmentNote: ''
                },
                note: ''
            }
        });

        await waitFor(() => expect(getByText('Suspected of cheating')).not.toBeNull(), { timeout: 1000 });
        expect(container).toMatchSnapshot();
    });

    it('renders with not enough basis fields', async () => {
        userConfigurationService.setConfig({
            isSuggestedScoringEnabled: false,
            isMarkAsSuspiciousForCheatingEnabled: false,
            isMarkAsNotEnoughBasisForAssessment: true
        });
        const { container, getByText } = render(ScoringForm, {
            props: {
                taskId: 'test-task-id',
                outcomeDeclarations: [
                    {
                        interpretation: 'interpretation',
                        longInterpretation: 'longInterpretation',
                        taskScoreId: 'taskScoreId',
                        outcomeDeclarationId: 'outcomeDeclarationId',
                        value: '1',
                        minimumValue: 0,
                        maximumValue: 1,
                        qtiIdentifier: 'id'
                    }
                ],
                deliveryExecutionScoring: {
                    suspicious: false,
                    suspiciousNote: '',
                    notEnoughBasisForAssessment: true,
                    notEnoughBasisForAssessmentNote: ''
                },
                note: ''
            }
        });

        await waitFor(() => expect(getByText('Not Enough Basis for Assessment')).not.toBeNull(), { timeout: 1000 });
        expect(container).toMatchSnapshot();
    });
});
