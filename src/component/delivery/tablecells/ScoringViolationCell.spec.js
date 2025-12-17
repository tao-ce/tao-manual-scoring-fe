// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2021 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('module');

import { render, fireEvent } from '@testing-library/svelte';
import ScoringViolationCell from './ScoringViolationCell.svelte';

describe('ScoringViolationCell', () => {
    it('it renders correctly, click shows dialog', () => {
        const { container, queryByLabelText } = render(ScoringViolationCell, {
            props: {
                data: {
                    scoringViolation: {
                        description: "The scorer doesn't understand the context of the item",
                        reportee: {
                            firstName: 'Johny',
                            lastName: 'Cage',
                            username: 'johnycage'
                        },
                        itemTitle: 'English'
                    }
                }
            }
        });
        expect(container).toMatchSnapshot();
        fireEvent.click(queryByLabelText('Press to show note'));
        expect(container).toMatchSnapshot();
    });
});
