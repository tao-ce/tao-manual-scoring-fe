// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021-2025 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');
jest.mock('@oat-sa-private/ui-core', () => ({
    ...jest.requireActual('@oat-sa-private/ui-core'),
    generateElementId: jest.fn().mockImplementation(prefix => prefix)
}));

import { render, waitFor, fireEvent } from '@testing-library/svelte';
import DeliveryTable from './DeliveryTable.svelte';

const taskGroup = {
    deliveryId: 'task-delivery-id-1',
    outcomeDeclarations: [
        {
            id: 'outcome-name-1',
            normalMinimum: 0,
            normalMaximum: 5
        }
    ],
    tasks: [
        {
            id: 'task-id-1',
            note: 'note-1',
            bookmarked: false,
            itemId: 'item-1',
            outcomeDeclarations: [
                {
                    id: 'outcome-name-1',
                    minimumValue: 0,
                    maximumValue: 5,
                    value: 1,
                    previousValues: []
                }
            ],
            totalScore: {
                value: 3,
                maximumValue: 5
            }
        },
        {
            id: 'task-id-2',
            note: '',
            bookmarked: true,
            itemId: 'item-1',
            outcomeDeclarations: [
                {
                    id: 'GRAMMAR',
                    interpretation: 'Grammer',
                    longInterpretation: null,
                    minimumValue: 0,
                    maximumValue: 5,
                    value: 0,
                    previousValues: []
                }
            ],
            totalScore: {
                value: 0,
                maximumValue: 5
            },
            scoringViolation: {
                description: "The scorer doesn't understand the context of the item"
            }
        },
        {
            id: 'task-id-3',
            note: '',
            bookmarked: false,
            itemId: 'item-3',
            outcomeDeclarations: [
                {
                    id: 'outcome-name-3',
                    minimumValue: 0,
                    maximumValue: 5,
                    value: 2,
                    previousValues: [],
                    scoringScale: {
                        scale: {
                            1: 'Under A1',
                            2: 'A1',
                            3: 'A2',
                            4: 'B1',
                            5: 'B2'
                        }
                    }
                }
            ],
            totalScore: {
                value: 2,
                maximumValue: 5
            }
        }
    ]
};

describe('Delivery overview', () => {
    it('renders correctly', async () => {
        const { container } = render(DeliveryTable, {
            props: {
                totalScoreText: 'Total score',
                taskGroup
            }
        });

        expect(container).toMatchSnapshot();
    });
    it('show and hide note', async () => {
        const { container, getAllByLabelText, getByText, queryByText } = render(DeliveryTable, {
            props: {
                totalScoreText: 'Total score',
                activeItemId: 'item-1',
                taskGroup
            }
        });

        fireEvent.click(getAllByLabelText('Press to show task note')[0]);
        await waitFor(() => expect(getByText('note-1')).toBeVisible());
        expect(container).toMatchSnapshot();
        fireEvent.keyDown(getByText('note-1'), {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            charCode: 27
        });
        await waitFor(() => expect(queryByText('note-1')).toBeNull());
    });
    it('task click', async () => {
        const onRowClick = jest.fn();

        const { component, container } = render(DeliveryTable, {
            props: {
                totalScoreText: 'Total score',
                taskGroup
            }
        });

        component.$on('rowClick', e => {
            onRowClick(e.detail);
        });
        container.querySelectorAll('tbody > tr').forEach(row => {
            fireEvent.click(row);
            expect(onRowClick).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'task-id-1',
                    deliveryId: 'task-delivery-id-1'
                })
            );
        });
    });
    it('renders selected row correctly', async () => {
        const scrollIntoViewMock = jest.fn();
        window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

        const { container } = render(DeliveryTable, {
            props: {
                totalScoreText: 'Total score',
                activeTaskId: 'task-id-1',
                scrollIntoCurrentTask: true,
                taskGroup
            }
        });
        expect(scrollIntoViewMock).toHaveBeenCalled();

        expect(container).toMatchSnapshot();
    });
});
