// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
import { render, fireEvent } from '@testing-library/svelte';
import OutcomeDeclaration, {
    OUTCOME_DECLARATION_TYPES
} from './OutcomeDeclaration.svelte';
import { tick } from 'svelte';

describe('OutcomeDeclaration', () => {
    const defaultProps = {
        interpretation: 'Test Interpretation',
        longInterpretation: 'http://example.com',
        qtiIdentifier: 'test-id',
        disabled: false,
        inputOptions: {}
    };

    describe('types', () => {
        describe('normal', () => {
            it('should dispatch undefined when value is unselected (empty input)', async () => {
                const { container, component } = render(OutcomeDeclaration, {
                    ...defaultProps,
                    type: OUTCOME_DECLARATION_TYPES.NORMAL,
                    inputOptions: {
                        items: [
                            { label: '0', value: '0' },
                            { label: '1', value: '1' },
                            { label: '2', value: '2' },
                            { label: '3', value: '3' },
                            { label: '4', value: '4' },
                            { label: '5', value: '5' }
                        ],
                        selected: '3',
                        showSelectionStatus: true
                    }
                });

                const mockChangeHandler = jest.fn();

                const radio = container.querySelector('input[type="radio"][value="3"]');

                component.$on('change', mockChangeHandler);
                await fireEvent.click(radio); // Unselect the score

                expect(mockChangeHandler).toHaveBeenCalledWith(
                    expect.objectContaining({ detail: { value: void 0 } })
                );
            });

            it('should dispatch selected value when valid input is provided', async () => {
                const { container, component } = render(OutcomeDeclaration, {
                    ...defaultProps,
                    type: OUTCOME_DECLARATION_TYPES.NORMAL,
                    inputOptions: {
                        items: [
                            { label: '0', value: 0 },
                            { label: '1', value: 1 },
                            { label: '2', value: 2 },
                            { label: '3', value: 3 },
                            { label: '4', value: 4 },
                            { label: '5', value: 5 }
                        ],
                        selected: null,
                        showSelectionStatus: true
                    }
                });

                const mockChangeHandler = jest.fn();
                component.$on('change', mockChangeHandler);

                const radio = container.querySelector('input[type="radio"][value="3"]');

                await fireEvent.click(radio);

                expect(mockChangeHandler).toHaveBeenCalledWith(
                    expect.objectContaining({ detail: { value: 3 } })
                );
            });
        });

        describe('scale', () => {
            it('should dispatch selected value when a valid option is selected', async () => {
                const { container, component } = render(OutcomeDeclaration, {
                    ...defaultProps,
                    type: OUTCOME_DECLARATION_TYPES.SCALE,
                    inputOptions: { options: [{ label: 'Option 1', value: '1' }] },
                });

                const mockChangeHandler = jest.fn();
                component.$on('change', mockChangeHandler);

                const control = container.querySelector('.control');
                await fireEvent.mouseDown(control);
                const option = container.querySelector('.option');
                await fireEvent.click(option);

                expect(mockChangeHandler).toHaveBeenCalledWith(
                    expect.objectContaining({ detail: { value: '1' } })
                );
            });

            it('should dispatch undefined when value is unselected (empty dropdown)', async () => {
                const { container, component } = render(OutcomeDeclaration, {
                    ...defaultProps,
                    type: OUTCOME_DECLARATION_TYPES.SCALE,
                    inputOptions: { options: [{ label: 'Option 1', value: '1' }] },
                });

                const mockChangeHandler = jest.fn();

                const control = container.querySelector('.control');
                await fireEvent.mouseDown(control);
                const option = container.querySelector('.option');
                await fireEvent.click(option);
                await tick();
                component.$on('change', mockChangeHandler);
                await fireEvent.click(option);

                expect(mockChangeHandler).toHaveBeenCalledWith(
                    expect.objectContaining({ detail: { value: void 0 } })
                );
            });
        });
    });
});